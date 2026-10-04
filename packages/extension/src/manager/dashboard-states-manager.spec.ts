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

import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { CATALOG_SOURCES_RESOURCE, DashboardStatesManager } from './dashboard-states-manager';
import type {
  ConfigurationChangeEvent,
  Configuration,
  Disposable,
  ExtensionContext,
  TelemetryLogger,
} from '@podman-desktop/api';
import { configuration, extensions, kubernetes } from '@podman-desktop/api';
import type {
  ContextsHealthsInfo,
  KubernetesDashboardExtensionApi,
  KubernetesDashboardSubscriber,
  ResourceUpdateInfo,
} from '@podman-desktop/kubernetes-dashboard-extension-api';
import { InversifyBinding } from '/@/inject/inversify-binding';
import type { RpcExtension } from '@kubernetes-olm/rpc';
import type { Container } from 'inversify';
import { DashboardApiManager } from '/@/manager/dashboard-api-manager';

let container: Container;
let fireKubeconfigUpdate: () => void;
let fireConfigurationChange: (section: string) => void;
let catalogNamespace: string | undefined;

const dashboardApiManagerMock: DashboardApiManager = {
  getApi: vi.fn(),
} as unknown as DashboardApiManager;

const REACHABLE_CONTEXTS_HEALTH: ContextsHealthsInfo = {
  healths: [{ contextName: 'ctx1', checking: false, reachable: true, offline: false }],
};

const UNREACHABLE_CONTEXTS_HEALTH: ContextsHealthsInfo = {
  healths: [{ contextName: 'ctx1', checking: true, reachable: false, offline: false }],
};

beforeEach(async () => {
  vi.resetAllMocks();
  vi.mocked(kubernetes.onDidUpdateKubeconfig).mockImplementation(listener => {
    fireKubeconfigUpdate = (): void => listener({ type: 'UPDATE', location: {} } as never);
    return { dispose: vi.fn() };
  });
  vi.mocked(extensions.onDidChange).mockReturnValue({ dispose: vi.fn() } as unknown as Disposable);
  catalogNamespace = undefined;
  vi.mocked(configuration.getConfiguration).mockReturnValue({
    get: vi.fn().mockImplementation((_key: string, defaultValue: string) => catalogNamespace ?? defaultValue),
  } as unknown as Configuration);
  vi.mocked(configuration.onDidChangeConfiguration).mockImplementation(listener => {
    fireConfigurationChange = (section: string): void =>
      listener({ affectsConfiguration: (s: string) => s === section } as ConfigurationChangeEvent);
    return { dispose: vi.fn() } as unknown as Disposable;
  });

  const inversifyBinding = new InversifyBinding({} as RpcExtension, {} as ExtensionContext, {} as TelemetryLogger);
  container = await inversifyBinding.initBindings();
  (await container.rebindAsync(DashboardApiManager)).toConstantValue(dashboardApiManagerMock);
});

test('subscriber is undefined when the dashboard extension is not installed', () => {
  vi.mocked(dashboardApiManagerMock.getApi).mockReturnValue(undefined);
  const manager = container.get(DashboardStatesManager);
  manager.init();
  expect(manager.getSubscriber()).toBeUndefined();
  expect(extensions.onDidChange).toHaveBeenCalled();
  manager.dispose();
});

