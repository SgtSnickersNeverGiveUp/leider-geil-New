// netlify/functions/news.js

const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'news-data.json');

function readNews() {
  try {
    if (!fs.existsSync(DATA_FILE)) return [];
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    const json = JSON.parse(raw);
    return Array.isArray(json) ? json : [];
  } catch (err) {
    console.error('readNews error', err);
    return [];
  }
}

function writeNews(newsArray) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(newsArray, null, 2), 'utf8');
}

exports.handler = async (event, context) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': 'https://www.leider-geil.com',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // Preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers,
      body: '',
    };
  }

  if (event.httpMethod === 'GET') {
    const news = readNews();
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
    writeNews(news);
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

  // Fallback für andere Methoden
  return {
    statusCode: 405,
    headers,
    body: JSON.stringify({ error: 'Method not allowed' }),
  };
};
