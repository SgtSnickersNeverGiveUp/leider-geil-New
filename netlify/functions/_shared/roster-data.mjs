export const ROSTER_STORE_NAME = "roster";

export const DEFAULT_ROSTER = [
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

export async function seedRosterIfEmpty(store) {
  const { blobs } = await store.list();
  if (blobs.length === 0) {
    for (const member of DEFAULT_ROSTER) {
      await store.setJSON(member.id, member);
    }
  }
}

export async function listRosterMembers(store) {
  await seedRosterIfEmpty(store);
  const { blobs } = await store.list();
  const members = [];

  for (const blob of blobs) {
    const data = await store.get(blob.key, { type: "json" });
    if (data) members.push(data);
  }

  return members;
}
