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

export interface CatalogSourceUI {
  name: string;
  namespace: string;
  displayName: string;
  publisher: string;
  sourceType: string;
  /** The index image served by a `grpc` catalog. */
  image: string;
  /** The address of an existing registry server, used by a `grpc` catalog without image. */
  address: string;
  connectionState: string;
  created: Date | undefined;
  /** The interval between two polls of the registry, empty when the catalog is not polled. */
  pollInterval: string;
  latestPoll: Date | undefined;
}

export interface UpdatesDisplay {
  label: string;
  tip: string;
}

// describes how the catalog source is updated.
// Only a catalog running a registry from an image can be polled (`spec.updateStrategy.registryPoll`):
// it is polled at an interval, or updated manually by editing the catalog source.
// The other catalogs are updated by their own source: the registry they connect to, or their ConfigMap
export function updatesDisplay(catalogSource: CatalogSourceUI): UpdatesDisplay {
  if (catalogSource.sourceType === 'grpc' && catalogSource.image) {
    if (!catalogSource.pollInterval) {
      return { label: 'Manual', tip: '' };
    }
    return {
      label: `Every ${catalogSource.pollInterval}`,
      tip: catalogSource.latestPoll ? `Last poll: ${catalogSource.latestPoll.toLocaleString()}` : 'Not polled yet',
    };
  }
  if (catalogSource.sourceType === 'grpc' && catalogSource.address) {
    return { label: '—', tip: `Updated by the registry at ${catalogSource.address}` };
  }
  if (catalogSource.sourceType === 'configmap' || catalogSource.sourceType === 'internal') {
    return { label: '—', tip: 'Updated when its ConfigMap changes' };
  }
  return { label: '—', tip: '' };
}

export interface SourceTypeDisplay {
  label: string;
  // the image or address of the registry, displayed as tooltip
  tip: string;
}

// describes the source of a catalog: for a `grpc` catalog, whether OLM runs a registry from an image
// or connects to an existing registry (the image takes precedence over the address).
// Other source types (`configmap`, `internal`) are displayed as is
export function sourceTypeDisplay(catalogSource: CatalogSourceUI): SourceTypeDisplay {
  if (catalogSource.sourceType === 'grpc') {
    if (catalogSource.image) {
      return { label: 'Image', tip: catalogSource.image };
    }
    if (catalogSource.address) {
      return { label: 'Address', tip: catalogSource.address };
    }
  }
  return { label: catalogSource.sourceType, tip: '' };
}

// the name displayed for a catalog source: its display name, or its resource name when it has none
export function displayedName(catalogSource: CatalogSourceUI): string {
  return catalogSource.displayName || catalogSource.name;
}
