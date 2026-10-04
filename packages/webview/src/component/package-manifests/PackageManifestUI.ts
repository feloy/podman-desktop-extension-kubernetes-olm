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

export interface PackageManifestUI {
  name: string;
  namespace: string;
  displayName: string;
  shortDescription: string;
  provider: string;
  catalogName: string;
  catalogNamespace: string;
  catalogDisplayName: string;
  defaultChannel: string;
  version: string;
  channels: string[];
}

// the name displayed for a package: the display name of the operator, or the package name when it has none
export function displayedName(packageManifest: PackageManifestUI): string {
  return packageManifest.displayName || packageManifest.name;
}

// the name displayed for the catalog providing a package: its display name, or its resource name when it has none
export function displayedCatalogName(packageManifest: PackageManifestUI): string {
  return packageManifest.catalogDisplayName || packageManifest.catalogName;
}
