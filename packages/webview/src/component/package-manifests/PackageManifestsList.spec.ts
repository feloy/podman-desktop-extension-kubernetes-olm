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

import '@testing-library/jest-dom/vitest';

import { fireEvent, render, screen } from '@testing-library/svelte';
import { beforeEach, expect, test, vi } from 'vitest';
import type { PackageManifestInfo, PackageManifestsData } from '@kubernetes-olm/channels';
import PackageManifestsList from './PackageManifestsList.svelte';
import { StatesMocks } from '/@/tests/state-mocks';
import { FakeStateObject } from '/@/state/util/fake-state-object.svelte';

const statesMocks = new StatesMocks();
let packageManifestsMock: FakeStateObject<PackageManifestsData, void>;

const MONGODB: PackageManifestInfo = {
  name: 'mongodb-kubernetes',
  namespace: 'olm',
  displayName: 'MongoDB Controllers for Kubernetes',
  provider: 'MongoDB, Inc',
  catalogSource: 'operatorhubio-catalog',
  catalogSourceNamespace: 'olm',
  catalogSourceDisplayName: 'Community Operators',
  defaultChannel: 'stable',
  version: '1.13.0',
  channels: ['fast', 'stable'],
};

beforeEach(() => {
  vi.resetAllMocks();
  statesMocks.reset();
  packageManifestsMock = new FakeStateObject<PackageManifestsData, void>();
  statesMocks.mock<PackageManifestsData, void>('statePackageManifestsData', packageManifestsMock);
});

function triggerOf(text: string): Element {
  return screen.getByText(text).closest('[data-testid="tooltip-trigger"]')!;
}

test('subscribes to package manifests while displayed', () => {
  const { unmount } = render(PackageManifestsList);
  expect(packageManifestsMock.subscribe).toHaveBeenCalledOnce();
  unmount();
});

test('displays the package manifests', async () => {
  packageManifestsMock.setData({ packageManifests: [MONGODB] });
  render(PackageManifestsList);

  await vi.waitFor(() => expect(screen.getByText('MongoDB Controllers for Kubernetes')).toBeInTheDocument());
  expect(screen.getByText('MongoDB, Inc')).toBeInTheDocument();
  expect(screen.getByText('Community Operators')).toBeInTheDocument();
  expect(screen.getByText('stable')).toBeInTheDocument();
  // the number of channels available in addition to the default one
  expect(screen.getByLabelText('1 more')).toHaveTextContent('+1');
  expect(screen.getByText('1.13.0')).toBeInTheDocument();
  expect(screen.queryAllByRole('checkbox')).toHaveLength(0);
});

test('displays the package name, the catalog resource and the channels as tooltips', async () => {
  packageManifestsMock.setData({ packageManifests: [MONGODB] });
  render(PackageManifestsList);
  await vi.waitFor(() => expect(screen.getByText('MongoDB Controllers for Kubernetes')).toBeInTheDocument());

  await fireEvent.mouseEnter(triggerOf('MongoDB Controllers for Kubernetes'));
  expect(screen.getByRole('tooltip')).toHaveTextContent('mongodb-kubernetes');
  await fireEvent.mouseLeave(triggerOf('MongoDB Controllers for Kubernetes'));

  await fireEvent.mouseEnter(triggerOf('Community Operators'));
  expect(screen.getByRole('tooltip')).toHaveTextContent('olm/operatorhubio-catalog');
  await fireEvent.mouseLeave(triggerOf('Community Operators'));

  await fireEvent.mouseEnter(triggerOf('stable'));
  expect(screen.getByRole('tooltip')).toHaveTextContent('Channels: fast, stable');
});

test('displays the package name when there is no display name', async () => {
  packageManifestsMock.setData({
    packageManifests: [{ name: 'my-operator', namespace: 'olm', defaultChannel: 'alpha', channels: ['alpha'] }],
  });
  render(PackageManifestsList);
  await vi.waitFor(() => expect(screen.getByText('my-operator')).toBeInTheDocument());
  // a single channel: no count of other channels
  expect(screen.queryByText(/^\+\d+$/)).not.toBeInTheDocument();
  await fireEvent.mouseEnter(triggerOf('my-operator'));
  expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
});

test('displays the same package provided by two catalogs', async () => {
  packageManifestsMock.setData({
    packageManifests: [
      MONGODB,
      { ...MONGODB, catalogSource: 'other-catalog', catalogSourceDisplayName: 'Other Operators' },
    ],
  });
  render(PackageManifestsList);
  await vi.waitFor(() => expect(screen.getAllByText('MongoDB Controllers for Kubernetes')).toHaveLength(2));
  expect(screen.getByText('Other Operators')).toBeInTheDocument();
});

test('filters the package manifests with the search term', async () => {
  packageManifestsMock.setData({
    packageManifests: [
      MONGODB,
      { name: 'etcd', namespace: 'olm', displayName: 'etcd', provider: 'CNCF', channels: [] },
    ],
  });
  render(PackageManifestsList);
  await vi.waitFor(() => expect(screen.getByText('etcd')).toBeInTheDocument());

  await fireEvent.input(screen.getByRole('textbox'), { target: { value: 'mongodb, inc' } });

  await vi.waitFor(() => expect(screen.queryByText('etcd')).not.toBeInTheDocument());
  expect(screen.getByText('MongoDB Controllers for Kubernetes')).toBeInTheDocument();
});

test('displays an empty message when there is no package manifest', async () => {
  packageManifestsMock.setData({ packageManifests: [] });
  render(PackageManifestsList);
  await vi.waitFor(() => expect(screen.getByText('No package manifests found.')).toBeInTheDocument());
});
