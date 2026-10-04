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

/**
 * Maps the state of the connection to the registry of a catalog source (`status.connectionState.lastObservedState`)
 * to a status of the StatusIcon component.
 *
 * The CRD does not define the possible values: OLM reports the connectivity state of its gRPC connection
 * to the registry (IDLE, CONNECTING, READY, TRANSIENT_FAILURE, SHUTDOWN).
 */
export function toStatusIconStatus(connectionState: string): string {
  switch (connectionState) {
    case 'READY':
      return 'RUNNING';
    case 'CONNECTING':
    case 'IDLE':
      return 'STARTING';
    case '':
      return 'UNKNOWN';
    default:
      return 'DEGRADED';
  }
}
