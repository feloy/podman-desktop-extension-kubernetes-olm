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

import { inject, injectable } from 'inversify';
import { StateCatalogSourcesData } from '/@/state/catalog-sources.svelte';
import { StatePackageManifestsData } from '/@/state/package-manifests.svelte';
import { StatePackageManifestDetailsData } from '/@/state/package-manifest-details.svelte';

@injectable()
export class States {
  @inject(StateCatalogSourcesData)
  private _stateCatalogSourcesData: StateCatalogSourcesData;

  get stateCatalogSourcesData(): StateCatalogSourcesData {
    return this._stateCatalogSourcesData;
  }

  @inject(StatePackageManifestsData)
  private _statePackageManifestsData: StatePackageManifestsData;

  get statePackageManifestsData(): StatePackageManifestsData {
    return this._statePackageManifestsData;
  }

  @inject(StatePackageManifestDetailsData)
  private _statePackageManifestDetailsData: StatePackageManifestDetailsData;

  get statePackageManifestDetailsData(): StatePackageManifestDetailsData {
    return this._statePackageManifestDetailsData;
  }
}
