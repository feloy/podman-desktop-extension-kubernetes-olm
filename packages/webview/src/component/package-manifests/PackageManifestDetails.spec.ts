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

import { fireEvent, render, screen, within } from '@testing-library/svelte';
import * as svelte from 'svelte';
import { beforeEach, expect, test, vi } from 'vitest';
import {
  API_SYSTEM,
  type PackageManifestChannelDetails,
  type PackageManifestDetails,
  type PackageManifestDetailsData,
  type PackageManifestKey,
  type SystemApi,
} from '@kubernetes-olm/channels';
import PackageManifestDetailsPage from './PackageManifestDetails.svelte';
import PackageManifestDetailsSummary from './PackageManifestDetailsSummary.svelte';
import PackageManifestDetailsDescription from './PackageManifestDetailsDescription.svelte';
import PackageManifestDetailsApis from './PackageManifestDetailsApis.svelte';
import PackageManifestDetailsVersions from './PackageManifestDetailsVersions.svelte';
import { StatesMocks } from '/@/tests/state-mocks';
import { RemoteMocks } from '/@/tests/remote-mocks';
import { FakeStateObject } from '/@/state/util/fake-state-object.svelte';

const statesMocks = new StatesMocks();
const remoteMocks = new RemoteMocks();
let detailsMock: FakeStateObject<PackageManifestDetailsData, PackageManifestKey>;

function channel(
  name: string,
  version: string,
  fields: Partial<PackageManifestChannelDetails> = {},
): PackageManifestChannelDetails {
  return {
    name,
    currentCSV: `kuadrant-operator.v${version}`,
    version,
    displayName: 'Kuadrant Operator',
    keywords: [],
    installModes: [],
    features: [],
    validSubscriptions: [],
    links: [],
    maintainers: [],
    providedApis: [],
    versions: [{ name: `kuadrant-operator.v${version}`, version }],
    ...fields,
  };
}

function details(
  catalogSource: string,
  channelsDetails: PackageManifestChannelDetails[],
  defaultChannel = 'stable',
): PackageManifestDetails {
  return {
    name: 'kuadrant-operator',
    namespace: 'olm',
    displayName: 'Kuadrant Operator',
    provider: 'Red Hat',
    catalogSource,
    catalogSourceNamespace: 'olm',
    catalogSourceDisplayName: catalogSource === 'operatorhubio-catalog' ? 'Community Operators' : 'Kuadrant Operators',
    defaultChannel,
    version: channelsDetails.find(c => c.name === defaultChannel)?.version,
    channels: channelsDetails.map(c => c.name),
    channelsDetails,
  };
}

const KEY: PackageManifestKey = {
  catalogSourceNamespace: 'olm',
  catalogSource: 'operatorhubio-catalog',
  name: 'kuadrant-operator',
};

beforeEach(() => {
  vi.resetAllMocks();
  // the routes of the page get the webview API and their parent route (tinro) from the context
  vi.spyOn(svelte, 'getContext').mockImplementation(key => {
    if (key === 'WebviewApi') {
      return { setState: vi.fn(), getState: vi.fn() };
    }
    if (key === 'tinro') {
      return undefined;
    }
    throw new Error(`not supported mock in context: ${String(key)}`);
  });
  statesMocks.reset();
  remoteMocks.reset();
  remoteMocks.mock(API_SYSTEM, { openExternal: vi.fn().mockResolvedValue(true) } as unknown as SystemApi);
  detailsMock = new FakeStateObject<PackageManifestDetailsData, PackageManifestKey>();
  statesMocks.mock<PackageManifestDetailsData, PackageManifestKey>('statePackageManifestDetailsData', detailsMock);
});

test('subscribes to the details of the package', () => {
  render(PackageManifestDetailsPage, KEY);
  expect(detailsMock.subscribe).toHaveBeenCalledWith(KEY);
});

test('displays a spinner until the details are received', () => {
  render(PackageManifestDetailsPage, KEY);
  expect(screen.getByRole('status', { name: 'Loading the details of the package' })).toBeInTheDocument();
});

