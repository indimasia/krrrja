import { redirect } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { ProfileSections } from "@/components/profile-sections";
import { createClient } from "@/lib/supabase/server";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="space-y-6">
      <PageHeader title="Profile" description="Manage your personal account details." />
      <ProfileSections
        name={(user.user_metadata?.display_name as string) ?? ""}
        email={user.email ?? ""}
        avatarUrl={(user.user_metadata?.avatar_url as string) ?? null}
      />
    </div>
  );
}
