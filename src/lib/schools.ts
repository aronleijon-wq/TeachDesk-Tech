// Schools, the teachers in them, and invitations to join. Who may see and change what is
// decided by the database (drizzle/manual/0005_school_invitations.sql); this file asks.
import { supabase } from "@/integrations/supabase/client";
import { SITE_URL } from "./site";

export type SchoolRole = "admin" | "teacher";
export type SchoolStatus = "pilot" | "active" | "ended";

/** A school the signed-in teacher belongs to. */
export interface School {
  id: string;
  name: string;
  /** The teacher's role at the school. */
  role: SchoolRole;
  status: SchoolStatus;
  pilotEndsAt: string | null;
}

/** An invitation that hasn't been accepted yet. */
export interface Invitation {
  id: string;
  email: string;
  role: SchoolRole;
  token: string;
  expiresAt: string;
}

/** The link that is sent to the invited person. */
export const invitationLink = (token: string) => `${SITE_URL}/invite/${token}`;

export const isExpired = (invitation: Invitation, now = new Date()) =>
  new Date(invitation.expiresAt) <= now;

/** "Admin" or "Teacher". */
export const roleLabel = (role: SchoolRole) => (role === "admin" ? "Admin" : "Teacher");

// --- The teacher's schools -------------------------------------------------------------

/** The schools a teacher belongs to, in the order they joined. */
export async function fetchSchools(userId: string): Promise<School[]> {
  const { data, error } = await supabase
    .from("memberships")
    .select("role, organizations(id, name, status, pilot_ends_at)")
    // Staff and school admins also see other people's memberships.
    .eq("user_id", userId)
    .order("created_at");
  if (error) throw error;
  return data.flatMap(({ role, organizations: school }) =>
    school
      ? [
          {
            id: school.id,
            name: school.name,
            role: role as SchoolRole,
            status: school.status as SchoolStatus,
            pilotEndsAt: school.pilot_ends_at,
          },
        ]
      : [],
  );
}

// --- Joining through an invitation link --------------------------------------------

export interface InvitationPreview {
  school: string;
  role: SchoolRole;
  /** The invited address with most of the name hidden, like "a•••@skola.se". */
  emailHint: string;
  status: "valid" | "used" | "expired";
}

/** What an invitation link is for; null if there's no such invitation. Works signed out. */
export async function previewInvitation(token: string): Promise<InvitationPreview | null> {
  const { data, error } = await supabase
    .rpc("invitation_preview", { invite_token: token })
    .maybeSingle();
  if (error) throw error;
  return (
    data && {
      school: data.school,
      role: data.role as SchoolRole,
      emailHint: data.email_hint,
      status: data.status as InvitationPreview["status"],
    }
  );
}

const ACCEPT_ERRORS: Record<string, string> = {
  TD403: "This invitation is for another email address. Sign in with the address it was sent to.",
  TD404: "This invitation link isn't valid. Ask for a new one.",
  TD410: "This invitation has already been used or has expired. Ask for a new one.",
};

/** Joins the school for the signed-in teacher and returns its id. */
export async function acceptInvitation(token: string): Promise<string> {
  const { data, error } = await supabase.rpc("accept_invitation", { invite_token: token });
  if (error) {
    throw new Error(
      ACCEPT_ERRORS[error.code] ??
        "Couldn't join the school. Check your internet connection and try again.",
    );
  }
  return data;
}

// --- Managing a school (its admins, and TeachDesk staff) -------------------------------

export interface Member {
  userId: string;
  role: SchoolRole;
  /** Empty if the teacher hasn't set a name. */
  name: string;
  email: string;
  joinedAt: string;
}

export async function fetchMembers(schoolId: string): Promise<Member[]> {
  const { data, error } = await supabase.rpc("school_members", { org: schoolId });
  if (error) throw error;
  return data.map((m) => ({
    userId: m.user_id,
    role: m.role as SchoolRole,
    name: m.name,
    email: m.email,
    joinedAt: m.joined_at,
  }));
}

const INVITATION_COLUMNS = "id, email, role, token, expires_at";

const toInvitation = (row: {
  id: string;
  email: string;
  role: string;
  token: string;
  expires_at: string;
}): Invitation => ({
  id: row.id,
  email: row.email,
  role: row.role as SchoolRole,
  token: row.token,
  expiresAt: row.expires_at,
});

export async function fetchInvitations(schoolId: string): Promise<Invitation[]> {
  const { data, error } = await supabase
    .from("invitations")
    .select(INVITATION_COLUMNS)
    .eq("organization_id", schoolId)
    .is("accepted_at", null)
    .order("created_at");
  if (error) throw error;
  return data.map(toInvitation);
}

/**
 * Invites someone and returns the invitation's token. Inviting an address again renews its
 * invitation: the same link works for another 14 days.
 */
export async function inviteToSchool(
  schoolId: string,
  email: string,
  role: SchoolRole,
): Promise<string> {
  const { data, error } = await supabase.rpc("invite_to_school", {
    org: schoolId,
    invite_email: email,
    invite_role: role,
  });
  if (error) throw error;
  return data;
}

export async function withdrawInvitation(invitationId: string): Promise<void> {
  const { data, error } = await supabase
    .from("invitations")
    .delete()
    .eq("id", invitationId)
    .select("id");
  if (error) throw error;
  if (data.length === 0) throw new Error("Invitation not found.");
}

/** Removes a teacher from the school. Admins can't be removed this way. */
export async function removeMember(schoolId: string, userId: string): Promise<void> {
  const { data, error } = await supabase
    .from("memberships")
    .delete()
    .eq("organization_id", schoolId)
    .eq("user_id", userId)
    .select("user_id");
  if (error) throw error;
  if (data.length === 0) throw new Error("Only teachers can be removed.");
}

// --- TeachDesk staff -------------------------------------------------------------------

/** A school as TeachDesk staff see it. */
export interface SchoolOverview {
  id: string;
  name: string;
  status: SchoolStatus;
  pilotEndsAt: string | null;
  createdAt: string;
  memberCount: number;
  invitations: Invitation[];
}

/** Every school, newest first. */
export async function fetchAllSchools(): Promise<SchoolOverview[]> {
  const { data, error } = await supabase
    .from("organizations")
    .select(
      `id, name, status, pilot_ends_at, created_at, memberships(user_id), invitations(${INVITATION_COLUMNS}, accepted_at)`,
    )
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data.map((school) => ({
    id: school.id,
    name: school.name,
    status: school.status as SchoolStatus,
    pilotEndsAt: school.pilot_ends_at,
    createdAt: school.created_at,
    memberCount: school.memberships.length,
    invitations: school.invitations.filter((i) => i.accepted_at === null).map(toInvitation),
  }));
}

/** Starts a pilot: creates the school and invites its first admin. Returns that invitation's token. */
export async function startPilot(
  schoolName: string,
  adminEmail: string,
  days: number,
): Promise<string> {
  const { data, error } = await supabase.rpc("start_pilot", {
    school_name: schoolName,
    admin_email: adminEmail,
    pilot_days: days,
  });
  if (error) throw error;
  return data;
}

/** Changes a school's status, and for a pilot optionally when it ends. */
export async function updateSchool(
  schoolId: string,
  status: SchoolStatus,
  pilotEndsAt?: string,
): Promise<void> {
  const { data, error } = await supabase
    .from("organizations")
    .update(pilotEndsAt ? { status, pilot_ends_at: pilotEndsAt } : { status })
    .eq("id", schoolId)
    .select("id");
  if (error) throw error;
  if (data.length === 0) throw new Error("School not found.");
}
