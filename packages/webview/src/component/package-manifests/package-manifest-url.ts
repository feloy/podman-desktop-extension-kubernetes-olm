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

import type { PackageManifestKey } from '@kubernetes-olm/channels';

export const PACKAGE_MANIFESTS_URL = '/packagemanifests';

export type PackageManifestTab = 'description' | 'apis' | 'versions' | 'summary';

// the URL of the details of a package: the catalog is part of it, as several catalogs can provide a package
// the details open on the first tab, the description
export function packageManifestDetailsUrl(key: PackageManifestKey, tab: PackageManifestTab = 'description'): string {
  return [PACKAGE_MANIFESTS_URL, key.catalogSourceNamespace, key.catalogSource, key.name, tab]
    .map((part, index) => (index === 0 ? part : encodeURIComponent(part)))
    .join('/');
}
