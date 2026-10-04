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

import { env, Uri } from '@podman-desktop/api';
import { beforeEach, expect, test, vi } from 'vitest';
import { SystemApiImpl } from './system-api';

beforeEach(() => {
  vi.resetAllMocks();
  console.warn = vi.fn();
});

test('opens a web page', async () => {
  const uri = { toString: (): string => 'https://kuadrant.io' } as unknown as Uri;
  vi.mocked(Uri.parse).mockReturnValue(uri);
  vi.mocked(env.openExternal).mockResolvedValue(true);
  await expect(new SystemApiImpl().openExternal('https://kuadrant.io')).resolves.toBeTruthy();
  expect(Uri.parse).toHaveBeenCalledWith('https://kuadrant.io');
  expect(env.openExternal).toHaveBeenCalledWith(uri);
});

test.each(['javascript:alert(1)', 'file:///etc/passwd', 'mailto:someone@example.com'])(
  'does not open %s',
  async url => {
    await expect(new SystemApiImpl().openExternal(url)).resolves.toBeFalsy();
    expect(env.openExternal).not.toHaveBeenCalled();
  },
);
