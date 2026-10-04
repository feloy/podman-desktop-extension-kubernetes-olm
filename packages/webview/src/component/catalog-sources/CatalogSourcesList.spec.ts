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
import type { CatalogSourcesData } from '@kubernetes-olm/channels';
import CatalogSourcesList from './CatalogSourcesList.svelte';
import { StatesMocks } from '/@/tests/state-mocks';
import { FakeStateObject } from '/@/state/util/fake-state-object.svelte';

const statesMocks = new StatesMocks();
let catalogSourcesMock: FakeStateObject<CatalogSourcesData, void>;

beforeEach(() => {
  vi.resetAllMocks();
  statesMocks.reset();
  catalogSourcesMock = new FakeStateObject<CatalogSourcesData, void>();
  statesMocks.mock<CatalogSourcesData, void>('stateCatalogSourcesData', catalogSourcesMock);
});

test('subscribes to catalog sources on mount', () => {
  render(CatalogSourcesList);
  expect(catalogSourcesMock.subscribe).toHaveBeenCalled();
});

test('displays the catalog sources', async () => {
  catalogSourcesMock.setData({
    catalogSources: [
      {
        name: 'operatorhubio-catalog',
        namespace: 'olm',
        displayName: 'Community Operators',
        publisher: 'OperatorHub.io',
        sourceType: 'grpc',
        connectionState: 'READY',
      },
    ],
  });
  render(CatalogSourcesList);
  // the display name is displayed as name, the namespace and name of the resource are not displayed
  await vi.waitFor(() => expect(screen.getByText('Community Operators')).toBeInTheDocument());
  expect(screen.queryByText('operatorhubio-catalog')).not.toBeInTheDocument();
  expect(screen.queryByText('olm')).not.toBeInTheDocument();
  expect(screen.getByText('OperatorHub.io')).toBeInTheDocument();
  // the connection state is displayed as a tooltip of the status icon, not as text
  expect(screen.queryByText('READY')).not.toBeInTheDocument();
  const statusTrigger = screen.getByRole('status').closest('[data-testid="tooltip-trigger"]');
  await fireEvent.mouseEnter(statusTrigger!);
  expect(screen.getByRole('tooltip')).toHaveTextContent('READY');
  // the catalog icon is colorized depending on the connection state
  expect(screen.getByRole('status')).toHaveAttribute('title', 'RUNNING');
  expect(screen.getByRole('status').querySelector('svg')).toBeInTheDocument();
});

test('displays the resource name of a catalog source without display name', async () => {
  catalogSourcesMock.setData({
    catalogSources: [{ name: 'my-catalog', namespace: 'olm' }],
  });
  render(CatalogSourcesList);
  await vi.waitFor(() => expect(screen.getByText('my-catalog')).toBeInTheDocument());
});

test('displays the poll interval of a polled catalog source, with the last poll as tooltip', async () => {
  const latestPoll = '2026-10-04T06:35:22Z';
  catalogSourcesMock.setData({
    catalogSources: [
      {
        name: 'polled',
        namespace: 'olm',
        sourceType: 'grpc',
        image: 'quay.io/catalog:latest',
        pollInterval: '60m',
        latestPoll,
      },
    ],
  });
  render(CatalogSourcesList);
  await vi.waitFor(() => expect(screen.getByText('Every 60m')).toBeInTheDocument());
  await fireEvent.mouseEnter(screen.getByText('Every 60m').closest('[data-testid="tooltip-trigger"]')!);
  expect(screen.getByRole('tooltip')).toHaveTextContent(`Last poll: ${new Date(latestPoll).toLocaleString()}`);
});

test('displays a catalog source not yet polled', async () => {
  catalogSourcesMock.setData({
    catalogSources: [
      { name: 'polled', namespace: 'olm', sourceType: 'grpc', image: 'quay.io/catalog:latest', pollInterval: '10m' },
    ],
  });
  render(CatalogSourcesList);
  await vi.waitFor(() => expect(screen.getByText('Every 10m')).toBeInTheDocument());
  await fireEvent.mouseEnter(screen.getByText('Every 10m').closest('[data-testid="tooltip-trigger"]')!);
  expect(screen.getByRole('tooltip')).toHaveTextContent('Not polled yet');
});

