export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/items') {
      if (request.method === 'GET') {
        const row = await env.DB.prepare('SELECT data FROM settings WHERE id=1').first();
        return Response.json(row ? JSON.parse(row.data) : []);
      }
      if (request.method === 'PUT') {
        const data = await request.json();
        await env.DB.prepare('INSERT INTO settings (id,data) VALUES (1,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data').bind(JSON.stringify(data)).run();
        return Response.json({ok:true});
      }
    }
    return env.ASSETS.fetch(request);
  }
};
