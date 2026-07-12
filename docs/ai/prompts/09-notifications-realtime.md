# Prompt 09 — Notifications, Outbox, Realtime, and FCM

Tasks:

1. implement persistent notification inbox and unread count;
2. implement transactional outbox repository/processor;
3. implement Pusher adapter behind interface;
4. implement private channel auth with membership checks;
5. publish minimal invalidation payloads;
6. implement FCM adapter and device token registration, disabled when env absent;
7. add retry/idempotency/dead-letter behaviour;
8. update notification dropdown/client invalidation;
9. no network call inside business transaction;
10. unit test adapters with fakes; integration tests may use fake provider.
