# Prompt 11 — Legacy Cleanup

After migrated flows pass tests:

1. remove unused `src/services` methods/files;
2. remove custom AuthContext/token storage;
3. remove legacy duplicated types replaced by feature contracts;
4. remove `NEXT_PUBLIC_API_SMIP_BASE_URL` and old Pusher auth flow;
5. remove old name/logo/assets/copy;
6. remove dead components and imports;
7. verify FastAPI is no longer required at runtime;
8. update README/setup docs;
9. run full non-DB quality gates and DB gates when available.

Do not remove a legacy file based only on filename; prove no caller remains.
