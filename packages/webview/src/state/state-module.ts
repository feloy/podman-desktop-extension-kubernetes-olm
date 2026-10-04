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

import { ContainerModule } from 'inversify';

import { States } from './states';
import { StateObject } from './util/state-object.svelte';
import { IDisposable } from '@kubernetes-olm/channels';
import { StateCatalogSourcesData } from '/@/state/catalog-sources.svelte';
import { StatePackageManifestsData } from '/@/state/package-manifests.svelte';
import { StatePackageManifestDetailsData } from '/@/state/package-manifest-details.svelte';

const statesModule = new ContainerModule(options => {
  options.bind(States).toSelf().inSingletonScope();

  options.bind(StateCatalogSourcesData).toSelf().inSingletonScope();
  options.bind(StateObject).toService(StateCatalogSourcesData);
  options.bind(IDisposable).toService(StateCatalogSourcesData);

  options.bind(StatePackageManifestsData).toSelf().inSingletonScope();
  options.bind(StateObject).toService(StatePackageManifestsData);
  options.bind(IDisposable).toService(StatePackageManifestsData);

  options.bind(StatePackageManifestDetailsData).toSelf().inSingletonScope();
  options.bind(StateObject).toService(StatePackageManifestDetailsData);
  options.bind(IDisposable).toService(StatePackageManifestDetailsData);
});

export { statesModule };
