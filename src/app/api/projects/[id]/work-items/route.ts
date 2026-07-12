import { getProjectActor } from "@/src/features/projects";
import { listProjectWorkItems } from "@/src/features/work-items";
import { requireServerSession } from "@/src/infrastructure/auth";
import { safeJsonRoute } from "@/src/shared/http/safe-json-route";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function optionalQueryValue(url: URL, key: string) {
  return url.searchParams.get(key) || undefined;
}

export async function GET(request: Request, context: RouteContext) {
  return safeJsonRoute(async () => {
    const session = await requireServerSession();
    const actor = await getProjectActor(session.user.id);
    const { id } = await context.params;
    const url = new URL(request.url);

    return listProjectWorkItems(actor, id, {
      sortBy: optionalQueryValue(url, "sortBy") as never,
      descending: url.searchParams.get("descending") === "true",
      assignedToMe:
        url.searchParams.get("assignedToMe") === "true" ? true : undefined,
      status: optionalQueryValue(url, "status") as never,
      search: optionalQueryValue(url, "q"),
    });
  }, { fallbackMessage: "Gagal memuat data tugas project." });
}
