import { getProjectActor } from "@/src/features/projects";
import { getProjectReportForActor } from "@/src/features/reporting";
import { requireServerSession } from "@/src/infrastructure/auth";
import { safeJsonRoute } from "@/src/shared/http/safe-json-route";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  return safeJsonRoute(async () => {
    const session = await requireServerSession();
    const actor = await getProjectActor(session.user.id);
    const { id } = await context.params;

    return getProjectReportForActor(actor, id);
  }, { fallbackMessage: "Gagal memuat laporan project." });
}
