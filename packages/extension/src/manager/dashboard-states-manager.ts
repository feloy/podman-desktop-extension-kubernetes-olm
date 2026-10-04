/**********************************************************************
 * Copyright (C) 2026 Red Hat, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * SPDX-License-Identifier: Apache-2.0
 ***********************************************************************/

import { configuration, Disposable, extensions, kubernetes } from '@podman-desktop/api';
import type {
  ContextsHealthsInfo,
  KubernetesDashboardSubscriber,
} from '@podman-desktop/kubernetes-dashboard-extension-api';
import { inject, injectable } from 'inversify';
import { Emitter, Event } from '/@/types/emitter';
import { DashboardApiManager } from '/@/manager/dashboard-api-manager';
import type { CatalogSourcesData, PackageManifestsData } from '@kubernetes-olm/channels';
import { PACKAGE_MANIFESTS } from '@kubernetes-olm/channels';
import { toCatalogSourceInfo, toPackageManifestInfo } from '/@/manager/resource-transformers';
import { ChannelSubscriber } from '/@/manager/channel-subscriber';

/** The name under which the Dashboard extension watches CatalogSources, as `<plural>.<group>`. */
export const CATALOG_SOURCES_RESOURCE = 'catalogsources.operators.coreos.com';

/**
 * The name under which the Dashboard extension lists PackageManifests. They are served by the OLM packageserver,
 * which does not support watching them: the Dashboard lists them once when subscribed, so they are subscribed
 * only while displayed, to be listed again when displayed again.
 */
export const PACKAGE_MANIFESTS_RESOURCE = 'packagemanifests.packages.operators.coreos.com';

export const CONFIGURATION_SECTION = 'kubernetes-olm';
export const CATALOG_NAMESPACE_KEY = 'catalog-namespace';
export const DEFAULT_CATALOG_NAMESPACE = 'olm';

@injectable()
export class DashboardStatesManager implements Disposable {
  #onCatalogSourcesChange = new Emitter<void>();
  onCatalogSourcesChange: Event<void> = this.#onCatalogSourcesChange.event;

  #onPackageManifestsChange = new Emitter<void>();
  onPackageManifestsChange: Event<void> = this.#onPackageManifestsChange.event;

  #onContextsHealthChange = new Emitter<ContextsHealthsInfo>();
  onContextsHealthChange: Event<ContextsHealthsInfo> = this.#onContextsHealthChange.event;

  #subscriptions: Disposable[] = [];
  /** Resource subscriptions are bound to the context that was current when they were created. */
  #resourceSubscriptions: Disposable[] = [];
  #resourceResubscribeTimer: ReturnType<typeof setTimeout> | undefined;
  #subscriber: KubernetesDashboardSubscriber | undefined;

  #catalogSources: CatalogSourcesData = { catalogSources: [] };
  #packageManifests: PackageManifestsData = { packageManifests: [] };

  // the package manifests are subscribed to only while the webview subscribes to them
  #packageManifestsWanted = false;
  #packageManifestsSubscription: Disposable | undefined;

  @inject(DashboardApiManager)
  protected dashboardApiManager: DashboardApiManager;

  @inject(ChannelSubscriber)
  protected channelSubscriber: ChannelSubscriber;

