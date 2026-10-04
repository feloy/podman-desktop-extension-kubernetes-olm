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

import type { KubernetesObject } from '@podman-desktop/kubernetes-dashboard-extension-api';
import { stringify } from 'yaml';
import type {
  CatalogSourceInfo,
  PackageManifestChannelDetails,
  PackageManifestDetails,
  PackageManifestInfo,
  ProvidedApiInfo,
  ResourceReference,
} from '@kubernetes-olm/channels';

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

export function toCatalogSourceInfo(item: KubernetesObject): CatalogSourceInfo {
  const metadata = asRecord(item.metadata);
  const spec = asRecord(item['spec']);
  const status = asRecord(item['status']);
  const connectionState = asRecord(status['connectionState']);
  const registryPoll = asRecord(asRecord(spec['updateStrategy'])['registryPoll']);
  return {
    namespace: asString(metadata['namespace']) ?? '',
    name: asString(metadata['name']) ?? '',
    creationTimestamp: asString(metadata['creationTimestamp']),
    displayName: asString(spec['displayName']),
    publisher: asString(spec['publisher']),
    sourceType: asString(spec['sourceType']),
    image: asString(spec['image']),
    address: asString(spec['address']),
    priority: typeof spec['priority'] === 'number' ? spec['priority'] : undefined,
    connectionState: asString(connectionState['lastObservedState']),
    pollInterval: asString(registryPoll['interval']),
    latestPoll: asString(status['latestImageRegistryPoll']),
  };
}

export function toPackageManifestInfo(item: KubernetesObject): PackageManifestInfo {
  const metadata = asRecord(item.metadata);
  const status = asRecord(item['status']);
  const { channels, defaultChannel, currentVersion } = packageManifestChannels(status);
  return {
    namespace: asString(metadata['namespace']) ?? '',
    name: asString(metadata['name']) ?? '',
    displayName: asString(currentVersion['displayName']),
    shortDescription: asString(asRecord(currentVersion['annotations'])['description']),
    provider: asString(asRecord(status['provider'])['name']) ?? asString(asRecord(currentVersion['provider'])['name']),
    catalogSource: asString(status['catalogSource']),
    catalogSourceNamespace: asString(status['catalogSourceNamespace']),
    catalogSourceDisplayName: asString(status['catalogSourceDisplayName']),
    defaultChannel,
    version: asString(currentVersion['version']),
    channels: channels.map(c => asString(c['name'])).filter((name): name is string => !!name),
  };
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : [];
}

function packageManifestChannels(status: Record<string, unknown>): {
  channels: Record<string, unknown>[];
  defaultChannel: string | undefined;
  currentVersion: Record<string, unknown>;
} {
  const channels = Array.isArray(status['channels']) ? status['channels'].map(asRecord) : [];
  const defaultChannel = asString(status['defaultChannel']);
  // the version information is taken from the current version of the default channel
  const channel = channels.find(c => c['name'] === defaultChannel) ?? channels[0];
  return { channels, defaultChannel, currentVersion: asRecord(channel?.['currentCSVDesc']) };
}

// the annotations containing JSON can be invalid: they are then ignored
function parseJson(value: unknown): unknown {
  if (typeof value !== 'string') {
    return undefined;
  }
  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
}

// the labels of the infrastructure features, from the `features.operators.openshift.io/<feature>` annotations
// and the values of the `operators.openshift.io/infrastructure-features` annotation
const FEATURE_LABELS: Record<string, string> = {
  disconnected: 'Disconnected',
  'fips-compliant': 'FIPS compliant',
  fips: 'FIPS compliant',
  'proxy-aware': 'Proxy aware',
  'tls-profiles': 'TLS profiles',
  'token-auth-aws': 'AWS token authentication',
  'token-auth-azure': 'Azure token authentication',
  'token-auth-gcp': 'GCP token authentication',
  cnf: 'Cloud-native network function',
  cni: 'Container network interface',
  csi: 'Container storage interface',
};
const FEATURE_ANNOTATION_PREFIX = 'features.operators.openshift.io/';

function toFeatures(annotations: Record<string, unknown>): string[] {
  const features = new Set<string>();
  for (const [key, value] of Object.entries(annotations)) {
    if (key.startsWith(FEATURE_ANNOTATION_PREFIX) && value === 'true') {
      const feature = key.slice(FEATURE_ANNOTATION_PREFIX.length);
      features.add(FEATURE_LABELS[feature] ?? feature);
    }
  }
  for (const feature of asStringArray(parseJson(annotations['operators.openshift.io/infrastructure-features']))) {
    features.add(FEATURE_LABELS[feature.toLowerCase()] ?? feature);
  }
  return Array.from(features);
}

function toResourceReference(value: unknown): ResourceReference | undefined {
  const resource = asRecord(value);
  const apiVersion = asString(resource['apiVersion']);
  const kind = asString(resource['kind']);
  if (!apiVersion || !kind) {
    return undefined;
  }
  return { apiVersion, kind, name: asString(asRecord(resource['metadata'])['name']) };
}

// the version of an apiVersion (`group/version`, or `version` for the core group)
function versionOf(apiVersion: unknown): string | undefined {
  return asString(apiVersion)?.split('/').pop();
}

