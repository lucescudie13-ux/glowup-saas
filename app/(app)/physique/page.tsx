import { getCurrentUser, createClient } from "@/lib/supabase/server";
import { progressPhotosService } from "@/server/progress-photos/progress-photos.service";
import { userService } from "@/server/users/user.service";
import { PageHead } from "@/components/ui/page-head";
import { PhysiqueManager } from "@/components/features/physique-manager";
import type { ProgressPhoto } from "@/types";

const BUCKET = "progress-photos";
const SIGNED_TTL = 60 * 60; // 1 h

export default async function PhysiquePage() {
  const user = await getCurrentUser();
  const uid = user!.id;
  const supabase = await createClient();

  const [photos, profile] = await Promise.all([
    progressPhotosService.list(uid) as Promise<ProgressPhoto[]>,
    userService.getProfile(uid),
  ]);

  // Signed URLs for the private bucket (batched).
  const paths = photos.map((p) => p.storage_path);
  const signed = paths.length
    ? (await supabase.storage.from(BUCKET).createSignedUrls(paths, SIGNED_TTL)).data ?? []
    : [];
  const urlByPath = new Map(signed.map((s) => [s.path, s.signedUrl]));
  const withUrls = photos.map((p) => ({ ...p, url: urlByPath.get(p.storage_path) ?? null }));

  let idealUrl: string | null = null;
  if (profile?.ideal_photo_path) {
    const { data } = await supabase.storage.from(BUCKET).createSignedUrl(profile.ideal_photo_path, SIGNED_TTL);
    idealUrl = data?.signedUrl ?? null;
  }

  return (
    <div className="page section active">
      <PageHead title="Physique" sub="Tes photos de progression hebdo et ton physique idéal." />
      <PhysiqueManager
        userId={uid}
        initialPhotos={withUrls}
        idealPath={profile?.ideal_photo_path ?? null}
        idealUrl={idealUrl}
      />
    </div>
  );
}
