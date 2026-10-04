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
import { toCatalogSourceInfo } from './resource-transformers';
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
