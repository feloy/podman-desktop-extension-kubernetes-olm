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

import { describe, expect, test } from 'vitest';
import { toCatalogSourceInfo, toPackageManifestDetails, toPackageManifestInfo } from './resource-transformers';
import type { KubernetesObject } from '@podman-desktop/kubernetes-dashboard-extension-api';

describe('toCatalogSourceInfo', () => {
  test('transforms a full catalog source object', () => {
    const item: KubernetesObject = {
      apiVersion: 'operators.coreos.com/v1alpha1',
      kind: 'CatalogSource',
      metadata: {
        name: 'operatorhubio-catalog',
        namespace: 'olm',
        creationTimestamp: '2026-01-01T00:00:00Z',
      },
      spec: {
        displayName: 'Community Operators',
        publisher: 'OperatorHub.io',
        sourceType: 'grpc',
        image: 'quay.io/operatorhubio/catalog:latest',
        priority: -100,
        updateStrategy: {
          registryPoll: {
            interval: '60m',
          },
        },
      },
      status: {
        latestImageRegistryPoll: '2026-10-04T06:35:22Z',
        connectionState: {
          address: 'operatorhubio-catalog.olm.svc:50051',
          lastObservedState: 'READY',
        },
      },
    };
    expect(toCatalogSourceInfo(item)).toEqual({
      namespace: 'olm',
      name: 'operatorhubio-catalog',
      creationTimestamp: '2026-01-01T00:00:00Z',
      displayName: 'Community Operators',
      publisher: 'OperatorHub.io',
      sourceType: 'grpc',
      image: 'quay.io/operatorhubio/catalog:latest',
      address: undefined,
      priority: -100,
      connectionState: 'READY',
      pollInterval: '60m',
      latestPoll: '2026-10-04T06:35:22Z',
    });
  });

  test('transforms a catalog source without spec nor status', () => {
    const item: KubernetesObject = {
      metadata: { name: 'empty', namespace: 'default' },
    };
    expect(toCatalogSourceInfo(item)).toEqual({
      namespace: 'default',
      name: 'empty',
      creationTimestamp: undefined,
      displayName: undefined,
      publisher: undefined,
      sourceType: undefined,
      image: undefined,
      address: undefined,
      priority: undefined,
      connectionState: undefined,
      pollInterval: undefined,
      latestPoll: undefined,
    });
  });
});

describe('toPackageManifestInfo', () => {
  test('transforms a package manifest, with the version of the default channel', () => {
    const item: KubernetesObject = {
      apiVersion: 'packages.operators.coreos.com/v1',
      kind: 'PackageManifest',
      metadata: { name: 'mongodb-kubernetes', namespace: 'olm', labels: { catalog: 'operatorhubio-catalog' } },
      status: {
        catalogSource: 'operatorhubio-catalog',
        catalogSourceDisplayName: 'Community Operators',
        catalogSourceNamespace: 'olm',
        catalogSourcePublisher: 'OperatorHub.io',
        defaultChannel: 'stable',
        packageName: 'mongodb-kubernetes',
        provider: { name: 'MongoDB, Inc' },
        channels: [
          {
            name: 'fast',
            currentCSV: 'mongodb-kubernetes.v1.14.0',
            currentCSVDesc: { displayName: 'MongoDB (fast)', version: '1.14.0' },
          },
          {
            name: 'stable',
            currentCSV: 'mongodb-kubernetes.v1.13.0',
            currentCSVDesc: { displayName: 'MongoDB Controllers for Kubernetes', version: '1.13.0' },
          },
        ],
      },
    };
    expect(toPackageManifestInfo(item)).toEqual({
      namespace: 'olm',
      name: 'mongodb-kubernetes',
      displayName: 'MongoDB Controllers for Kubernetes',
      provider: 'MongoDB, Inc',
      catalogSource: 'operatorhubio-catalog',
      catalogSourceNamespace: 'olm',
      catalogSourceDisplayName: 'Community Operators',
      defaultChannel: 'stable',
      version: '1.13.0',
      channels: ['fast', 'stable'],
    });
  });

  test('uses the first channel when the default channel is not found, and the provider of the version', () => {
    const item: KubernetesObject = {
      metadata: { name: 'pkg', namespace: 'olm' },
      status: {
        defaultChannel: 'missing',
        channels: [{ name: 'alpha', currentCSVDesc: { version: '0.1.0', provider: { name: 'Someone' } } }],
      },
    };
    expect(toPackageManifestInfo(item)).toEqual(
      expect.objectContaining({ version: '0.1.0', provider: 'Someone', channels: ['alpha'] }),
    );
  });

  test('transforms a package manifest without status', () => {
    expect(toPackageManifestInfo({ metadata: { name: 'pkg', namespace: 'olm' } })).toEqual({
      namespace: 'olm',
      name: 'pkg',
      displayName: undefined,
      provider: undefined,
      catalogSource: undefined,
      catalogSourceNamespace: undefined,
      catalogSourceDisplayName: undefined,
      defaultChannel: undefined,
      version: undefined,
      channels: [],
    });
  });
});

