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

/**
 * A summary of an OLM v0 CatalogSource (`operators.coreos.com/v1alpha1`).
 */
export interface CatalogSourceInfo {
  namespace: string;
  name: string;
  creationTimestamp?: string;
  displayName?: string;
  publisher?: string;
  /** `grpc`, `configmap` or `internal`. */
  sourceType?: string;
  /** The index image served by a `grpc` catalog. */
  image?: string;
  /** The address of an existing registry server, used instead of `image`. */
  address?: string;
  priority?: number;
  /** The last observed state of the connection to the registry, e.g. `READY` or `TRANSIENT_FAILURE`. */
  connectionState?: string;
  /**
   * The interval between two polls of the registry for a new version of the catalog image
   * (`spec.updateStrategy.registryPoll.interval`, e.g. `60m`). Undefined when the catalog is not polled.
   */
  pollInterval?: string;
  /** When the registry has been polled for the last time (`status.latestImageRegistryPoll`). */
  latestPoll?: string;
}

export interface CatalogSourcesData {
  catalogSources: CatalogSourceInfo[];
}
