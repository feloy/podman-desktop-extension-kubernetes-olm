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
import { API_SYSTEM, type SystemApi } from '@kubernetes-olm/channels';
import Markdown from './Markdown.svelte';
import { RemoteMocks } from '/@/tests/remote-mocks';

const remoteMocks = new RemoteMocks();

beforeEach(() => {
  vi.resetAllMocks();
  remoteMocks.reset();
  remoteMocks.mock(API_SYSTEM, { openExternal: vi.fn().mockResolvedValue(true) } as unknown as SystemApi);
});

test('renders the markdown', () => {
  render(Markdown, { markdown: '## Title\n\nSome **bold** text' });
  expect(screen.getByRole('heading', { name: 'Title' })).toBeInTheDocument();
  expect(screen.getByText('bold').tagName).toEqual('STRONG');
});

test('does not render raw HTML', () => {
  const { container } = render(Markdown, { markdown: '<img src="x" onerror="alert(1)">' });
  expect(container.querySelector('img')).toBeNull();
});

test('does not keep dangerous links', () => {
  const { container } = render(Markdown, { markdown: '[click](javascript:alert(1)) [web](https://example.com)' });
  const hrefs = Array.from(container.querySelectorAll('a')).map(a => a.getAttribute('href'));
  expect(hrefs).not.toContain('javascript:alert(1)');
  expect(hrefs).toContain('https://example.com');
});

test('a click on a link opens the page in the external browser, instead of navigating the webview', async () => {
  render(Markdown, { markdown: '[web](https://example.com)' });
  const link = screen.getByRole('link', { name: 'web' });
  const event = new MouseEvent('click', { bubbles: true, cancelable: true });
  link.dispatchEvent(event);
  expect(event.defaultPrevented).toBeTruthy();
  expect(remoteMocks.get(API_SYSTEM).openExternal).toHaveBeenCalledWith('https://example.com');
  await fireEvent.click(screen.getByText('web'));
});