describe('toPackageManifestDetails', () => {
  const item: KubernetesObject = {
    metadata: { name: 'kuadrant-operator', namespace: 'olm' },
    status: {
      catalogSource: 'operatorhubio-catalog',
      catalogSourceNamespace: 'olm',
      defaultChannel: 'stable',
      channels: [
        {
          name: 'alpha',
          currentCSV: 'kuadrant-operator.v0.3.1',
          currentCSVDesc: { version: '0.3.1', description: 'Old description' },
          entries: [{ name: 'kuadrant-operator.v0.3.1', version: '0.3.1' }],
        },
        {
          name: 'stable',
          currentCSV: 'kuadrant-operator.v0.11.1',
          currentCSVDesc: {
            displayName: 'Kuadrant Operator',
            version: '0.11.1',
            description: '## Deprecated',
            keywords: ['api', 'rate-limiting'],
            maturity: 'alpha',
            minKubeVersion: '1.19.0',
            installModes: [
              { type: 'OwnNamespace', supported: false },
              { type: 'AllNamespaces', supported: true },
            ],
            annotations: {
              capabilities: 'Basic Install',
              categories: 'Integration & Delivery',
              containerImage: 'quay.io/kuadrant/kuadrant-operator:v0.11.0',
              createdAt: '2024-10-02T20:30:45Z',
              repository: 'https://github.com/Kuadrant/kuadrant-operator',
              support: 'kuadrant',
            },
            links: [{ name: 'Kuadrant Docs', url: 'https://kuadrant.io' }, { name: 'no url' }],
            maintainers: [{ name: 'Someone', email: 'someone@example.com' }, {}],
            customresourcedefinitions: {
              owned: [
                {
                  name: 'authpolicies.kuadrant.io',
                  kind: 'AuthPolicy',
                  version: 'v1beta2',
                  displayName: 'AuthPolicy',
                  description: 'Auth policies',
                },
              ],
            },
            apiservicedefinitions: {
              owned: [
                {
                  group: 'metrics.kuadrant.io',
                  version: 'v1',
                  kind: 'Metric',
                  name: 'metrics',
                  displayName: 'Metric',
                  description: 'Served metrics',
                },
              ],
            },
          },
          entries: [
            { name: 'kuadrant-operator.v0.11.1', version: '0.11.1' },
            { name: 'kuadrant-operator.v0.11.0', version: '0.11.0' },
            { version: 'no name' },
          ],
        },
      ],
    },
  };

  test('transforms the details of each channel', () => {
    const details = toPackageManifestDetails(item);
    // the summary fields are the ones of the default channel
    expect(details).toEqual(
      expect.objectContaining({ name: 'kuadrant-operator', version: '0.11.1', defaultChannel: 'stable' }),
    );
    expect(details.channelsDetails).toHaveLength(2);
    expect(details.channelsDetails[0]).toEqual(
      expect.objectContaining({
        name: 'alpha',
        currentCSV: 'kuadrant-operator.v0.3.1',
        version: '0.3.1',
        description: 'Old description',
        providedApis: [],
        versions: [{ name: 'kuadrant-operator.v0.3.1', version: '0.3.1' }],
      }),
    );
    expect(details.channelsDetails[1]).toEqual(
      expect.objectContaining({
        name: 'stable',
        currentCSV: 'kuadrant-operator.v0.11.1',
        version: '0.11.1',
        displayName: 'Kuadrant Operator',
        description: '## Deprecated',
        capabilities: 'Basic Install',
        categories: 'Integration & Delivery',
        keywords: ['api', 'rate-limiting'],
        maturity: 'alpha',
        minKubeVersion: '1.19.0',
        installModes: ['AllNamespaces'],
        containerImage: 'quay.io/kuadrant/kuadrant-operator:v0.11.0',
        createdAt: '2024-10-02T20:30:45Z',
        repository: 'https://github.com/Kuadrant/kuadrant-operator',
        support: 'kuadrant',
        links: [{ name: 'Kuadrant Docs', url: 'https://kuadrant.io' }],
        maintainers: [{ name: 'Someone', email: 'someone@example.com' }],
        providedApis: [
          {
            type: 'CustomResourceDefinition',
            name: 'authpolicies.kuadrant.io',
            kind: 'AuthPolicy',
            version: 'v1beta2',
            displayName: 'AuthPolicy',
            description: 'Auth policies',
            internal: false,
            examples: [],
          },
          {
            type: 'APIService',
            name: 'metrics.metrics.kuadrant.io',
            kind: 'Metric',
            version: 'v1',
            displayName: 'Metric',
            description: 'Served metrics',
            internal: false,
            examples: [],
          },
        ],
        versions: [
          { name: 'kuadrant-operator.v0.11.1', version: '0.11.1' },
          { name: 'kuadrant-operator.v0.11.0', version: '0.11.0' },
        ],
      }),
    );
  });

  test('transforms a package manifest without channels', () => {
    expect(toPackageManifestDetails({ metadata: { name: 'pkg', namespace: 'olm' } }).channelsDetails).toEqual([]);
  });

  describe('annotations', () => {
    function channelWith(currentCSVDesc: Record<string, unknown>): KubernetesObject {
      return {
        metadata: { name: 'pkg', namespace: 'olm' },
        status: { defaultChannel: 'stable', channels: [{ name: 'stable', currentCSVDesc }] },
      };
    }

    test('reads the information of the annotations', () => {
      const details = toPackageManifestDetails(
        channelWith({
          annotations: {
            description: 'A short description',
            certified: 'true',
            'operatorhub.io/ui-metadata-max-k8s-version': '1.30',
            'operatorframework.io/suggested-namespace': 'my-operator',
            'operatorframework.io/initialization-resource':
              '{"apiVersion": "example.com/v1", "kind": "Config", "metadata": {"name": "config"}}',
            'features.operators.openshift.io/disconnected': 'true',
            'features.operators.openshift.io/fips-compliant': 'false',
            'features.operators.openshift.io/proxy-aware': 'true',
            'operators.openshift.io/infrastructure-features': '["disconnected", "csi"]',
            'operators.openshift.io/valid-subscription': '["OpenShift Platform Plus"]',
            'olm.skipRange': '>=1.0.0 <1.2.0',
          },
        }),
      );
      expect(details.shortDescription).toEqual('A short description');
      expect(details.channelsDetails[0]).toEqual(
        expect.objectContaining({
          shortDescription: 'A short description',
          certified: true,
          maxKubeVersion: '1.30',
          suggestedNamespace: 'my-operator',
          initializationResource: { apiVersion: 'example.com/v1', kind: 'Config', name: 'config' },
          features: ['Disconnected', 'Proxy aware', 'Container storage interface'],
          validSubscriptions: ['OpenShift Platform Plus'],
          skipRange: '>=1.0.0 <1.2.0',
        }),
      );
    });

    test('reads the suggested namespace from its template', () => {
      const details = toPackageManifestDetails(
        channelWith({
          annotations: {
            'operatorframework.io/suggested-namespace-template':
              '{"kind":"Namespace","metadata":{"name":"from-template"}}',
            certified: 'false',
          },
        }),
      );
      expect(details.channelsDetails[0]?.suggestedNamespace).toEqual('from-template');
      expect(details.channelsDetails[0]?.certified).toEqual(false);
    });

    test('marks the internal APIs and attaches the examples to their API', () => {
      const details = toPackageManifestDetails(
        channelWith({
          customresourcedefinitions: {
            owned: [
              { name: 'kafkas.kafka.strimzi.io', kind: 'Kafka', version: 'v1beta2' },
              { name: 'kafkas.kafka.strimzi.io', kind: 'Kafka', version: 'v1' },
              { name: 'internals.kafka.strimzi.io', kind: 'Internal', version: 'v1' },
            ],
          },
          annotations: {
            'operators.operatorframework.io/internal-objects': '["internals.kafka.strimzi.io"]',
            'alm-examples': JSON.stringify([
              {
                apiVersion: 'kafka.strimzi.io/v1',
                kind: 'Kafka',
                metadata: { name: 'my-cluster' },
                spec: { replicas: 3 },
              },
              { apiVersion: 'kafka.strimzi.io/v1alpha1', kind: 'Internal', metadata: { name: 'other-version' } },
              { apiVersion: 'example.com/v1', kind: 'Unknown', metadata: { name: 'ignored' } },
            ]),
            'alm-examples-metadata': '{"my-cluster": {"description": "Example Kafka cluster"}}',
          },
        }),
      );
      const [kafkaV1beta2, kafkaV1, internal] = details.channelsDetails[0]?.providedApis ?? [];
      expect(kafkaV1beta2?.examples).toEqual([]);
      expect(kafkaV1?.examples).toEqual([
        {
          name: 'my-cluster',
          description: 'Example Kafka cluster',
          yaml: 'apiVersion: kafka.strimzi.io/v1\nkind: Kafka\nmetadata:\n  name: my-cluster\nspec:\n  replicas: 3\n',
        },
      ]);
      expect(kafkaV1?.internal).toBeFalsy();
      // an example of another version is attached to an API of the same kind
      expect(internal?.internal).toBeTruthy();
      expect(internal?.examples.map(example => example.name)).toEqual(['other-version']);
    });

    test('ignores the annotations containing invalid JSON', () => {
      const details = toPackageManifestDetails(
        channelWith({
          customresourcedefinitions: { owned: [{ name: 'a.example.com', kind: 'A', version: 'v1' }] },
          annotations: {
            'alm-examples': '[{ invalid',
            'operators.operatorframework.io/internal-objects': 'not json',
            'operatorframework.io/initialization-resource': '{',
          },
        }),
      );
      expect(details.channelsDetails[0]?.providedApis[0]).toEqual(
        expect.objectContaining({ internal: false, examples: [] }),
      );
      expect(details.channelsDetails[0]?.initializationResource).toBeUndefined();
    });
  });
});
