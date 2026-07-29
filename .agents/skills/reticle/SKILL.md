---
name: reticle
description: Runtime verification and proof layer for web applications using Reticle MCP tools to assert over network, React render stream, app state, console logs, and DOM elements.
---

# Reticle — Runtime Verification & Proof Layer

Reticle is the proof layer for AI coding agents. It connects to the running app over MCP and verifies code edits by inspecting the runtime program — network, store state, signals, console errors, and the React fiber tree — rather than relying solely on screenshots or visual assumptions.

## Reticle Core Workflow

When completing code modifications or introducing new features in frontend and fullstack web applications:

1. **Verify Runtime Behavior**: Use Reticle MCP tools (`reticle_assert`, `reticle_inspect`, `reticle_events`) to test the running app on every edit.
2. **Network Assertions**: Assert that backend APIs return `200 OK` and expected payloads upon user interactions (e.g., form submissions, button clicks, API sync).
3. **State & React Commit Stream**: Inspect store state changes and verify component lifecycle signals without relying on static inspection alone.
4. **Console & Error Zero-Tolerance**: Ensure `console.error` logs are absent (`absent: true`) during key user flows.
5. **Exact File & Line Failure Tracing**: When an assertion fails, Reticle provides the exact `{ file, line }` causing the issue to fix immediately before marking a task complete.

## Reticle Assertion Pattern

```jsonc
reticle_assert({
  predicate: {
    allOf: [
      { kind: "net", method: "POST", urlContains: "/api/order", status: 200 },
      { kind: "element", query: { role: "dialog", name: "Order confirmed" }, state: "visible" },
      { kind: "signal", name: "order:saved" },
      { kind: "console", level: "error", absent: true }
    ]
  }
})
```

## Installation & Setup Reference

```bash
# Register Reticle MCP globally for coding agents
npx @reticlehq/server init

# Vite + React integration
npm i -D @reticlehq/react @reticlehq/vite-plugin
```
