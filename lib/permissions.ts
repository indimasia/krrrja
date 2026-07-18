// Single source of truth for role → permission mapping (org-level RBAC).
//
// Two roles: admin ⊇ member. Admin can do everything a member (recruiter)
// can, plus admin-exclusive actions — never model these as mutually
// exclusive. Mirrors the RLS policies (is_org_member / is_org_admin);
// this layer exists so UI and server actions never duplicate role logic.

export type OrgRole = "admin" | "member";

const STAFF: OrgRole[] = ["admin", "member"];

// Member-level (admin inherits)
export const canUploadCV = (role: OrgRole) => STAFF.includes(role);
export const canViewCandidates = (role: OrgRole) => STAFF.includes(role);
export const canUpdateCandidate = (role: OrgRole) => STAFF.includes(role); // notes + status

// Admin-only
export const canManageJobOpenings = (role: OrgRole) => role === "admin"; // create/edit/close
export const canExportData = (role: OrgRole) => role === "admin"; // CSV export
export const canManageTeam = (role: OrgRole) => role === "admin"; // invite members (all admins, owner or not)
export const canManageBilling = (role: OrgRole) => role === "admin"; // billing + usage stats

// Owner-only. Non-owner admins can invite (canManageTeam) but never
// edit/delete the org itself.
export const canManageOrgSettings = (isOwner: boolean) => isOwner; // org rename
export const canDeleteOrg = (isOwner: boolean) => isOwner;
