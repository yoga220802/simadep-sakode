import { z } from "zod";

import { getDepartmentActor } from "@/src/features/departments/application/department-use-cases";
import { assertCanViewDepartment } from "@/src/features/departments";
import { getProjectActor } from "@/src/features/projects/application/project-use-cases";
import { getProjectDetailForActor } from "@/src/features/projects/application/project-use-cases";
import { getServerEnv } from "@/src/infrastructure/env";
import { requireServerSession } from "@/src/infrastructure/auth";
import { parseRealtimeChannelAccessRequest } from "@/src/infrastructure/realtime/channel-auth";
import { createPusherAuthResponse } from "@/src/infrastructure/realtime";
import { safeJsonRoute } from "@/src/shared/http/safe-json-route";

const realtimeAuthSchema = z.object({
  socket_id: z.string().min(1),
  channel_name: z.string().min(1),
});

async function assertCanSubscribe(userId: string, channelName: string) {
  const request = parseRealtimeChannelAccessRequest(userId, channelName);

  if (request.type === "user") {
    return;
  }

  if (request.type === "project") {
    const actor = await getProjectActor(userId);
    await getProjectDetailForActor(actor, request.projectId);
    return;
  }

  if (request.type === "department") {
    const actor = await getDepartmentActor(userId);
    assertCanViewDepartment(actor, request.departmentId);
  }
}

export async function POST(request: Request) {
  return safeJsonRoute(async () => {
    const session = await requireServerSession();
    const parsed = realtimeAuthSchema.parse(await request.json());
    const env = getServerEnv();

    if (!env.PUSHER_APP_ID || !env.PUSHER_APP_KEY || !env.PUSHER_APP_SECRET) {
      throw new Error("Realtime is disabled.");
    }

    await assertCanSubscribe(session.user.id, parsed.channel_name);

    return createPusherAuthResponse({
      socketId: parsed.socket_id,
      channelName: parsed.channel_name,
      key: env.PUSHER_APP_KEY,
      secret: env.PUSHER_APP_SECRET,
    });
  }, { fallbackMessage: "Gagal menghubungkan realtime." });
}
