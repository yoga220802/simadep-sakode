# Infrastructure Boundary

Infrastructure modules contain adapters for databases, auth providers, queues, realtime, storage, and push delivery.

Rules:

- Infrastructure is server-only by default.
- Client components must not import from `src/infrastructure`.
- Feature application/domain code should depend on ports, not concrete infrastructure adapters.
- Add `import "@/src/infrastructure/server-only"` to backend adapter modules.
