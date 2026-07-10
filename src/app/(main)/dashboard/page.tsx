import { redirect } from "next/navigation";

import { listAuditActivity } from "@/src/features/audit";
import { getProjectActor } from "@/src/features/projects";
import { getDashboardForActor } from "@/src/features/reporting";
import { ReportingDashboardView } from "@/src/features/reporting/ui/dashboard-view";
import { getServerSession } from "@/src/infrastructure/auth";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getServerSession();

  if (!session) {
    redirect("/login");
  }

  const actor = await getProjectActor(session.user.id);
  const [dashboard, auditItems] = await Promise.all([
    getDashboardForActor(actor),
    listAuditActivity(actor, { limit: 10 }),
  ]);

  return <ReportingDashboardView data={dashboard} auditItems={auditItems} />;
}
