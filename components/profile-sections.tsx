import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AvatarForm,
  ChangePasswordForm,
  DisplayNameForm,
  EmailForm,
} from "@/components/profile-forms";

type Props = {
  name: string;
  email: string;
  avatarUrl: string | null;
};

// Shared profile page body — rendered inside both the org (/admin) and
// platform (/pro) sections; everything here is account-level, not org-level.
export function ProfileSections({ name, email, avatarUrl }: Props) {
  const fallback = (name || email || "U")[0].toUpperCase();

  return (
    <div className="space-y-6">
      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle>Photo</CardTitle>
          <CardDescription>Shown next to your name across the app.</CardDescription>
        </CardHeader>
        <CardContent>
          <AvatarForm avatarUrl={avatarUrl} fallback={fallback} />
        </CardContent>
      </Card>

      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle>Name</CardTitle>
          <CardDescription>How you appear to teammates.</CardDescription>
        </CardHeader>
        <CardContent>
          <DisplayNameForm currentName={name} />
        </CardContent>
      </Card>

      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle>Email</CardTitle>
          <CardDescription>Used to sign in and receive notifications.</CardDescription>
        </CardHeader>
        <CardContent>
          <EmailForm currentEmail={email} />
        </CardContent>
      </Card>

      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle>Password</CardTitle>
          <CardDescription>Enter your current password, then pick a new one (min 8 characters).</CardDescription>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>
    </div>
  );
}
