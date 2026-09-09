import { NextResponse } from "next/server";
import { getStudentSession } from "@/lib/auth/session";
import { isUuid } from "@/lib/security";
import { updateStudentHeartbeat } from "@/lib/student/data";

export async function POST({ params }: { params: { attemptId: string } }) {
  const session = getStudentSession();

  if (!session) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  if (!isUuid(params.attemptId)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const updated = await updateStudentHeartbeat(params.attemptId, session);

  return NextResponse.json({ ok: Boolean(updated) });
}
