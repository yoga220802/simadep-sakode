import { NextResponse } from "next/server";
import { z } from "zod";

import { getDepartmentActor } from "@/src/features/departments/application/department-use-cases";
import { assertCanViewDepartment } from "@/src/features/departments";
import { getProjectActor } from "@/src/features/projects/application/project-use-cases";
import { getProjectDetailForActor } from "@/src/features/projects/application/project-use-cases";
import { getServerEnv } from "@/src/infrastructure/env";
import { requireServerSession } from "@/src/infrastructure/auth";
import { createPusherAuthResponse } from "@/src/infrastructure/realtime";

const realtimeAuthSchema = z.object({
  socket_id: z.string().min(1),
  channel_name: z.string().min(1),
});

async function assertCanSubscribe(userId: string, channelName: string) {
  if (channelName === `private-user-${userId}`) {
    return;
  }

  const projectMatch = /^private-project-([0-9a-fA-F-]{36})$/.exec(channelName);
  if (projectMatch) {
    const actor = await getProjectActor(userId);
    await getProjectDetailForActor(actor, projectMatch[1]);
    return;
  }

  const departmentMatch = /^private-department-([0-9a-fA-F-]{36})$/.exec(channelName);
  if (departmentMatch) {
    const actor = await getDepartmentActor(userId);
    assertCanViewDepartment(actor, departmentMatch[1]);
    return;
  }

  throw new Error("Realtime channel is not allowed.");
}

export async function POST(request: Request) {
  const session = await requireServerSession();
  const parsed = realtimeAuthSchema.parse(await request.json());
  const env = getServerEnv();

  if (!env.PUSHER_APP_KEY || !env.PUSHER_APP_SECRET) {
    return NextResponse.json({ error: "Realtime is disabled." }, { status: 503 });
  }

  await assertCanSubscribe(session.user.id, parsed.channel_name);

  return NextResponse.json(
    createPusherAuthResponse({
      socketId: parsed.socket_id,
      channelName: parsed.channel_name,
      key: env.PUSHER_APP_KEY,
      secret: env.PUSHER_APP_SECRET,
    }),
  );
}
