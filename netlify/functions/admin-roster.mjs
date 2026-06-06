import { getStore } from "@netlify/blobs";
import { requireAdmin } from "./admin-auth.mjs";

const STORE_NAME = "roster";

export default async (req) => {
  const adminGuard = requireAdmin(req);
  if (adminGuard) return adminGuard;

  const store = getStore(STORE_NAME);

  if (req.method === "GET") {
    try {
      const { blobs } = await store.list();
      const members = [];

      for (const blob of blobs) {
        const data = await store.get(blob.key, { type: "json" });
        if (data) members.push(data);
      }

      return new Response(JSON.stringify(members), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch {
      return new Response(JSON.stringify({ error: "Fehler beim Laden." }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  if (req.method === "POST") {
    try {
      const body = await req.json();
      const { name, role, avatar } = body;

      if (!name || !role) {
        return new Response(JSON.stringify({ error: "Name und Rolle sind Pflichtfelder." }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
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
      };

      await store.setJSON(id, member);

      return new Response(JSON.stringify({ success: true, id, member }), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      });
    } catch {
      return new Response(JSON.stringify({ error: "Fehler beim Speichern." }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  if (req.method === "PUT") {
    try {
      const body = await req.json();
      const { id, name, role, avatar, games, stats } = body;

      if (!id) {
        return new Response(JSON.stringify({ error: "ID fehlt." }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const existing = await store.get(id, { type: "json" });
      if (!existing) {
        return new Response(JSON.stringify({ error: "Mitglied nicht gefunden." }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

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
      };

      await store.setJSON(id, updated);

      return new Response(JSON.stringify({ success: true, member: updated }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch {
      return new Response(JSON.stringify({ error: "Fehler beim Aktualisieren." }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  if (req.method === "DELETE") {
    try {
      const url = new URL(req.url);
      const id = url.searchParams.get("id");

      if (!id) {
        return new Response(JSON.stringify({ error: "ID fehlt." }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      await store.delete(id);

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch {
      return new Response(JSON.stringify({ error: "Fehler beim Löschen." }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  return new Response(JSON.stringify({ error: "Method not allowed" }), {
    status: 405,
    headers: { "Content-Type": "application/json" },
  });
};

export const config = {
  path: "/api/admin/roster",
};
