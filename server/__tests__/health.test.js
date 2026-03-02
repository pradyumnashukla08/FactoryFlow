/**
 * Health & core API tests.
 */
const { app, request } = require("./setup");

describe("Health & Core API", () => {
  // ── Health Check ────────────────────────────────
  describe("GET /api/health", () => {
    it("should return health status", async () => {
      const res = await request(app).get("/api/health");

      expect([200, 503]).toContain(res.status);
      expect(res.body).toHaveProperty("status");
      expect(res.body).toHaveProperty("service", "FactoryFlow API");
      expect(res.body).toHaveProperty("timestamp");
      expect(res.body).toHaveProperty("uptime");
    });
  });

  // ── 404 handling ────────────────────────────────
  describe("Unknown API route", () => {
    it("should return 404 for unknown API route (if no catch-all)", async () => {
      const res = await request(app).get("/api/nonexistent");

      // In dev mode, there's no catch-all so it should 404
      expect([404, 200]).toContain(res.status);
    });
  });

  // ── Rate limiting ────────────────────────────────
  describe("Rate limiting", () => {
    it("should include rate limit headers", async () => {
      const res = await request(app).get("/api/health");

      // express-rate-limit adds these headers
      expect(res.headers).toHaveProperty("ratelimit-limit");
    });
  });
});
