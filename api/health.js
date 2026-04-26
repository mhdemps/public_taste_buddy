/** Quick check that Vercel is invoking `/api/*` functions (GET /api/health → JSON). */
export default {
  async fetch() {
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });
  },
};
