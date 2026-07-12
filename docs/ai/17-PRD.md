# 17 — Product Requirements Document: SIMADEP

## Product

**SIMADEP — Sistem Manajemen Departemen** is an internal web application for managing departments, users, projects, tasks, collaboration, notifications, reporting, and activity history.

## Problem

The current system separates Next.js frontend and FastAPI backend, depends on an external employee API for identity, and uses a layer-first frontend structure that makes feature changes spread across many folders. SIMADEP consolidates the application into one maintainable codebase while retaining useful project-management behaviour.

## Goals

- one Next.js full-stack repository;
- internal user management without external employee API;
- department-aware access and reporting;
- preserve project/task collaboration flows;
- secure role/membership authorization;
- realtime user experience without coupling database to messaging;
- AI-agent-friendly feature structure and tests;
- consistent SAKODE-aligned brand identity.

## Non-goals for v1

- microservices;
- native mobile application;
- offline-first Firestore architecture;
- direct FCM state synchronization;
- complex workflow automation engine;
- public multi-tenant SaaS billing;
- automatic production DB access by Codex.

## Personas

- Super Admin
- System Admin
- Department Head
- Department Admin
- Project Owner/Manager
- Contributor
- Viewer

## Core epics

1. Authentication and user administration.
2. Department management and membership.
3. Project lifecycle and membership.
4. Milestones, tasks, subtasks, categories, and assignments.
5. Comments and attachments.
6. Notification inbox and realtime update signal.
7. Dashboard and reports.
8. Audit trail.
9. Rebranding and responsive UI.

## Functional requirements

### Identity

- login/logout/session;
- admin create/edit/disable/ban user;
- reset credential flow;
- role assignment with lockout protection;
- profile directory/search;
- revoke sessions.

### Departments

- CRUD/archive department;
- member assignment and roles;
- department project view;
- department dashboard/report scope.

### Projects

- create, detail, update, archive/delete;
- status and year filters;
- ownership and member roles;
- department association;
- member notification.

### Work items

- ordered milestones;
- task/subtask CRUD;
- category assignment;
- multiple assignees;
- due date, priority, duration;
- assignee status updates;
- completion statistics.

### Collaboration

- task comments;
- file/link attachments;
- authorized deletion;
- activity view.

### Notifications

- persistent inbox;
- unread count;
- mark read;
- realtime refresh;
- optional background push.

### Reporting

- system/admin dashboard;
- department dashboard;
- project dashboard/report;
- user task summary;
- status and completion aggregations.

## Non-functional requirements

- responsive desktop/mobile web;
- strict TypeScript;
- server-enforced authorization;
- MySQL referential integrity;
- auditable critical changes;
- no production secrets in client/repo;
- predictable migration and seed;
- CI quality gates;
- accessible labels and keyboard flows;
- acceptable dashboard query performance without N+1.

## Success criteria

- all active frontend flows no longer depend on FastAPI;
- no external employee API needed for login/user directory;
- all critical denied-path security tests pass;
- migration works from empty DB in CI;
- UI uses SIMADEP name/logo/palette/Nunito;
- legacy service/auth context removed;
- realtime failure does not prevent core writes;
- owner can deploy with documented environment variables.
