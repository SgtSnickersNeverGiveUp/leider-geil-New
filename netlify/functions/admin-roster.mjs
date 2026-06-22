import { getStore } from "@netlify/blobs";
import { requireAdmin } from "./admin-auth.mjs";
import { jsonResponse, methodNotAllowed } from "./_shared/http.mjs";

const STORE_NAME = "roster";

const DEFAULT_ROSTER = [
  {
    id: "m001",
    name: "SgtSnickers",
    role: "Gründer / IGL",
    avatar: "https://via.placeholder.com/160/1a1a2e/0FF2A9?text=SS",
    games: ["PUBG", "ARC Raiders"],
    stats: { kd: 3.42, extractionRate: "68%", wins: 214 },
    clanRole: "Leader",
    bio: "Gründer und In-Game-Leader von Leider Geil. Taktik-Nerd mit einer Schwäche für gute Callouts und schlechte Wortwitze.",
    funTags: ["IGL", "Taktik-Fuchs"],
  },
  {
    id: "m002",
    name: "FragMaster",
    role: "Squad Leader – PUBG",
    avatar: "https://via.placeholder.com/160/1a1a2e/FF9C43?text=FM",
    games: ["PUBG"],
    stats: { kd: 2.87, extractionRate: "52%", wins: 156 },
    clanRole: "Officer",
    bio: "PUBG-Veteran seit Early Access. Führt sein Squad mit ruhiger Hand durch den Bluezone-Sturm – und hat trotzdem immer einen lockeren Spruch auf Lager.",
    funTags: ["Sniper", "Loot-Goblin"],
  },
  {
    id: "m003",
    name: "NeonViper",
    role: "Support / Medic",
    avatar: "https://via.placeholder.com/160/1a1a2e/0FF2A9?text=NV",
    games: ["ARC Raiders"],
    stats: { kd: 1.94, extractionRate: "74%", wins: 98 },
    clanRole: "Member",
    bio: "Hält das Team am Leben – buchstäblich. Ohne NeonViper wäre jede Extraction ein Himmelfahrtskommando.",
    funTags: ["Medic", "Team-Player"],
  },
  {
    id: "m004",
    name: "GhostRecon",
    role: "Sniper",
    avatar: "https://via.placeholder.com/160/1a1a2e/FF9C43?text=GR",
    games: ["PUBG", "ARC Raiders"],
    stats: { kd: 4.11, extractionRate: "61%", wins: 189 },
    clanRole: "Member",
    bio: "Man hört ihn nie kommen, aber seinen Headshot spürt man sofort. Der stille Beschützer des Squads.",
    funTags: ["Sniper", "Ghost"],
  },
];

async function seedIfEmpty(store) {
  const { blobs } = await store.list();
  if (blobs.length > 0) return;
  for (const member of DEFAULT_ROSTER) {
    await store.setJSON(member.id, member);
  }
}

async function listRoster(store) {
  await seedIfEmpty(store);
  const { blobs } = await store.list();
  const members = [];
  for (const blob of blobs) {
    const data = await store.get(blob.key, { type: "json" });
    if (data) members.push(data);
  }
  return members;
}

export default async (req) => {
  const adminGuard = requireAdmin(req);
  if (adminGuard) return adminGuard;

  const store = getStore(STORE_NAME);

  if (req.method === "GET") {
    try {
      return jsonResponse(await listRoster(store));
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
      };

      await store.setJSON(id, updated);
      return jsonResponse({ success: true, member: updated });
    } catch {
      return jsonResponse({ error: "Fehler beim Aktualisieren." }, 500);
    }
  }

  if (req.method === "DELETE") {
    try {
      const id = new URL(req.url).searchParams.get("id");
      if (!id) return jsonResponse({ error: "ID fehlt." }, 400);
      await store.delete(id);
      return jsonResponse({ success: true });
    } catch {
      return jsonResponse({ error: "Fehler beim Löschen." }, 500);
    }
  }

  return methodNotAllowed();
};

export const config = {
  path: "/api/admin-roster",
};
