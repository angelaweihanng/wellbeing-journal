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
