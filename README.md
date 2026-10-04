# Kubernetes OLM Extension for Podman Desktop

A Podman Desktop extension for managing [Operator Lifecycle Manager](https://olm.operatorframework.io/) (OLM) resources in a Kubernetes cluster.

The extension does not access the cluster directly: it relies on the [Kubernetes Dashboard extension](https://github.com/podman-desktop/extension-kubernetes-dashboard) API to watch resources of the current context.

## Features

- List the OLM `CatalogSource` resources (`operators.coreos.com/v1alpha1`) of the current context (read-only)

## Settings

| Setting | Default | Description |
|---------|---------|-------------|
| **Kubernetes OLM: Catalog Namespace** | `olm` | Namespace in which the catalog sources are listed. Use `openshift-marketplace` on OpenShift. |

The catalog sources are watched through the generic custom resources support of the Kubernetes Dashboard extension
(subscription to `catalogsources.operators.coreos.com` in the configured namespace).

## Installation

Install the extension in Podman Desktop using one of the following OCI images:

| Channel | Image | Description |
|---------|-------|-------------|
| Release | `ghcr.io/feloy/podman-desktop-extension-kubernetes-olm:latest` | Latest stable release |
| Release (pinned) | `ghcr.io/feloy/podman-desktop-extension-kubernetes-olm:<version>` | Specific release version |
| Development | `ghcr.io/feloy/podman-desktop-extension-kubernetes-olm:next` | Latest build from `main` branch |
| Pull Request | `ghcr.io/feloy/podman-desktop-extension-kubernetes-olm/pr:<commit-sha>` | Build from a specific PR |

## Development

### Prerequisites

- Node.js >= 24.0.0
- pnpm 11.16.0
- The Kubernetes Dashboard extension installed in Podman Desktop

### Build

```bash
pnpm install
pnpm build
```

### Project layout

| Package | Description |
|---------|-------------|
| `packages/rpc` | RPC between the extension and its webview |
| `packages/channels` | RPC channels, APIs and data models shared by the extension and the webview |
| `packages/extension` | The Podman Desktop extension, subscribing to resources through the Dashboard API |
| `packages/webview` | The Svelte UI displayed in the extension webview |
