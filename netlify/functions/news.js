// netlify/functions/news.js

const { getStore, connectLambda } = require('@netlify/blobs');

function getCorsHeaders() {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': 'https://www.leider-geil.com',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

// Holt den Store, aber erst NACH connectLambda
async function getNewsStore() {
  return getStore({ name: 'clan-news' });
}

async function readNews() {
  try {
    const store = await getNewsStore();
    const blob = await store.get('news.json');

    if (!blob || blob.length === 0) {
      return [];
    }

    const json = JSON.parse(blob);
    return Array.isArray(json) ? json : [];
  } catch (err) {
    console.error('readNews error', err);
    return [];
  }
}

async function writeNews(newsArray) {
  const store = await getNewsStore();
  await store.set('news.json', JSON.stringify(newsArray, null, 2), {
    metadata: { type: 'clan-news' },
  });
}

exports.handler = async (event, context) => {
  const headers = getCorsHeaders();

  // Blobs-Umgebung initialisieren (Lambda-Kompatibilitätsmodus)
  connectLambda(event);

  // Preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers,
      body: '',
    };
  }

  if (event.httpMethod === 'GET') {
    const news = await readNews();
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(news),
    };
  }

  if (event.httpMethod === 'POST') {
    try {
      console.log('RAW BODY:', event.body);
      const body = event.body ? JSON.parse(event.body) : [];
      console.log('PARSED BODY:', body);
      const news = Array.isArray(body) ? body : [];
      await writeNews(news);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ ok: true, count: news.length }),
      };
    } catch (err) {
      console.error('POST /news error', err, 'body was:', event.body);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid JSON', raw: event.body }),
      };
    }
  }

  return {
    statusCode: 405,
    headers,
    body: JSON.stringify({ error: 'Method not allowed' }),
  };
};
