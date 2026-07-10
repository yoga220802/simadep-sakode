import "@/src/infrastructure/server-only";

import { timingSafeEqual } from "node:crypto";

export function hasValidBearerSecret(
  authorizationHeader: string | null,
  expectedSecret: string | undefined,
) {
  if (!expectedSecret || !authorizationHeader?.startsWith("Bearer ")) {
    return false;
  }

  const providedSecret = authorizationHeader.slice("Bearer ".length).trim();
  const provided = Buffer.from(providedSecret);
  const expected = Buffer.from(expectedSecret);

  return provided.length === expected.length && timingSafeEqual(provided, expected);
}