function toProvidedApis(currentVersion: Record<string, unknown>): ProvidedApiInfo[] {
  const annotations = asRecord(currentVersion['annotations']);
  const owned = (definitions: unknown): Record<string, unknown>[] => {
    const list = asRecord(definitions)['owned'];
    return Array.isArray(list) ? list.map(asRecord) : [];
  };
  const internalObjects = new Set(
    asStringArray(parseJson(annotations['operators.operatorframework.io/internal-objects'])),
  );
  const crds: ProvidedApiInfo[] = owned(currentVersion['customresourcedefinitions']).map(crd => {
    const name = asString(crd['name']) ?? '';
    return {
      type: 'CustomResourceDefinition',
      name,
      kind: asString(crd['kind']) ?? '',
      version: asString(crd['version']) ?? '',
      displayName: asString(crd['displayName']),
      description: asString(crd['description']),
      internal: internalObjects.has(name),
      examples: [],
    };
  });
  // the APIs served by an aggregated API server deployed by the operator, as described in the CSV format
  // (`group`, `version`, `kind`, `name`, `displayName`, `description`, ...)
  const apiServices: ProvidedApiInfo[] = owned(currentVersion['apiservicedefinitions']).map(api => {
    const name = asString(api['name']) ?? '';
    const group = asString(api['group']);
    return {
      type: 'APIService',
      name: group ? `${name}.${group}` : name,
      kind: asString(api['kind']) ?? '',
      version: asString(api['version']) ?? '',
      displayName: asString(api['displayName']),
      description: asString(api['description']),
      internal: false,
      examples: [],
    };
  });
  const apis = [...crds, ...apiServices];

  // the examples are attached to the API of the same kind, preferably of the same version
  const examples = parseJson(annotations['alm-examples']);
  const examplesMetadata = asRecord(parseJson(annotations['alm-examples-metadata']));
  for (const example of Array.isArray(examples) ? examples.map(asRecord) : []) {
    const sameKind = apis.filter(api => api.kind === example['kind']);
    const api = sameKind.find(api => api.version === versionOf(example['apiVersion'])) ?? sameKind[0];
    if (!api) {
      continue;
    }
    const name = asString(asRecord(example['metadata'])['name']);
    api.examples.push({
      name,
      description: name ? asString(asRecord(examplesMetadata[name])['description']) : undefined,
      yaml: stringify(example),
    });
  }
  return apis;
}

function toChannelDetails(channel: Record<string, unknown>): PackageManifestChannelDetails {
  const currentVersion = asRecord(channel['currentCSVDesc']);
  const annotations = asRecord(currentVersion['annotations']);
  const records = (value: unknown): Record<string, unknown>[] => (Array.isArray(value) ? value.map(asRecord) : []);
  return {
    name: asString(channel['name']) ?? '',
    currentCSV: asString(channel['currentCSV']),
    version: asString(currentVersion['version']),
    displayName: asString(currentVersion['displayName']),
    shortDescription: asString(annotations['description']),
    description: asString(currentVersion['description']),
    capabilities: asString(annotations['capabilities']),
    categories: asString(annotations['categories']),
    keywords: asStringArray(currentVersion['keywords']),
    maturity: asString(currentVersion['maturity']),
    minKubeVersion: asString(currentVersion['minKubeVersion']),
    maxKubeVersion: asString(annotations['operatorhub.io/ui-metadata-max-k8s-version']),
    certified: { true: true, false: false }[String(annotations['certified']).toLowerCase()],
    suggestedNamespace:
      asString(annotations['operatorframework.io/suggested-namespace']) ??
      asString(
        asRecord(asRecord(parseJson(annotations['operatorframework.io/suggested-namespace-template']))['metadata'])[
          'name'
        ],
      ),
    initializationResource: toResourceReference(parseJson(annotations['operatorframework.io/initialization-resource'])),
    features: toFeatures(annotations),
    validSubscriptions: asStringArray(parseJson(annotations['operators.openshift.io/valid-subscription'])),
    skipRange: asString(annotations['olm.skipRange']),
    installModes: records(currentVersion['installModes'])
      .filter(mode => mode['supported'] === true)
      .map(mode => asString(mode['type']))
      .filter((type): type is string => !!type),
    containerImage: asString(annotations['containerImage']),
    createdAt: asString(annotations['createdAt']),
    repository: asString(annotations['repository']),
    support: asString(annotations['support']),
    links: records(currentVersion['links'])
      .map(link => ({ name: asString(link['name']) ?? '', url: asString(link['url']) ?? '' }))
      .filter(link => !!link.url),
    maintainers: records(currentVersion['maintainers'])
      .map(maintainer => ({ name: asString(maintainer['name']), email: asString(maintainer['email']) }))
      .filter(maintainer => maintainer.name ?? maintainer.email),
    providedApis: toProvidedApis(currentVersion),
    versions: records(channel['entries'])
      .map(entry => ({ name: asString(entry['name']) ?? '', version: asString(entry['version']) }))
      .filter(entry => !!entry.name),
  };
}

export function toPackageManifestDetails(item: KubernetesObject): PackageManifestDetails {
  const { channels } = packageManifestChannels(asRecord(item['status']));
  return {
    ...toPackageManifestInfo(item),
    channelsDetails: channels.map(toChannelDetails),
  };
}
