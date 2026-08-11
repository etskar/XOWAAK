-- Development-only foundation seed. No users, sessions, or production data are inserted.

insert into public.roles (key, label, description)
values
  ('user', 'User', 'Base platform role'),
  ('moderator', 'Moderator', 'Content and safety review role'),
  ('admin', 'Admin', 'Platform administration role'),
  ('super-admin', 'Super Admin', 'Restricted platform ownership role')
on conflict (key) do update
set label = excluded.label,
    description = excluded.description;

insert into public.permissions (key, label, description)
values
  ('platform.read', 'Read platform configuration', 'Read non-sensitive platform configuration'),
  ('content.moderate', 'Moderate content', 'Review and act on reported content'),
  ('users.manage', 'Manage users', 'Manage user access through approved administration workflows'),
  ('roles.manage', 'Manage roles', 'Assign or revoke platform roles'),
  ('system.manage', 'Manage system', 'Manage restricted system settings')
on conflict (key) do update
set label = excluded.label,
    description = excluded.description;
