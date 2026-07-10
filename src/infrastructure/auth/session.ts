import "@/src/infrastructure/server-only";

import { headers } from "next/headers";

import { auth, type BetterAuthSession } from "./auth";

export type SafeSessionUser = {
  id: string;
  email: string;
  name: string;
  image: string | null | undefined;
  role: string | null | undefined;
  banned: boolean | null | undefined;
};

export async function getServerSession(): Promise<BetterAuthSession | null> {
  return auth.api.getSession({
    headers: await headers(),
  });
}

export async function requireServerSession(): Promise<BetterAuthSession> {
  const session = await getServerSession();

  if (!session) {
    throw new Error("Authentication required.");
  }

  return session;
}

export function toSafeSessionUser(session: BetterAuthSession): SafeSessionUser {
  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    image: session.user.image ?? undefined,
    role: session.user.role,
    banned: session.user.banned,
  };
}
