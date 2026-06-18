import { getStore } from "@netlify/blobs";
import { requireAdmin } from "./admin-auth.mjs";
import { toAdminRosterMember } from "./_shared/admin-roster-data.mjs";
import { ROSTER_STORE_NAME, listRosterMembers } from "./_shared/roster-data.mjs";

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export default async (req) => {
  if (!["GET", "POST", "PUT", "DELETE"].includes(req.method)) {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const adminGuard = requireAdmin(req);
  if (adminGuard) return adminGuard;

  const store = getStore(ROSTER_STORE_NAME);

  if (req.method === "GET") {
    try {
      const members = (await listRosterMembers(store)).map(toAdminRosterMember);
      return jsonResponse(members);
    } catch {
      return jsonResponse({ error: "Fehler beim Laden." }, 500);
    }
  }

  if (req.method === "POST") {
    try {
      const body = await req.json();
      const { name, role, avatar } = body;

      if (!name || !role) {
        return jsonResponse({ error: "Name und Rolle sind Pflichtfelder." }, 400);
      }

      const id = `m_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const member = {
        id,
        name,
        role,
        avatar: avatar || `https://via.placeholder.com/160/1a1a2e/0FF2A9?text=${encodeURIComponent(name.slice(0, 2).toUpperCase())}`,
        games: body.games || [],
        stats: body.stats || { kd: 0, extractionRate: "0%", wins: 0 },
        clanRole: body.clanRole || "Member",
        bio: body.bio || "",
        funTags: body.funTags || [],
        gender: body.gender || "",
      };

      await store.setJSON(id, member);
      return jsonResponse({ success: true, id, member }, 201);
    } catch {
      return jsonResponse({ error: "Fehler beim Speichern." }, 500);
    }
  }

  if (req.method === "PUT") {
    try {
      const body = await req.json();
      const { id, name, role, avatar, games, stats } = body;

      if (!id) return jsonResponse({ error: "ID fehlt." }, 400);

      const existing = await store.get(id, { type: "json" });
      if (!existing) return jsonResponse({ error: "Mitglied nicht gefunden." }, 404);

      const updated = {
        ...existing,
        name: name || existing.name,
        role: role || existing.role,
        avatar: avatar !== undefined ? avatar : existing.avatar,
        games: games !== undefined ? games : existing.games,
        stats: stats !== undefined ? stats : existing.stats,
        clanRole: body.clanRole !== undefined ? body.clanRole : (existing.clanRole || "Member"),
        bio: body.bio !== undefined ? body.bio : (existing.bio || ""),
        funTags: body.funTags !== undefined ? body.funTags : (existing.funTags || []),
        gender: body.gender !== undefined ? body.gender : (existing.gender || ""),
      };

      await store.setJSON(id, updated);
      return jsonResponse({ success: true, member: updated });
    } catch {
      return jsonResponse({ error: "Fehler beim Aktualisieren." }, 500);
    }
  }

  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id) return jsonResponse({ error: "ID fehlt." }, 400);

    await store.delete(id);
    return jsonResponse({ success: true });
  } catch {
    return jsonResponse({ error: "Fehler beim Löschen." }, 500);
  }
};

export const config = {
  path: "/api/admin/roster",
};
