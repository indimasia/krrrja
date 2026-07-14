// Seeds demo users: employer (org admin), recruiter (org member), super admin (platform_admins).
// Uses service-role key — bypasses RLS. Run: pnpm run seed
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env.");
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const DEMO_ORG_NAME = "Demo Org";

const USERS = [
  { email: "employer@app.com", password: "password", orgRole: "admin" },
  { email: "recruiter@app.com", password: "password", orgRole: "member" },
  { email: "admin@app.com", password: "password", platformAdmin: true },
];

async function upsertAuthUser(email, password) {
  const { data: existing } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const found = existing.users.find((u) => u.email === email);
  if (found) {
    const { data, error } = await admin.auth.admin.updateUserById(found.id, {
      password,
      email_confirm: true,
    });
    if (error) throw error;
    return data.user;
  }
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) throw error;
  return data.user;
}

async function main() {
  let orgId;
  const { data: existingOrg } = await admin
    .from("orgs")
    .select("id")
    .eq("name", DEMO_ORG_NAME)
    .maybeSingle();

  if (existingOrg) {
    orgId = existingOrg.id;
  } else {
    const { data: newOrg, error } = await admin
      .from("orgs")
      .insert({ name: DEMO_ORG_NAME })
      .select("id")
      .single();
    if (error) throw error;
    orgId = newOrg.id;
  }
  console.log(`org: ${DEMO_ORG_NAME} (${orgId})`);

  for (const u of USERS) {
    const user = await upsertAuthUser(u.email, u.password);
    console.log(`user: ${u.email} (${user.id})`);

    if (u.orgRole) {
      const { error } = await admin
        .from("org_members")
        .upsert(
          { org_id: orgId, user_id: user.id, role: u.orgRole },
          { onConflict: "org_id,user_id" },
        );
      if (error) throw error;
      console.log(`  org_members: role=${u.orgRole}`);
    }

    if (u.platformAdmin) {
      const { error } = await admin
        .from("platform_admins")
        .upsert({ user_id: user.id }, { onConflict: "user_id" });
      if (error) throw error;
      console.log(`  platform_admins: added`);
    }
  }

  console.log("seed done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
