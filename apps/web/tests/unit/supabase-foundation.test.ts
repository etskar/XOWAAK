import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(testDirectory, "../../../..");
const migrationDirectory = path.join(projectRoot, "supabase", "migrations");

function readMigration(fileName: string) {
  return readFileSync(path.join(migrationDirectory, fileName), "utf8");
}

describe("Supabase foundation", () => {
  it("keeps the core migration ordered and RLS-enabled", () => {
    const migration = readMigration("20260811000000_core_foundation.sql");

    expect(migration).toContain("create table if not exists public.profiles");
    expect(migration).toContain("create table if not exists public.user_settings");
    expect(migration).toContain("create table if not exists public.user_devices");
    expect(migration).toContain("create table if not exists public.roles");
    expect(migration).toContain("create table if not exists public.permissions");
    expect(migration).toContain("create or replace function public.set_updated_at()");
    expect(migration).toContain(
      "create or replace function public.validate_profile_avatar_owner()",
    );
    expect(migration).toContain("media_assets_owner_path");
    expect(migration).toContain("alter table public.profiles enable row level security");
    expect(migration).toContain("profiles_update_own");
    expect(migration).toContain("user_roles_insert_admin");
  });

  it("keeps storage private and owner-scoped", () => {
    const migration = readMigration("20260811000001_storage_foundation.sql");

    expect(migration).toContain("('avatars', 'avatars', false)");
    expect(migration).toContain("('private-documents', 'private-documents', false)");
    expect(migration).toContain("storage_objects_select_owner");
    expect(migration).toContain("auth.uid()");
    expect(migration).not.toContain("public = true");
  });

  it("does not treat the pre-generation database type as generated output", () => {
    const databaseTypes = readFileSync(
      path.join(projectRoot, "apps", "web", "src", "types", "database.ts"),
      "utf8",
    );

    expect(databaseTypes).toContain("explicit pre-generation placeholder");
    expect(databaseTypes).toContain("pnpm supabase:types");
  });

  it("keeps profile privacy and deletion lifecycle changes isolated in a new migration", () => {
    const migration = readMigration("20260811000002_profile_settings_lifecycle.sql");

    expect(migration).toContain("add column if not exists location_label");
    expect(migration).toContain("add column if not exists visibility");
    expect(migration).toContain("create table if not exists public.account_deletion_requests");
    expect(migration).toContain("drop policy if exists profiles_select_own");
    expect(migration).toContain("create policy profiles_select_visible");
    expect(migration).toContain("create or replace function public.update_own_privacy_settings");
    expect(migration).toContain(
      "alter table public.account_deletion_requests enable row level security",
    );
  });

  it("keeps social graph constraints and block-aware policies in its own migration", () => {
    const migration = readMigration("20260811000003_social_graph.sql");

    expect(migration).toContain("create table if not exists public.follows");
    expect(migration).toContain("create table if not exists public.blocks");
    expect(migration).toContain("follows_no_self_follow");
    expect(migration).toContain("blocks_no_self_block");
    expect(migration).toContain("create or replace function public.create_follow");
    expect(migration).toContain("create or replace function public.create_block");
    expect(migration).toContain("create or replace function public.is_social_blocked");
    expect(migration).toContain("create or replace function public.expected_follow_status");
    expect(migration).toContain("follows_insert_self");
    expect(migration).toContain("blocks_select_participant");
  });

  it("keeps posts visibility, media ownership, and feed policies in a new migration", () => {
    const migration = readMigration("20260811000004_posts_feed.sql");

    expect(migration).toContain("create table if not exists public.posts");
    expect(migration).toContain("create table if not exists public.post_media");
    expect(migration).toContain("posts_content_length");
    expect(migration).toContain("posts_feed_order_idx");
    expect(migration).toContain("create or replace function public.can_view_post");
    expect(migration).toContain("create or replace function public.create_post");
    expect(migration).toContain("posts_select_visible");
    expect(migration).toContain("post_media_insert_owner");
  });

  it("keeps Prompt 3 interactions and messaging additive and owner-scoped", () => {
    const interactions = readMigration("20260814000000_interactions_messaging_media.sql");
    const notifications = readMigration("20260814000001_interaction_notifications.sql");
    const messaging = readMigration("20260814000002_messaging_group_workflows.sql");

    expect(interactions).toContain("create table if not exists public.post_likes");
    expect(interactions).toContain("create table if not exists public.post_comments");
    expect(interactions).toContain("create table if not exists public.notifications");
    expect(interactions).toContain("create table if not exists public.conversations");
    expect(interactions).toContain("bucket_id = 'platform-media'");
    expect(notifications).toContain("create trigger post_likes_notify");
    expect(notifications).toContain("profiles_select_active_public");
    expect(messaging).toContain("create or replace function public.create_direct_conversation");
    expect(messaging).toContain("create or replace function public.create_group_invitation");
    expect(interactions).toContain("alter publication supabase_realtime add table public.messages");
  });
});
