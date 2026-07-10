# Feature Boundary

Each feature is a vertical slice. Other features must import only through the nearest public `index.ts`.

Allowed:

```ts
import { signInFeatureKey } from "@/src/features/identity";
```

Avoid:

```ts
import { internalHelper } from "@/src/features/identity/sign-in/application/internal-helper";
```

Leaf features may add `contracts`, `domain`, `application`, `server`, `ui`, and `tests` folders only when the slice needs them.
