import "@/src/infrastructure/server-only";

import { getProjectActor } from "@/src/features/projects";

import {
  deriveNavigationCapabilities,
  type NavigationCapabilities,
} from "../domain/navigation-capabilities";

export async function getNavigationCapabilitiesForUser(
  userId: string,
): Promise<NavigationCapabilities> {
  const actor = await getProjectActor(userId);
  return deriveNavigationCapabilities(actor);
}
