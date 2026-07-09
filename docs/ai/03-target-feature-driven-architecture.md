# 03 — Target Feature-Driven Architecture

## Architecture style

SIMADEP is a modular monolith. A single Next.js deployment contains UI, server actions, route handlers, domain/application code, and infrastructure adapters. Modules remain isolated so they can be extracted later without rewriting the business model.

## Target tree

```text
src/
├── app/
│   ├── (auth)/
│   ├── (dashboard)/
│   ├── api/
│   │   ├── auth/[...all]/route.ts
│   │   ├── realtime/auth/route.ts
│   │   ├── uploads/route.ts
│   │   ├── webhooks/
│   │   └── health/route.ts
│   ├── layout.tsx
│   └── globals.css
├── features/
│   ├── identity/
│   │   ├── sign-in/
│   │   ├── profile/
│   │   ├── manage-users/
│   │   └── manage-sessions/
│   ├── departments/
│   │   ├── browse-departments/
│   │   ├── manage-department/
│   │   └── manage-department-members/
│   ├── projects/
│   │   ├── browse-projects/
│   │   ├── view-project/
│   │   ├── create-project/
│   │   ├── update-project/
│   │   ├── archive-project/
│   │   └── manage-project-members/
│   ├── work-items/
│   │   ├── manage-milestones/
│   │   ├── create-task/
│   │   ├── update-task/
│   │   ├── change-task-status/
│   │   ├── manage-assignees/
│   │   └── manage-categories/
│   ├── collaboration/
│   │   ├── comments/
│   │   └── attachments/
│   ├── notifications/
│   │   ├── inbox/
│   │   └── device-registration/
│   ├── reporting/
│   │   ├── dashboard/
│   │   └── project-report/
│   └── audit/
│       └── activity-log/
├── infrastructure/
│   ├── auth/
│   ├── db/
│   │   ├── schema/
│   │   ├── migrations/
│   │   ├── connection.ts
│   │   └── transaction.ts
│   ├── events/
│   ├── jobs/
│   ├── realtime/
│   ├── storage/
│   └── push/
├── shared/
│   ├── contracts/
│   ├── errors/
│   ├── result/
│   ├── ui/
│   ├── utils/
│   └── validation/
└── test/
    ├── factories/
    ├── fakes/
    └── fixtures/
```

## Leaf feature structure

```text
create-project/
├── index.ts
├── contracts/
│   ├── create-project.input.ts
│   └── project.dto.ts
├── domain/
│   ├── project-policy.ts
│   └── project-events.ts
├── application/
│   ├── create-project.ts
│   └── project.repository.ts
├── infrastructure/
│   └── drizzle-project.repository.ts
├── server/
│   └── create-project.action.ts
├── ui/
│   └── create-project-form.tsx
└── tests/
    ├── create-project.unit.test.ts
    └── create-project.integration.test.ts
```

Create folders only when needed.

## Dependency direction

```text
UI / Route / Server Action
        ↓
Application use case
        ↓
Domain policy and repository ports
        ↓
Infrastructure adapters
```

Domain and application code cannot depend on framework implementation.

## Public API rule

Every feature exports allowed symbols from `index.ts`. Importing paths such as `features/projects/create-project/application/internal-helper` from another feature is forbidden.

## Shared code rule

Move code to `shared` only when:

- it has no business-specific vocabulary;
- at least two features use it;
- it is stable and generic.

A `ProjectCard` is not shared. A generic `Pagination` component may be shared.

## Cross-feature coordination

Use application services or domain events. A task feature must not silently update notification tables directly unless the transaction coordinator explicitly owns that operation.