test('displays a catalog source with an image and without update strategy as manually updated', async () => {
  catalogSourcesMock.setData({
    catalogSources: [{ name: 'manual', namespace: 'olm', sourceType: 'grpc', image: 'quay.io/catalog:latest' }],
  });
  render(CatalogSourcesList);
  await vi.waitFor(() => expect(screen.getByText('Manual')).toBeInTheDocument());
  await fireEvent.mouseEnter(screen.getByText('Manual').closest('[data-testid="tooltip-trigger"]')!);
  expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
});

test.each([
  {
    name: 'an image',
    catalogSource: { sourceType: 'grpc', image: 'quay.io/operatorhubio/catalog:latest', address: 'ignored:50051' },
    label: 'Image',
    tip: 'quay.io/operatorhubio/catalog:latest',
  },
  {
    name: 'an address',
    catalogSource: { sourceType: 'grpc', address: 'registry.example.com:50051' },
    label: 'Address',
    tip: 'registry.example.com:50051',
  },
])(
  'displays the type of a grpc catalog source with $name, with its source as tooltip',
  async ({ catalogSource, label, tip }) => {
    catalogSourcesMock.setData({
      catalogSources: [{ name: 'cs', namespace: 'olm', ...catalogSource }],
    });
    render(CatalogSourcesList);
    await vi.waitFor(() => expect(screen.getByText(label)).toBeInTheDocument());
    await fireEvent.mouseEnter(screen.getByText(label).closest('[data-testid="tooltip-trigger"]')!);
    expect(screen.getByRole('tooltip')).toHaveTextContent(tip);
  },
);

test('displays the type of a configmap catalog source as is', async () => {
  catalogSourcesMock.setData({
    catalogSources: [{ name: 'cs', namespace: 'olm', sourceType: 'configmap' }],
  });
  render(CatalogSourcesList);
  await vi.waitFor(() => expect(screen.getByText('configmap')).toBeInTheDocument());
  await fireEvent.mouseEnter(screen.getByText('configmap').closest('[data-testid="tooltip-trigger"]')!);
  expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
});

test.each([
  {
    name: 'an address',
    catalogSource: { sourceType: 'grpc', address: 'registry.example.com:50051', pollInterval: '60m' },
    tip: 'Updated by the registry at registry.example.com:50051',
  },
  { name: 'a configmap', catalogSource: { sourceType: 'configmap' }, tip: 'Updated when its ConfigMap changes' },
  { name: 'an internal source', catalogSource: { sourceType: 'internal' }, tip: 'Updated when its ConfigMap changes' },
])('does not display updates for a catalog source with $name', async ({ catalogSource, tip }) => {
  catalogSourcesMock.setData({
    catalogSources: [{ name: 'cs', namespace: 'olm', ...catalogSource }],
  });
  render(CatalogSourcesList);
  await vi.waitFor(() => expect(screen.getByText('—')).toBeInTheDocument());
  // an update strategy set on a catalog source without image is not displayed, as it is not polled
  expect(screen.queryByText('Every 60m')).not.toBeInTheDocument();
  await fireEvent.mouseEnter(screen.getByText('—').closest('[data-testid="tooltip-trigger"]')!);
  expect(screen.getByRole('tooltip')).toHaveTextContent(tip);
});

test('displays an empty message when there is no catalog source', async () => {
  catalogSourcesMock.setData({ catalogSources: [] });
  render(CatalogSourcesList);
  await vi.waitFor(() => expect(screen.getByText('No catalog sources found.')).toBeInTheDocument());
});

test('does not display selection checkboxes', async () => {
  catalogSourcesMock.setData({
    catalogSources: [{ name: 'operatorhubio-catalog', namespace: 'olm' }],
  });
  render(CatalogSourcesList);
  await vi.waitFor(() => expect(screen.getByText('operatorhubio-catalog')).toBeInTheDocument());
  expect(screen.queryAllByRole('checkbox')).toHaveLength(0);
});
