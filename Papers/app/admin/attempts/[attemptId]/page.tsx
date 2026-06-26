import { notFound } from "next/navigation";
import { AttemptDetailView } from "@/components/admin/AttemptDetailView";
import { resubmitAiMarkAction } from "@/app/admin/attempts/[attemptId]/actions";
import { requireTutorSession } from "@/lib/auth/session";
import { getAdminAttemptDetail } from "@/lib/admin/data";

export default async function AdminAttemptDetailPage({
  params,
  searchParams
}: {
  params: { attemptId: string };
  searchParams?: { remark?: string | string[]; reason?: string | string[] };
}) {
  requireTutorSession();
  const detail = await getAdminAttemptDetail(params.attemptId);

  if (!detail) {
    notFound();
  }

  return (
    <AttemptDetailView
      detail={detail}
      remarkOutcome={firstSearchValue(searchParams?.remark)}
      remarkReason={firstSearchValue(searchParams?.reason)}
      resubmitAction={resubmitAiMarkAction}
    />
  );
}

function firstSearchValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
