import { redirect } from "next/navigation";

import { getServerSession } from "@/src/infrastructure/auth";
import { getUserProfile } from "@/src/features/identity/users";
import { ProfileView } from "@/src/features/identity/users/ui/profile-view";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await getServerSession();

  if (!session) {
    redirect("/login");
  }

  const profile = await getUserProfile({
    id: session.user.id,
    role: session.user.role,
  });

  return <ProfileView profile={profile} />;
}
