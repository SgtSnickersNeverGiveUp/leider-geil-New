import { getStore } from "@netlify/blobs";

const STORE_NAME = "visitor-counter";
const COUNTER_KEY = "homepage";

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}

async function readCounter(store) {
  const data = await store.get(COUNTER_KEY, { type: "json" });
  const count = Number(data?.count);

  return {
    count: Number.isFinite(count) && count >= 0 ? Math.floor(count) : 0,
    updatedAt: data?.updatedAt || null,
  };
}

export default async (req) => {
  const store = getStore(STORE_NAME);

  if (req.method === "GET") {
    try {
      const counter = await readCounter(store);
      return jsonResponse(counter);
    } catch (err) {
      return jsonResponse({ error: "Besucherzaehler konnte nicht geladen werden." }, 500);
    }
  }

  if (req.method === "POST") {
    try {
      const counter = await readCounter(store);
      const updated = {
        count: counter.count + 1,
        updatedAt: new Date().toISOString(),
      };

      await store.setJSON(COUNTER_KEY, updated);
      return jsonResponse(updated);
    } catch (err) {
      return jsonResponse({ error: "Besucherzaehler konnte nicht aktualisiert werden." }, 500);
    }
  }

  return jsonResponse({ error: "Method not allowed" }, 405);
};

export const config = {
  path: "/api/visitor-count",
};
