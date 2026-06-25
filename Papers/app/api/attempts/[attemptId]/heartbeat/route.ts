import { NextResponse } from "next/server";
import { getStudentSession } from "@/lib/auth/session";
import { updateStudentHeartbeat } from "@/lib/student/data";

export async function POST(
  request: Request,
  { params }: { params: { attemptId: string } }
) {
  const session = getStudentSession();

  if (!session) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as { elapsedSeconds?: number };
  const updated = await updateStudentHeartbeat(params.attemptId, session, body.elapsedSeconds ?? 0);

  return NextResponse.json({ ok: Boolean(updated) });
}
