// netlify/functions/proxy.js

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
  