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
import type { CatalogSourceInfo } from '@kubernetes-olm/channels';

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
