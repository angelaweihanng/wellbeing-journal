// src/api.js

const USERNAME = import.meta.env.VITE_ALLOWED_USERNAME;
const NETLIFY_PROXY_URL = '/.netlify/functions/proxy';

/**
 * Fetch a specific entry (usually today)
 */
export async function fetchToday(dateISO) {
  const params = new URLSearchParams({ date: dateISO, username: USERNAME });
  const res = await fetch(`${NETLIFY_PROXY_URL}?${params.toString()}`, {
    method: 'GET',
    headers: { 'Accept': 'application/json' }
  });

  if (!res.ok) {
    const text = await res.text();
    console.error('fetchToday failed:', res.status, text);
    throw new Error(`Failed to fetch entry: ${res.status}`);
  }

  return res.json();
}

/**
 * List recent entries
 */
export async function listEntries(limit = 60) {
  const params = new URLSearchParams({ action: 'list', username: USERNAME, limit: String(limit) });
  const res = await fetch(`${NETLIFY_PROXY_URL}?${params.toString()}`, {
    method: 'GET',
    headers: { 'Accept': 'application/json' }
  });

  if (!res.ok) {
    const text = await res.text();
    console.error('listEntries failed:', res.status, text);
    throw new Error(`Failed to list entries: ${res.status}`);
  }

  return res.json();
}

/**
 * Save or update an entry
 */
export async function saveEntry(payload) {
  const res = await fetch(NETLIFY_PROXY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...payload, username: USERNAME })
  });

  if (!res.ok) {
    const text = await res.text();
    console.error('saveEntry failed:', res.status, text);
    throw new Error(`Failed to save entry: ${res.status}`);
  }

  return res.json();
}