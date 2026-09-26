// Reading and writing teachers' data in the database. Row-level security in the database
// decides who may see what; writes to a workspace go through one database function that
// checks access and versions.
import { supabase } from "@/integrations/supabase/client";
import type { Database, Json } from "@/integrations/supabase/types";
import type { SaveOutcome } from "./autosave";
import type { ItemChange, StoredItem } from "./workspace-items";

// --- Workspaces ---------------------------------------------------------------------

/** The signed-in teacher's personal workspace; created on their first visit. */
export async function openPersonalWorkspace(): Promise<string> {
  const { data, error } = await supabase.rpc("ensure_personal_workspace");
  if (error) throw error;
  return data;
}

/** All items in a workspace, oldest first. */
export async function fetchItems(workspaceId: string): Promise<StoredItem[]> {
  const { data, error } = await supabase
    .from("workspace_items")
    .select("kind, id, data, version")
    .eq("workspace_id", workspaceId)
    .order("seq");
  if (error) throw error;
  return data;
}

/** Just the versions of a workspace's items — a cheap way to see if anyone else saved. */
export async function fetchItemVersions(workspaceId: string) {
  const { data, error } = await supabase
    .from("workspace_items")
    .select("kind, id, version")
    .eq("workspace_id", workspaceId);
  if (error) throw error;
  return data;
}

/** Error code from save_workspace_items when an item was changed by someone else. */
const CHANGED_ELSEWHERE = "TD409";
const ALREADY_EXISTS = "23505";

/** Saves a batch of changes, all or nothing. */
export async function saveItems(workspaceId: string, changes: ItemChange[]): Promise<SaveOutcome> {
  const { error } = await supabase.rpc("save_workspace_items", {
    target: workspaceId,
    changes: changes as unknown as Json,
  });
  if (!error) return "saved";
  return error.code === CHANGED_ELSEWHERE || error.code === ALREADY_EXISTS ? "conflict" : "failed";
}

// --- Profile --------------------------------------------------------------------------

export interface StoredProfile {
  name: string;
  role: string;
  school: string;
  /** "free" or "pro". Set by TeachDesk (billing); teachers can't change it. */
  plan: string;
  /** When the free Pro trial ends (ISO date). */
  trialEndsAt: string;
  showDemo: boolean;
}

export type EditableProfile = Pick<StoredProfile, "name" | "role" | "school" | "showDemo">;

type ProfileRow = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  "name" | "role" | "school" | "plan" | "trial_ends_at" | "show_demo"
>;

const PROFILE_COLUMNS = "name, role, school, plan, trial_ends_at, show_demo";

const fromRow = (row: ProfileRow): StoredProfile => ({
  name: row.name,
  role: row.role,
  school: row.school,
  plan: row.plan,
  trialEndsAt: row.trial_ends_at,
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
  if (error?.code === ALREADY_EXISTS) {
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
