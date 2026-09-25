// Reading and writing a teacher's own data in the database. Row-level security in the
// database makes sure each teacher can only reach their own rows.
import { supabase } from "@/integrations/supabase/client";
import type { Database, Json } from "@/integrations/supabase/types";
import type { SaveOutcome } from "./autosave";
import { normalizeWorkspace, type Workspace } from "./types";

// --- Workspace ----------------------------------------------------------------------

/** A workspace as stored. Version 0 means it hasn't been saved to the database yet. */
export interface StoredWorkspace {
  data: Workspace;
  version: number;
}

export async function fetchWorkspace(userId: string): Promise<StoredWorkspace | null> {
  const { data, error } = await supabase
    .from("workspaces")
    .select("data, version")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data ? { data: normalizeWorkspace(data.data), version: data.version } : null;
}

/**
 * Saves only if the stored version is still the one this workspace is based on, so a
 * newer save from another device or tab is never overwritten.
 */
export async function saveWorkspace(
  userId: string,
  workspace: Workspace,
  version: number,
): Promise<{ outcome: "saved"; version: number } | { outcome: Exclude<SaveOutcome, "saved"> }> {
  const data = workspace as unknown as Json;

  if (version === 0) {
    const { data: row, error } = await supabase
      .from("workspaces")
      .insert({ user_id: userId, data, version: 1 })
      .select("version")
      .single();
    // A unique violation means another device created the workspace first.
    if (error) return { outcome: error.code === "23505" ? "conflict" : "failed" };
    return { outcome: "saved", version: row.version };
  }

  const { data: row, error } = await supabase
    .from("workspaces")
    .update({ data, version: version + 1 })
    .eq("user_id", userId)
    .eq("version", version)
    .select("version")
    .maybeSingle();
  if (error) return { outcome: "failed" };
  // No row updated: the stored version moved on since we loaded it.
  return row ? { outcome: "saved", version: row.version } : { outcome: "conflict" };
}

// --- Profile --------------------------------------------------------------------------

export interface StoredProfile {
  name: string;
  role: string;
  school: string;
  /** Set by TeachDesk (billing); teachers can't change it. */
  plan: string;
  showDemo: boolean;
}

export type EditableProfile = Omit<StoredProfile, "plan">;

type ProfileRow = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  "name" | "role" | "school" | "plan" | "show_demo"
>;

const PROFILE_COLUMNS = "name, role, school, plan, show_demo";

const fromRow = (row: ProfileRow): StoredProfile => ({
  name: row.name,
  role: row.role,
  school: row.school,
  plan: row.plan,
  showDemo: row.show_demo,
});

export async function fetchProfile(userId: string): Promise<StoredProfile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data ? fromRow(data) : null;
}

/** Creates the profile on a teacher's first visit. If another tab got there first, returns that one. */
export async function createProfile(
  userId: string,
  profile: EditableProfile,
): Promise<StoredProfile> {
  const { data, error } = await supabase
    .from("profiles")
    .insert({
      user_id: userId,
      name: profile.name,
      role: profile.role,
      school: profile.school,
      show_demo: profile.showDemo,
    })
    .select(PROFILE_COLUMNS)
    .single();
  if (error?.code === "23505") {
    const existing = await fetchProfile(userId);
    if (existing) return existing;
  }
  if (error) throw error;
  return fromRow(data);
}

export async function updateProfile(
  userId: string,
  changes: Partial<EditableProfile>,
): Promise<void> {
  const row: Database["public"]["Tables"]["profiles"]["Update"] = {};
  if (changes.name !== undefined) row.name = changes.name;
  if (changes.role !== undefined) row.role = changes.role;
  if (changes.school !== undefined) row.school = changes.school;
  if (changes.showDemo !== undefined) row.show_demo = changes.showDemo;

  const { data, error } = await supabase
    .from("profiles")
    .update(row)
    .eq("user_id", userId)
    .select("user_id");
  if (error) throw error;
  if (data.length === 0) throw new Error("Profile not found.");
}
