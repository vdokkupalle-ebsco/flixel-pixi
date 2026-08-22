# `@flixel-pixi/editor-protocol`

Private, dependency-free communication primitives for Flixel-Pixi editors and isolated live previews.

The package defines a versioned message envelope, payloads for project loading and preview control, strict validation, diagnostics, selection synchronization, and a transport-independent peer with request/response correlation.

## Why projects are sent as strings

`project.load` carries deterministic JSON produced by `@flixel-pixi/schemas`. The preview parses and validates that JSON after receipt. Keeping the serialized boundary makes messages safe to send through `postMessage`, workers, test transports, or a future remote preview without coupling this package to a specific schema release.

## Status

This workspace is private while the protocol is exercised by the first editor and preview host. Its API and message vocabulary may change before publication.

## Transport boundary

Consumers provide two operations:

```ts
interface ProtocolTransport {
  postMessage(message: unknown): void;
  subscribe(listener: (message: unknown) => void): () => void;
}
```

Browser adapters should validate `event.origin` and `event.source` before forwarding `event.data` to protocol subscribers. Origin security belongs to the adapter because this dependency-free package has no knowledge of windows or deployment URLs.
