import "@/src/infrastructure/server-only";

export const seedIds = {
  users: {
    bootstrapAdmin: "00000000-0000-4000-8000-000000000001",
    departmentHead: "00000000-0000-4000-8000-000000000002",
    contributor: "00000000-0000-4000-8000-000000000003",
  },
  departments: {
    sakode: "10000000-0000-4000-8000-000000000001",
    engineering: "10000000-0000-4000-8000-000000000002",
  },
  projects: {
    transformation: "20000000-0000-4000-8000-000000000001",
    operations: "20000000-0000-4000-8000-000000000002",
  },
  milestones: {
    foundation: "30000000-0000-4000-8000-000000000001",
    adoption: "30000000-0000-4000-8000-000000000002",
  },
  categories: {
    backend: "40000000-0000-4000-8000-000000000001",
    frontend: "40000000-0000-4000-8000-000000000002",
  },
  tasks: {
    databaseFoundation: "50000000-0000-4000-8000-000000000001",
    architectureScaffold: "50000000-0000-4000-8000-000000000002",
    rebrand: "50000000-0000-4000-8000-000000000003",
  },
} as const;

export const seedReferenceDate = new Date("2026-01-01T00:00:00.000Z");
