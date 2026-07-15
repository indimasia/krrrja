// RBAC / RLS verification against the remote Supabase project.
// Exercises the two-role model (admin | member) plus tenant isolation with
// real signed-in users through the anon-key client (RLS enforced), using the
// service-role client only for setup/cleanup.
//
// Run: node --env-file=.env.local scripts/verify-rbac.mjs
// Requires: pnpm run seed (employer@app.com / recruiter@app.com in "Demo Org")
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !serviceKey || !anonKey) {
  console.error("Missing Supabase env vars in .env.local");
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const OUTSIDER = { email: "outsider@app.com", password: "password" };

let pass = 0;
let fail = 0;

function check(name, ok, detail = "") {
  if (ok) {
    pass++;
    console.log(`  ✓ ${name}`);
  } else {
    fail++;
    console.log(`  ✗ ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

async function signIn(email, password) {
  const client = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`sign-in failed for ${email}: ${error.message}`);
  return client;
}

async function ensureOrg(name) {
  const { data: existing } = await admin.from("orgs").select("id").eq("name", name).maybeSingle();
  if (existing) return existing.id;
  const { data, error } = await admin.from("orgs").insert({ name }).select("id").single();
  if (error) throw error;
  return data.id;
}

async function ensureUser(email, password) {
  const { data: list } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const found = list.users.find((u) => u.email === email);
  if (found) return found;
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (error) throw error;
  return data.user;
}

async function ensureJob(orgId, title) {
  const { data: existing } = await admin
    .from("job_openings")
    .select("id")
    .eq("org_id", orgId)
    .eq("title", title)
    .maybeSingle();
  if (existing) return existing.id;
  const { data, error } = await admin
    .from("job_openings")
    .insert({ org_id: orgId, title, description: "rbac test", criteria: "rbac test" })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

async function main() {
  // ── Setup (service role) ────────────────────────────────────────────────
  const demoOrgId = await ensureOrg("Demo Org");
  const otherOrgId = await ensureOrg("RBAC Other Org");

  const outsider = await ensureUser(OUTSIDER.email, OUTSIDER.password);
  await admin
    .from("org_members")
    .upsert({ org_id: otherOrgId, user_id: outsider.id, role: "admin" }, { onConflict: "org_id,user_id" });

  const demoJobId = await ensureJob(demoOrgId, "RBAC Test Opening");
  const otherJobId = await ensureJob(otherOrgId, "RBAC Other Opening");

  const cleanup = [];

  // ── Recruiter (member of Demo Org) ──────────────────────────────────────
  console.log("\nRecruiter (member):");
  const recruiter = await signIn("recruiter@app.com", "password");

  {
    const { data, error } = await recruiter
      .from("candidates")
      .insert({ job_opening_id: demoJobId, org_id: demoOrgId, file_name: "rbac-test.pdf", file_url: "" })
      .select("id")
      .single();
    check("CAN upload CV (insert candidate, own org)", !error && !!data, error?.message);
    if (data) cleanup.push(data.id);

    if (data) {
      const { data: upd, error: updErr } = await recruiter
        .from("candidates")
        .update({ status: "Reviewed", notes: "rbac note" })
        .eq("id", data.id)
        .select("id");
      check("CAN update candidate status + notes", !updErr && upd?.length === 1, updErr?.message);
    }
  }

  {
    const { error } = await recruiter
      .from("job_openings")
      .insert({ org_id: demoOrgId, title: "recruiter-should-fail" });
    check("CANNOT create job opening", !!error, "insert unexpectedly succeeded");
  }

  {
    const { data, error } = await recruiter
      .from("job_openings")
      .update({ status: "closed" })
      .eq("id", demoJobId)
      .select("id");
    check("CANNOT edit/close job opening", !!error || data?.length === 0, "update unexpectedly succeeded");
  }

  {
    const { error } = await recruiter
      .from("invites")
      .insert({ org_id: demoOrgId, email: "x@x.com", role: "member" });
    check("CANNOT invite members (invites insert)", !!error, "insert unexpectedly succeeded");
    const { data } = await recruiter.from("invites").select("id").eq("org_id", demoOrgId);
    check("CANNOT read invites", (data ?? []).length === 0);
  }

  {
    const { error } = await recruiter
      .from("org_members")
      .insert({ org_id: demoOrgId, user_id: outsider.id, role: "member" });
    check("CANNOT add org members directly", !!error, "insert unexpectedly succeeded");
  }

  {
    const { error } = await recruiter
      .from("candidates")
      .insert({ job_opening_id: otherJobId, org_id: demoOrgId, file_name: "cross-org.pdf", file_url: "" });
    check("CANNOT attach candidate to another org's job", !!error, "insert unexpectedly succeeded");
  }

  {
    const { data } = await recruiter.from("job_openings").select("id").eq("org_id", otherOrgId);
    check("CANNOT see other org's job openings", (data ?? []).length === 0);
    const { data: c } = await recruiter.from("candidates").select("id").eq("org_id", otherOrgId);
    check("CANNOT see other org's candidates", (c ?? []).length === 0);
  }

  // ── Employer (admin of Demo Org) ────────────────────────────────────────
  console.log("\nAdmin (employer):");
  const employer = await signIn("employer@app.com", "password");

  {
    const { data, error } = await employer
      .from("job_openings")
      .insert({ org_id: demoOrgId, title: "RBAC Admin Created" })
      .select("id")
      .single();
    check("CAN create job opening", !error && !!data, error?.message);
    if (data) {
      const { data: upd, error: updErr } = await employer
        .from("job_openings")
        .update({ status: "closed" })
        .eq("id", data.id)
        .select("id");
      check("CAN edit/close job opening", !updErr && upd?.length === 1, updErr?.message);
      await admin.from("job_openings").delete().eq("id", data.id);
    }
  }

  {
    const { data, error } = await employer
      .from("candidates")
      .insert({ job_opening_id: demoJobId, org_id: demoOrgId, file_name: "rbac-admin.pdf", file_url: "" })
      .select("id")
      .single();
    check("CAN upload CV (admin superset of member)", !error && !!data, error?.message);
    if (data) cleanup.push(data.id);
  }

  {
    const { error } = await employer
      .from("invites")
      .insert({ org_id: demoOrgId, email: "rbac-invite-test@app.com", role: "member" });
    check("CAN create invites", !error, error?.message);
    await admin.from("invites").delete().eq("email", "rbac-invite-test@app.com");
  }

  {
    const { data } = await employer.from("job_openings").select("id").eq("org_id", otherOrgId);
    check("CANNOT see other org's job openings (cross-org blocked for admin too)", (data ?? []).length === 0);
    const { error } = await employer
      .from("job_openings")
      .insert({ org_id: otherOrgId, title: "cross-org-should-fail" });
    check("CANNOT create job opening in another org", !!error, "insert unexpectedly succeeded");
  }

  // ── Cleanup ─────────────────────────────────────────────────────────────
  for (const id of cleanup) await admin.from("candidates").delete().eq("id", id);
  await admin.from("job_openings").delete().eq("id", demoJobId);
  // Leave "RBAC Other Org" + outsider in place — cheap fixtures, reused on re-run.

  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
