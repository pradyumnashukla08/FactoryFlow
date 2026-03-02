/**
 * Dashboard & Export API tests.
 */
const { app, request, getAuthToken } = require("./setup");

describe("Dashboard API", () => {
  let token;

  beforeAll(async () => {
    token = await getAuthToken();
  });

  describe("GET /api/dashboard", () => {
    it("should return dashboard statistics", async () => {
      const res = await request(app).get("/api/dashboard").set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      // Dashboard should have summary stats
      expect(res.body).toHaveProperty("total_customers");
      expect(res.body).toHaveProperty("total_orders");
      expect(res.body).toHaveProperty("total_revenue");
    });

    it("should reject unauthenticated request", async () => {
      const res = await request(app).get("/api/dashboard");

      expect(res.status).toBe(401);
    });
  });
});

describe("Export API", () => {
  let token;

  beforeAll(async () => {
    token = await getAuthToken();
  });

  describe("GET /api/export/customers", () => {
    it("should export customers as Excel file", async () => {
      const res = await request(app)
        .get("/api/export/customers?format=excel")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.headers["content-type"]).toMatch(/spreadsheet|octet-stream/);
    });

    it("should reject unauthenticated request", async () => {
      const res = await request(app).get("/api/export/customers");

      expect(res.status).toBe(401);
    });
  });
});

describe("Import API", () => {
  let token;

  beforeAll(async () => {
    token = await getAuthToken();
  });

  describe("GET /api/import/template", () => {
    it("should download import template", async () => {
      const res = await request(app)
        .get("/api/import/template")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.headers["content-type"]).toMatch(/spreadsheet|octet-stream/);
    });
  });
});
