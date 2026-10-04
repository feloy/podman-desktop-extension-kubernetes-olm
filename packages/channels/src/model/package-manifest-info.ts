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
 * A summary of an OLM PackageManifest (`packages.operators.coreos.com/v1`): an operator package
 * provided by a catalog source.
 *
 * The version information is the one of the current version (CSV) of the default channel of the package.
 */
export interface PackageManifestInfo {
  namespace: string;
  name: string;
  /** The display name of the operator, e.g. `MongoDB Controllers for Kubernetes`. */
  displayName?: string;
  /** A one-line description of the operator. */
  shortDescription?: string;
  provider?: string;
  catalogSource?: string;
  catalogSourceNamespace?: string;
  catalogSourceDisplayName?: string;
  defaultChannel?: string;
  /** The version of the operator in the default channel. */
  version?: string;
  /** The names of all the channels of the package. */
  channels: string[];
}

export interface PackageManifestsData {
  packageManifests: PackageManifestInfo[];
}
