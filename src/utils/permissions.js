function canonicalize(input) {
  if (input == null) return '';
  const raw = String(input).trim().toLowerCase();
  if (!raw) return '';

  // Common formats:
  // - "categories"
  // - "sub_categories"
  // - "categories.view" / "categories:read" / "categories_read"
  // Keep the "resource" part before separators like "." or ":".
  const base = raw.split(/[.:]/)[0];

  // Normalize separators to "_" so "sub-categories" == "sub_categories" == "sub categories"
  return base
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_+/g, '_');
}

export function canonicalPermKey(value) {
  return canonicalize(value);
}

export function buildPermissionSet(permissions) {
  const set = new Set();
  if (!Array.isArray(permissions)) return set;
  for (const p of permissions) {
    const key = canonicalize(p);
    if (key) set.add(key);
  }
  return set;
}

export function hasPermission({ user, permissions }, permKey) {
  const key = canonicalize(permKey);
  if (!key) return true;

  const roleNames = Array.isArray(user?.roles) ? user.roles.map((r) => String(r).toLowerCase()) : [];
  const isSuperAdmin = roleNames.includes('super-admin') || roleNames.includes('superadmin');
  if (isSuperAdmin) return true;

  const set = buildPermissionSet(permissions);
  return set.has(key);
}

export function hasAnyPermission(auth, permKeys = []) {
  if (!permKeys || permKeys.length === 0) return true;
  for (const k of permKeys) {
    if (hasPermission(auth, k)) return true;
  }
  return false;
}

