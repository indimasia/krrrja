import { redirect } from "next/navigation";
import { ProfileSections } from "@/components/profile-sections";
import { createClient } from "@/lib/supabase/server";

export default async function ProProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="space-y-6 p-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your personal account details.</p>
      </div>
      <div className="max-w-3xl">
        <ProfileSections
          name={(user.user_metadata?.display_name as string) ?? ""}
          email={user.email ?? ""}
          avatarUrl={(user.user_metadata?.avatar_url as string) ?? null}
        />
      </div>
    </div>
  );
}
