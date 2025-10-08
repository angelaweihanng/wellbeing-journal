const GAS_URL = import.meta.env.VITE_GAS_URL;
const USERNAME = import.meta.env.VITE_ALLOWED_USERNAME;

export async function fetchToday(dateISO) {
  const params = new URLSearchParams({ date: dateISO, username: USERNAME });
  const res = await fetch(`${GAS_URL}?${params.toString()}`);
  return res.json();
}

export async function listEntries(limit = 60) {
  const params = new URLSearchParams({ action: 'list', username: USERNAME, limit: String(limit) });
  const res = await fetch(`${GAS_URL}?${params.toString()}`);
  return res.json();
}

export async function saveEntry(payload) {
  const res = await fetch(GAS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...payload, username: USERNAME })
  });
  return res.json();
}

export default async (req, context) => {
  const targetUrl = "https://script.google.com/macros/s/AKfycbxXwndcGZcqOddAP1U7ZCSiZzWTXObvce-pkdwRCuMGzLbM_MTY7SsDhB2VsJQBefklDQ/exec";

  const url = new URL(req.url);
  const method = req.method;

  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };

  let fetchOptions = { method, headers };

  if (method !== 'GET' && method !== 'HEAD') {
    const body = await req.text();
    fetchOptions.body = body;
  }

  const proxiedUrl = targetUrl + url.search; // append ?date=... for GET

  const response = await fetch(proxiedUrl, fetchOptions);
  const data = await response.text();

  return new Response(data, {
    status: response.status,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json',
    }
  });
};
