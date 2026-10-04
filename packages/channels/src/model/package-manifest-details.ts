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

import type { PackageManifestInfo } from './package-manifest-info';

/**
 * Identifies a PackageManifest. The name is not enough: the OLM packageserver returns one PackageManifest
 * with the same name for each catalog providing a package.
 */
export interface PackageManifestKey {
  catalogSourceNamespace: string;
  catalogSource: string;
  name: string;
}

export function isSamePackageManifest(a: PackageManifestKey, b: PackageManifestKey): boolean {
  return (
    a.catalogSourceNamespace === b.catalogSourceNamespace && a.catalogSource === b.catalogSource && a.name === b.name
  );
}

/** A version of the operator available in a channel (an entry of the channel). */
export interface PackageManifestVersionInfo {
  /** The name of the CSV of the version, e.g. `mongodb-kubernetes.v1.12.0`. */
  name: string;
  version?: string;
}

/**
 * An API provided by the operator: a CustomResourceDefinition owned by its CSV, or an API served by
 * an aggregated API server the operator deploys (APIService).
 */
/** An example of a resource of a provided API, from the `alm-examples` annotation of the CSV. */
export interface ApiExampleInfo {
  /** The name of the example resource. */
  name?: string;
  description?: string;
  /** The example resource, in YAML. */
  yaml: string;
}

export interface ProvidedApiInfo {
  type: 'CustomResourceDefinition' | 'APIService';
  /** The name of the resource, e.g. `mongodb.mongodb.com`. */
  name: string;
  kind: string;
  version: string;
  displayName?: string;
  description?: string;
  /** True for the APIs the operator declares as internal, not meant to be used directly. */
  internal: boolean;
  examples: ApiExampleInfo[];
}

/** A resource to create once the operator is installed. */
export interface ResourceReference {
  apiVersion: string;
  kind: string;
  name?: string;
}

export interface LinkInfo {
  name: string;
  url: string;
}

export interface MaintainerInfo {
  name?: string;
  email?: string;
}

/**
 * A channel of a package, with the information of the operator version the channel currently provides
 * (its current CSV). This information can differ between the channels of a package.
 */
export interface PackageManifestChannelDetails {
  name: string;
  /** The name of the current CSV of the channel, e.g. `mongodb-kubernetes.v1.13.0`. */
  currentCSV?: string;
  version?: string;
  displayName?: string;
  /** A one-line description of the operator. */
  shortDescription?: string;
  /** The long description of the operator, in markdown. */
  description?: string;
  capabilities?: string;
  categories?: string;
  keywords: string[];
  maturity?: string;
  minKubeVersion?: string;
  maxKubeVersion?: string;
  /** True when the operator is certified, undefined when unknown. */
  certified?: boolean;
  /** The namespace in which the operator is meant to be installed. */
  suggestedNamespace?: string;
  /** A resource to create once the operator is installed, for it to be functional. */
  initializationResource?: ResourceReference;
  /** The infrastructure features supported by the operator (e.g. `Disconnected`, `FIPS compliant`). */
  features: string[];
  /** The subscriptions required to use the operator. */
  validSubscriptions: string[];
  /** The range of versions which can be upgraded directly to the current version of the channel. */
  skipRange?: string;
  /** The install modes supported by the operator (OwnNamespace, SingleNamespace, MultiNamespace, AllNamespaces). */
  installModes: string[];
  containerImage?: string;
  createdAt?: string;
  repository?: string;
  support?: string;
  links: LinkInfo[];
  maintainers: MaintainerInfo[];
  providedApis: ProvidedApiInfo[];
  /** The versions available in the channel, newest first. */
  versions: PackageManifestVersionInfo[];
}

/**
 * The details of a PackageManifest, with the information of each of its channels.
 * The fields inherited from PackageManifestInfo (display name, version) are the ones of the default channel.
 */
export interface PackageManifestDetails extends PackageManifestInfo {
  channelsDetails: PackageManifestChannelDetails[];
}

export interface PackageManifestDetailsData {
  details: PackageManifestDetails[];
}
