import { notFound } from "next/navigation";
import { AttemptDetailView } from "@/components/admin/AttemptDetailView";
import {
  manualOverrideMarkAction,
  resubmitAiMarkAction
} from "@/app/admin/attempts/[attemptId]/actions";
import { requireTutorSession } from "@/lib/auth/session";
import { getAdminAttemptDetail } from "@/lib/admin/data";

export default async function AdminAttemptDetailPage({
  params,
  searchParams
}: {
  params: { attemptId: string };
  searchParams?: {
    override?: string | string[];
    overrideReason?: string | string[];
    remark?: string | string[];
    reason?: string | string[];
  };
}) {
  requireTutorSession();
  const detail = await getAdminAttemptDetail(params.attemptId);

  if (!detail) {
    notFound();
  }

  return (
    <AttemptDetailView
      detail={detail}
      manualOverrideAction={manualOverrideMarkAction}
      overrideOutcome={firstSearchValue(searchParams?.override)}
      overrideReason={firstSearchValue(searchParams?.overrideReason)}
      remarkOutcome={firstSearchValue(searchParams?.remark)}
      remarkReason={firstSearchValue(searchParams?.reason)}
      resubmitAction={resubmitAiMarkAction}
    />
  );
}

function firstSearchValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
