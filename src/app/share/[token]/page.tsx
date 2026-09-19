import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SharedTripView, { type SharedPayload } from "./SharedTripView";

export default async function SharedTripPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_shared_trip", {
    p_share_token: token,
  });
  if (error || !data) notFound();

  const payload = data as SharedPayload;
  if (!payload.trip) notFound();
  return <SharedTripView payload={payload} />;
}
