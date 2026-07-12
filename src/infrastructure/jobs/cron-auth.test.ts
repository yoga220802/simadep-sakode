import { describe, expect, it } from "vitest";

import { hasValidBearerSecret } from "./cron-auth";

const secret = "local-outbox-secret-with-at-least-32-chars";

describe("cron bearer secret auth", () => {
  it("accepts exact bearer secret matches", () => {
    expect(hasValidBearerSecret(`Bearer ${secret}`, secret)).toBe(true);
  });

  it("rejects missing, malformed, and different secrets", () => {
    expect(hasValidBearerSecret(null, secret)).toBe(false);
    expect(hasValidBearerSecret(secret, secret)).toBe(false);
    expect(hasValidBearerSecret("Bearer wrong-secret", secret)).toBe(false);
    expect(hasValidBearerSecret(`Bearer ${secret}`, undefined)).toBe(false);
  });
});