test('displays the default channel of the package of the requested catalog, with its tabs', async () => {
  detailsMock.setData({
    details: [
      details('kuadrant-operator-catalog', [channel('preview', '0.0.0')], 'preview'),
      details('operatorhubio-catalog', [channel('alpha', '0.3.1'), channel('stable', '0.11.1')]),
    ],
  });
  render(PackageManifestDetailsPage, KEY);
  await vi.waitFor(() => expect(screen.getByText('Kuadrant Operator')).toBeInTheDocument());
  expect(screen.getByText('0.11.1')).toBeInTheDocument();
  expect(screen.getByText('Community Operators · Red Hat')).toBeInTheDocument();
  const tabs = ['Description', 'Provided APIs', 'Versions', 'Summary'].map(tab => screen.getByText(tab));
  // the tabs are in this order
  for (let i = 1; i < tabs.length; i++) {
    expect(tabs[i - 1]!.compareDocumentPosition(tabs[i]!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  }
});

test('another channel can be selected', async () => {
  detailsMock.setData({
    details: [details('operatorhubio-catalog', [channel('alpha', '0.3.1'), channel('stable', '0.11.1')])],
  });
  render(PackageManifestDetailsPage, KEY);
  await vi.waitFor(() => expect(screen.getByText('0.11.1')).toBeInTheDocument());

  // the dropdown is labelled, its button displays the selected channel
  const selector = within(screen.getByLabelText('Channel'));
  await fireEvent.click(selector.getByRole('button', { name: 'stable (default)' }));
  await fireEvent.click(selector.getByRole('button', { name: 'alpha' }));

  await vi.waitFor(() => expect(screen.getByText('0.3.1')).toBeInTheDocument());
  expect(screen.queryByText('0.11.1')).not.toBeInTheDocument();
});

test('the channel selector is sized for the longest channel name', async () => {
  detailsMock.setData({
    details: [
      details('operatorhubio-catalog', [channel('singlenamespace-alpha', '0.3.1'), channel('stable', '0.11.1')]),
    ],
  });
  render(PackageManifestDetailsPage, KEY);
  await vi.waitFor(() => expect(screen.getByLabelText('Channel')).toBeInTheDocument());
  // "singlenamespace-alpha" is longer than "stable (default)"
  // jsdom does not compute calc() widths: the style attribute is checked
  expect(screen.getByLabelText('Channel').parentElement?.getAttribute('style')).toContain('width: calc(21ch + 3rem)');
});

test('there is no channel selector for a package with a single channel', async () => {
  detailsMock.setData({ details: [details('operatorhubio-catalog', [channel('stable', '0.11.1')])] });
  render(PackageManifestDetailsPage, KEY);
  await vi.waitFor(() => expect(screen.getByText('0.11.1')).toBeInTheDocument());
  expect(screen.queryByLabelText('Channel')).not.toBeInTheDocument();
});

test('the summary displays the package and the operator of the channel, and all the channels', async () => {
  const stable = channel('stable', '0.11.1', {
    capabilities: 'Basic Install',
    installModes: ['OwnNamespace', 'AllNamespaces'],
    repository: 'https://github.com/Kuadrant/kuadrant-operator',
    links: [
      { name: 'Docs', url: 'https://kuadrant.io' },
      { name: 'Bad', url: 'javascript:alert(1)' },
    ],
    maintainers: [{ name: 'Someone', email: 'someone@example.com' }],
    versions: [
      { name: 'kuadrant-operator.v0.11.1', version: '0.11.1' },
      { name: 'kuadrant-operator.v0.11.0', version: '0.11.0' },
    ],
  });
  const alpha = channel('alpha', '0.3.1');
  render(PackageManifestDetailsSummary, {
    details: details('operatorhubio-catalog', [alpha, stable]),
    channel: stable,
  });
  expect(screen.getByText('Community Operators (olm/operatorhubio-catalog)')).toBeInTheDocument();
  expect(screen.getByText('Basic Install')).toBeInTheDocument();
  expect(screen.getByText('OwnNamespace, AllNamespaces')).toBeInTheDocument();
  // the channels, with their version and their number of versions
  expect(screen.getByText('stable (default)')).toBeInTheDocument();
  expect(screen.getByText('0.3.1')).toBeInTheDocument();
  expect(screen.getByText('2')).toBeInTheDocument();
  // the links are opened in the external browser
  await fireEvent.click(screen.getByRole('link', { name: 'https://kuadrant.io' }));
  expect(remoteMocks.get(API_SYSTEM).openExternal).toHaveBeenCalledWith('https://kuadrant.io');
  expect(screen.getByRole('link', { name: 'https://github.com/Kuadrant/kuadrant-operator' })).toBeInTheDocument();
  // only http(s) links are displayed
  expect(screen.queryByText('Bad')).not.toBeInTheDocument();
  expect(screen.getByText('someone@example.com')).toBeInTheDocument();
});

test('the versions of the channel are listed, newest first, with the current one', () => {
  render(PackageManifestDetailsVersions, {
    channel: channel('stable', '0.11.1', {
      versions: [
        { name: 'kuadrant-operator.v0.9.0', version: '0.9.0' },
        { name: 'kuadrant-operator.v0.11.1', version: '0.11.1' },
        { name: 'kuadrant-operator.v0.10.0', version: '0.10.0' },
      ],
    }),
  });
  const cells = screen.getAllByText(/^0\.\d+\.\d+/).map(cell => cell.textContent?.trim());
  expect(cells).toEqual(['0.11.1 (current)', '0.10.0', '0.9.0']);
  expect(screen.getByText('kuadrant-operator.v0.10.0')).toBeInTheDocument();
});

test('the description of the channel is rendered from markdown', () => {
  render(PackageManifestDetailsDescription, {
    channel: channel('stable', '0.11.1', { description: '## Deprecated\n\nUse something else' }),
  });
  expect(screen.getByRole('heading', { name: 'Deprecated' })).toBeInTheDocument();
});

test('the links of the description are opened in the external browser', async () => {
  render(PackageManifestDetailsDescription, {
    channel: channel('stable', '0.11.1', { description: 'See [the docs](https://docs.kuadrant.io)' }),
  });
  await fireEvent.click(screen.getByText('the docs'));
  expect(remoteMocks.get(API_SYSTEM).openExternal).toHaveBeenCalledWith('https://docs.kuadrant.io');
});

test('a missing description is indicated', () => {
  render(PackageManifestDetailsDescription, { channel: channel('stable', '0.11.1') });
  expect(screen.getByText('The operator does not provide a description.')).toBeInTheDocument();
});

test('the provided APIs are displayed by kind, with their description', () => {
  render(PackageManifestDetailsApis, {
    channel: channel('stable', '0.11.1', {
      providedApis: [
        {
          type: 'CustomResourceDefinition',
          name: 'ratelimitpolicies.kuadrant.io',
          kind: 'RateLimitPolicy',
          version: 'v1beta2',
          description: 'Rate limit policies:\n- per route\n- per gateway',
          internal: false,
          examples: [],
        },
        {
          type: 'CustomResourceDefinition',
          name: 'authpolicies.kuadrant.io',
          kind: 'AuthPolicy',
          version: 'v1beta2',
          internal: false,
          examples: [],
        },
        {
          type: 'APIService',
          name: 'metrics.metrics.kuadrant.io',
          kind: 'Metric',
          version: 'v1',
          description: 'Served metrics',
          internal: false,
          examples: [],
        },
      ],
    }),
  });
  // a section per API, titled by its kind, sorted by kind
  expect(screen.getAllByRole('heading', { level: 2 }).map(heading => heading.textContent?.trim())).toEqual([
    'AuthPolicy',
    'Metric API service',
    'RateLimitPolicy',
  ]);
  // the description is rendered from markdown
  expect(screen.getByText('per gateway').tagName).toEqual('LI');
  expect(screen.getByText('No description provided.')).toBeInTheDocument();
  // the other values are not displayed
  expect(screen.queryByText('ratelimitpolicies.kuadrant.io')).not.toBeInTheDocument();
});

test('a kind provided in several versions is followed by the version', () => {
  render(PackageManifestDetailsApis, {
    channel: channel('stable', '0.11.1', {
      providedApis: [
        {
          type: 'CustomResourceDefinition',
          name: 'mappings.example.com',
          kind: 'Mapping',
          version: 'v1alpha3',
          internal: false,
          examples: [],
        },
        {
          type: 'CustomResourceDefinition',
          name: 'mappings.example.com',
          kind: 'Mapping',
          version: 'v1',
          internal: false,
          examples: [],
        },
      ],
    }),
  });
  expect(screen.getByRole('heading', { name: 'Mapping (v1alpha3)' })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Mapping (v1)' })).toBeInTheDocument();
});

test('the examples of an API are displayed on demand, in YAML', async () => {
  render(PackageManifestDetailsApis, {
    channel: channel('stable', '0.11.1', {
      providedApis: [
        {
          type: 'CustomResourceDefinition',
          name: 'kafkas.kafka.strimzi.io',
          kind: 'Kafka',
          version: 'v1',
          internal: false,
          examples: [
            {
              name: 'my-cluster',
              description: 'Example Kafka cluster',
              yaml: 'apiVersion: kafka.strimzi.io/v1\nkind: Kafka\n',
            },
          ],
        },
      ],
    }),
  });
  const toggle = screen.getByRole('button', { name: 'Example: my-cluster' });
  expect(screen.queryByLabelText('Example my-cluster')).not.toBeInTheDocument();
  await fireEvent.click(toggle);
  await vi.waitFor(() => expect(screen.getByLabelText('Example my-cluster')).toHaveTextContent('kind: Kafka'));
  expect(screen.getByText('Example Kafka cluster')).toBeInTheDocument();
});

test('the internal APIs are hidden unless requested', async () => {
  render(PackageManifestDetailsApis, {
    channel: channel('stable', '0.11.1', {
      providedApis: [
        {
          type: 'CustomResourceDefinition',
          name: 'a.example.com',
          kind: 'Public',
          version: 'v1',
          internal: false,
          examples: [],
        },
        {
          type: 'CustomResourceDefinition',
          name: 'b.example.com',
          kind: 'Hidden',
          version: 'v1',
          internal: true,
          examples: [],
        },
      ],
    }),
  });
  expect(screen.getAllByRole('heading', { level: 2 }).map(heading => heading.textContent?.trim())).toEqual(['Public']);

  await fireEvent.click(screen.getByRole('checkbox', { name: 'Show internal APIs (1)' }));

  await vi.waitFor(() =>
    expect(
      screen.getAllByRole('heading', { level: 2 }).map(heading => heading.textContent?.replace(/\s+/g, ' ').trim()),
    ).toEqual(['Hidden internal', 'Public']),
  );
});

test('there is no internal APIs toggle when there is no internal API', () => {
  render(PackageManifestDetailsApis, {
    channel: channel('stable', '0.11.1', {
      providedApis: [
        {
          type: 'CustomResourceDefinition',
          name: 'a.example.com',
          kind: 'Public',
          version: 'v1',
          internal: false,
          examples: [],
        },
      ],
    }),
  });
  expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
});

test('the summary displays the information of the annotations', () => {
  const stable = channel('stable', '0.11.1', {
    minKubeVersion: '1.25.0',
    maxKubeVersion: '1.30',
    certified: false,
    suggestedNamespace: 'kuadrant-system',
    features: ['Disconnected', 'Proxy aware'],
    validSubscriptions: ['OpenShift Platform Plus'],
    initializationResource: { apiVersion: 'kuadrant.io/v1beta1', kind: 'Kuadrant', name: 'kuadrant' },
  });
  render(PackageManifestDetailsSummary, { details: details('operatorhubio-catalog', [stable]), channel: stable });
  expect(screen.getByText('1.25.0 to 1.30')).toBeInTheDocument();
  expect(screen.getByText('No')).toBeInTheDocument();
  expect(screen.getByText('kuadrant-system')).toBeInTheDocument();
  expect(screen.getByText('Disconnected, Proxy aware')).toBeInTheDocument();
  expect(screen.getByText('OpenShift Platform Plus')).toBeInTheDocument();
  expect(screen.getByText('Kuadrant kuadrant (kuadrant.io/v1beta1)')).toBeInTheDocument();
});

test('the versions display the range of versions upgraded directly', () => {
  render(PackageManifestDetailsVersions, { channel: channel('stable', '0.11.1', { skipRange: '>=0.10.0 <0.11.1' }) });
  expect(screen.getByText('>=0.10.0 <0.11.1')).toBeInTheDocument();
});

test('the short description of the channel is the subtitle of the page', async () => {
  detailsMock.setData({
    details: [
      details('operatorhubio-catalog', [channel('stable', '0.11.1', { shortDescription: 'Kuadrant in short' })]),
    ],
  });
  render(PackageManifestDetailsPage, KEY);
  await vi.waitFor(() => expect(screen.getByText('Kuadrant in short')).toBeInTheDocument());
});

test('an operator without provided API is indicated', () => {
  render(PackageManifestDetailsApis, { channel: channel('stable', '0.11.1') });
  expect(screen.getByText('This operator does not provide any API.')).toBeInTheDocument();
});