describe('dashboard extension is installed', () => {
  let manager: DashboardStatesManager;
  let fireContextsHealth: (event: ContextsHealthsInfo) => void;
  let fireResourceUpdate: (event: ResourceUpdateInfo) => void;
  const resourceSubscriptionDispose = vi.fn();

  beforeEach(() => {
    const subscriber = {
      dispose: vi.fn(),
      onContextsHealth: vi.fn().mockImplementation((listener: (event: ContextsHealthsInfo) => void) => {
        fireContextsHealth = listener;
        return { dispose: vi.fn() };
      }),
      onResourceUpdate: vi.fn().mockImplementation((_options, listener: (event: ResourceUpdateInfo) => void) => {
        fireResourceUpdate = listener;
        return { dispose: resourceSubscriptionDispose };
      }),
    } as unknown as KubernetesDashboardSubscriber;
    vi.mocked(dashboardApiManagerMock.getApi).mockReturnValue({
      getSubscriber: () => subscriber,
    } as unknown as KubernetesDashboardExtensionApi);
    manager = container.get(DashboardStatesManager);
    manager.init();
  });

  afterEach(() => {
    manager.dispose();
  });

  test('does not subscribe to catalog sources while no context is reachable', () => {
    fireContextsHealth(UNREACHABLE_CONTEXTS_HEALTH);
    expect(manager.getSubscriber()?.onResourceUpdate).not.toHaveBeenCalled();
  });

  test('subscribes to catalog sources once a context is reachable', () => {
    fireContextsHealth(REACHABLE_CONTEXTS_HEALTH);
    fireContextsHealth(REACHABLE_CONTEXTS_HEALTH);
    expect(manager.getSubscriber()?.onResourceUpdate).toHaveBeenCalledOnce();
    expect(manager.getSubscriber()?.onResourceUpdate).toHaveBeenCalledWith(
      { resourceName: 'catalogsources.operators.coreos.com', namespace: 'olm' },
      expect.any(Function),
    );
  });

  test('transforms catalog sources received from the dashboard and fires a change', () => {
    const listener = vi.fn();
    manager.onCatalogSourcesChange(listener);
    fireContextsHealth(REACHABLE_CONTEXTS_HEALTH);
    fireResourceUpdate({
      resources: [
        {
          resourceName: CATALOG_SOURCES_RESOURCE,
          namespace: 'olm',
          items: [{ metadata: { name: 'cs1', namespace: 'olm' }, spec: { sourceType: 'grpc' } }],
        },
        {
          resourceName: CATALOG_SOURCES_RESOURCE,
          namespace: 'other',
          items: [{ metadata: { name: 'ignored', namespace: 'other' } }],
        },
        { resourceName: 'other', items: [{ metadata: { name: 'ignored' } }] },
      ],
    });
    expect(listener).toHaveBeenCalled();
    expect(manager.getCatalogSources().catalogSources).toEqual([
      expect.objectContaining({ name: 'cs1', namespace: 'olm', sourceType: 'grpc' }),
    ]);
  });

  test('clears catalog sources and resubscribes after a kubeconfig update', () => {
    vi.useFakeTimers();
    try {
      fireContextsHealth(REACHABLE_CONTEXTS_HEALTH);
      manager.setCatalogSources({ catalogSources: [{ name: 'cs1', namespace: 'olm' }] });

      fireKubeconfigUpdate();
      expect(resourceSubscriptionDispose).toHaveBeenCalled();
      expect(manager.getCatalogSources().catalogSources).toEqual([]);

      vi.advanceTimersByTime(1_000);
      expect(manager.getSubscriber()?.onResourceUpdate).toHaveBeenCalledTimes(2);
    } finally {
      vi.useRealTimers();
    }
  });

  test('watches the catalog sources in the namespace configured in the settings', () => {
    catalogNamespace = 'openshift-marketplace';
    fireContextsHealth(REACHABLE_CONTEXTS_HEALTH);
    expect(manager.getSubscriber()?.onResourceUpdate).toHaveBeenCalledWith(
      { resourceName: CATALOG_SOURCES_RESOURCE, namespace: 'openshift-marketplace' },
      expect.any(Function),
    );
  });

  test('resubscribes when the catalog namespace setting changes', () => {
    vi.useFakeTimers();
    try {
      fireContextsHealth(REACHABLE_CONTEXTS_HEALTH);
      manager.setCatalogSources({ catalogSources: [{ name: 'cs1', namespace: 'olm' }] });

      catalogNamespace = 'openshift-marketplace';
      fireConfigurationChange('kubernetes-olm.catalog-namespace');
      expect(resourceSubscriptionDispose).toHaveBeenCalled();
      expect(manager.getCatalogSources().catalogSources).toEqual([]);

      vi.advanceTimersByTime(1_000);
      expect(manager.getSubscriber()?.onResourceUpdate).toHaveBeenLastCalledWith(
        { resourceName: CATALOG_SOURCES_RESOURCE, namespace: 'openshift-marketplace' },
        expect.any(Function),
      );
    } finally {
      vi.useRealTimers();
    }
  });

  test('ignores changes of other settings', () => {
    fireContextsHealth(REACHABLE_CONTEXTS_HEALTH);
    fireConfigurationChange('kubernetes-olm.other');
    expect(resourceSubscriptionDispose).not.toHaveBeenCalled();
  });
});
