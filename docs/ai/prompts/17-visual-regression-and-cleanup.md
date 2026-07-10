# Prompt 17 — Visual Regression, Accessibility, and Cleanup

## Objective

Lock the restored UI so future backend work cannot silently flatten it again.

## Tasks

1. Add Playwright or equivalent screenshot coverage for:
   - project list desktop/mobile;
   - project detail each tab;
   - create/edit project modal;
   - member modal;
   - task modal;
   - task detail drawer;
   - category modal;
   - report tab;
   - users page;
   - dashboards by scope.
2. Add interaction tests for tabs, modal close/success, drawer, popovers, confirmations, and back/forward URL state.
3. Run an accessibility pass:
   - focus trap;
   - keyboard navigation;
   - labels;
   - button names;
   - confirmation semantics;
   - color contrast.
4. Verify responsive layouts at common breakpoints.
5. Remove current temporary inline forms and unused UI files after the restored components are proven.
6. Ensure no legacy services/AuthContext/token code has returned.
7. Ensure no project page loads report or all collaboration by default.
8. Update documentation with UI invariants:
   - project detail must remain tabbed;
   - mutation forms must use progressive disclosure;
   - role visibility must be capability-driven;
   - destructive actions require confirmation.
9. Run all quality gates and produce a final UI parity report.