  init(): void {
    const didChangeSubscription = extensions.onDidChange(() => {
      if (this.#connectToDashboard()) {
        didChangeSubscription.dispose();
      }
    });
    this.#subscriptions.push(didChangeSubscription);

    if (this.#connectToDashboard()) {
      didChangeSubscription.dispose();
    }

    // The dashboard resolves an onResourceUpdate subscription without a contextName to the
    // current context at subscription time. Recreate those subscriptions after a kubeconfig
    // update so they follow a context switch instead of remaining attached to the old context.
    this.#subscriptions.push(kubernetes.onDidUpdateKubeconfig(() => this.#invalidateResources()));

    const updatePackageManifestsWanted = (channelName: string): void => {
      if (channelName === PACKAGE_MANIFESTS.name) {
        this.#setPackageManifestsWanted(this.channelSubscriber.hasSubscribers(channelName));
      }
    };
    this.#subscriptions.push(this.channelSubscriber.onSubscribe(updatePackageManifestsWanted));
    this.#subscriptions.push(this.channelSubscriber.onUnsubscribe(updatePackageManifestsWanted));

    // The catalog sources are watched in a single namespace, follow its changes in the settings.
    this.#subscriptions.push(
      configuration.onDidChangeConfiguration(event => {
        if (event.affectsConfiguration(`${CONFIGURATION_SECTION}.${CATALOG_NAMESPACE_KEY}`)) {
          this.#invalidateResources();
        }
      }),
    );
  }

  getCatalogNamespace(): string {
    const namespace = configuration
      .getConfiguration(CONFIGURATION_SECTION)
      .get<string>(CATALOG_NAMESPACE_KEY, DEFAULT_CATALOG_NAMESPACE)
      ?.trim();
    return namespace || DEFAULT_CATALOG_NAMESPACE;
  }

  #connectToDashboard(): boolean {
    if (this.#subscriber) {
      return true;
    }

    const api = this.dashboardApiManager.getApi();
    if (!api) {
      return false;
    }

    this.#subscriber = api.getSubscriber();
    this.#subscriptions.push(this.#subscriber);

    this.#subscriptions.push(
      this.#subscriber.onContextsHealth((event: ContextsHealthsInfo) => {
        // Dashboard skips starting lazy informers when no current context exists yet.
        // The first health event is often empty (before kubeconfig is selected), so wait
        // until a context is reachable before subscribing.
        if (event.healths.some(health => health.reachable)) {
          this.#subscribeToResources();
        }
        this.#onContextsHealthChange.fire(event);
      }),
    );
    return true;
  }

  #resourcesSubscribed = false;

  #invalidateResources(): void {
    if (!this.#resourcesSubscribed) {
      return;
    }

    for (const subscription of this.#resourceSubscriptions) {
      subscription.dispose();
    }
    this.#resourceSubscriptions = [];
    this.#resourcesSubscribed = false;
    this.#unsubscribeFromPackageManifests();

    // Do not display the previous context while the dashboard establishes informers for the
    // newly selected one. The health event emitted after a context switch recreates the
    // subscriptions once the dashboard has selected the new current context.
    this.setCatalogSources({ catalogSources: [] });
    this.setPackageManifests({ packageManifests: [] });

    // A kubeconfig edit which leaves the current context unchanged does not necessarily emit a
    // health event. Recreate in that case too, after the dashboard has processed the change.
    clearTimeout(this.#resourceResubscribeTimer);
    this.#resourceResubscribeTimer = setTimeout(() => {
      this.#resourceResubscribeTimer = undefined;
      this.#subscribeToResources();
    }, 1_000);
  }

  #subscribeToResources(): void {
    if (this.#resourcesSubscribed || !this.#subscriber) {
      return;
    }
    clearTimeout(this.#resourceResubscribeTimer);
    this.#resourceResubscribeTimer = undefined;
    this.#resourcesSubscribed = true;

    const namespace = this.getCatalogNamespace();
    this.#resourceSubscriptions.push(
      this.#subscriber.onResourceUpdate({ resourceName: CATALOG_SOURCES_RESOURCE, namespace }, event => {
        this.setCatalogSources({
          catalogSources: event.resources.flatMap(r =>
            r.resourceName === CATALOG_SOURCES_RESOURCE && r.namespace === namespace
              ? r.items.map(item => toCatalogSourceInfo(item))
              : [],
          ),
        });
      }),
    );
    if (this.#packageManifestsWanted) {
      this.#subscribeToPackageManifests();
    }
  }

  #setPackageManifestsWanted(wanted: boolean): void {
    if (wanted === this.#packageManifestsWanted) {
      return;
    }
    this.#packageManifestsWanted = wanted;
    if (!wanted) {
      this.#unsubscribeFromPackageManifests();
      this.setPackageManifests({ packageManifests: [] });
    } else if (this.#resourcesSubscribed) {
      this.#subscribeToPackageManifests();
    }
  }

  #subscribeToPackageManifests(): void {
    if (this.#packageManifestsSubscription || !this.#subscriber) {
      return;
    }
    const namespace = this.getCatalogNamespace();
    this.#packageManifestsSubscription = this.#subscriber.onResourceUpdate(
      { resourceName: PACKAGE_MANIFESTS_RESOURCE, namespace },
      event => {
        this.setPackageManifests({
          packageManifests: event.resources.flatMap(r =>
            r.resourceName === PACKAGE_MANIFESTS_RESOURCE && r.namespace === namespace
              ? r.items.map(item => toPackageManifestInfo(item))
              : [],
          ),
        });
      },
    );
  }

  #unsubscribeFromPackageManifests(): void {
    this.#packageManifestsSubscription?.dispose();
    this.#packageManifestsSubscription = undefined;
  }

  dispose(): void {
    clearTimeout(this.#resourceResubscribeTimer);
    this.#resourceResubscribeTimer = undefined;
    for (const subscription of this.#resourceSubscriptions) {
      subscription.dispose();
    }
    this.#resourceSubscriptions = [];
    this.#unsubscribeFromPackageManifests();
    for (const subscription of this.#subscriptions) {
      subscription.dispose();
    }
    this.#subscriptions = [];
  }

  getSubscriber(): KubernetesDashboardSubscriber | undefined {
    return this.#subscriber;
  }

  getCatalogSources(): CatalogSourcesData {
    return this.#catalogSources;
  }

  setCatalogSources(catalogSources: CatalogSourcesData): void {
    this.#catalogSources = catalogSources;
    this.#onCatalogSourcesChange.fire();
  }

  getPackageManifests(): PackageManifestsData {
    return this.#packageManifests;
  }

  setPackageManifests(packageManifests: PackageManifestsData): void {
    this.#packageManifests = packageManifests;
    this.#onPackageManifestsChange.fire();
  }
}
