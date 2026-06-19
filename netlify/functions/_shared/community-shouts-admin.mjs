import {
  listStoredShouts,
  sanitizeText,
  toAdminShout,
} from "./community-shouts-store.mjs";

export async function listModerationShouts(store) {
  return (await listStoredShouts(store)).map(toAdminShout);
}

export async function setShoutVisibility(store, id, visible) {
  const safeId = sanitizeText(id, 80);
  if (!safeId) {
    return { error: { message: "ID fehlt.", status: 400 } };
  }

  const existing = await store.get(safeId, { type: "json" });
  if (!existing) {
    return { error: { message: "Shout nicht gefunden.", status: 404 } };
  }

  const nextVisible = Boolean(visible);
  const updated = {
    ...existing,
    visible: nextVisible,
    approved: nextVisible,
    moderatedAt: new Date().toISOString(),
  };

  await store.setJSON(safeId, updated);
  return { shout: toAdminShout(updated) };
}

export async function deleteModerationShout(store, id) {
  const safeId = sanitizeText(id, 80);
  if (!safeId) {
    return { error: { message: "ID fehlt.", status: 400 } };
  }

  await store.delete(safeId);
  return { success: true };
}
