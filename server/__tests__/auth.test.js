/**
 * Auth API tests — register, login, profile, refresh token.
 */
const { app, request, getAuthToken, TEST_USER } = require("./setup");

describe("Auth API", () => {
  let token;

  // ── Registration ────────────────────────────────
  describe("POST /api/auth/register", () => {
    it("should register a new user", async () => {
      const uniqueEmail = `test_${Date.now()}_${Math.random().toString(36).slice(2)}@factoryflow.test`;
      const res = await request(app).post("/api/auth/register").send({
        name: "Reg Test",
        email: uniqueEmail,
        password: "Test@1234",
        factory_name: "Test Factory",
      });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("token");
      expect(res.body).toHaveProperty("user");
      expect(res.body.user.email).toBe(uniqueEmail);
    });

    it("should reject duplicate email", async () => {
      // First ensure a user exists
      await getAuthToken();

      const res = await request(app).post("/api/auth/register").send(TEST_USER);

      expect(res.status).toBe(409);
      expect(res.body).toHaveProperty("error");
    });

    it("should reject invalid email", async () => {
      const res = await request(app).post("/api/auth/register").send({
        name: "Bad Email",
        email: "not-an-email",
        password: "Test@1234",
      });

      expect(res.status).toBe(400);
    });

    it("should reject short password", async () => {
      const res = await request(app).post("/api/auth/register").send({
        name: "Short Pass",
        email: "shortpass@test.com",
        password: "123",
      });

      expect(res.status).toBe(400);
    });
  });

  // ── Login ────────────────────────────────
  describe("POST /api/auth/login", () => {
    beforeAll(async () => {
      token = await getAuthToken();
    });

    it("should login with valid credentials", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: TEST_USER.email,
        password: TEST_USER.password,
      });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("token");
      expect(res.body.user).toHaveProperty("id");
    });

    it("should reject wrong password", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: TEST_USER.email,
        password: "wrongpassword",
      });

      expect(res.status).toBe(401);
    });

    it("should reject non-existent email", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: "doesnotexist@test.com",
        password: "Test@1234",
      });

      expect(res.status).toBe(401);
    });
  });

  // ── Profile ────────────────────────────────
  describe("GET /api/auth/me", () => {
    beforeAll(async () => {
      token = await getAuthToken();
    });

    it("should return profile for authenticated user", async () => {
      const res = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("email", TEST_USER.email);
      expect(res.body).toHaveProperty("name");
    });

    it("should reject unauthenticated request", async () => {
      const res = await request(app).get("/api/auth/me");

      expect(res.status).toBe(401);
    });

    it("should reject invalid token", async () => {
      const res = await request(app)
        .get("/api/auth/me")
        .set("Authorization", "Bearer invalid.token.here");

      expect(res.status).toBe(401);
    });
  });

  // ── Refresh Token ────────────────────────────────
  describe("POST /api/auth/refresh-token", () => {
    beforeAll(async () => {
      token = await getAuthToken();
    });

    it("should issue a new token", async () => {
      const res = await request(app)
        .post("/api/auth/refresh-token")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("token");
      expect(typeof res.body.token).toBe("string");
    });

    it("should reject unauthenticated refresh", async () => {
      const res = await request(app).post("/api/auth/refresh-token");

      expect(res.status).toBe(401);
    });
  });

  // ── Update Profile ────────────────────────────────
  describe("PUT /api/auth/me", () => {
    beforeAll(async () => {
      token = await getAuthToken();
    });

    it("should update profile fields", async () => {
      const res = await request(app)
        .put("/api/auth/me")
        .set("Authorization", `Bearer ${token}`)
        .send({ factory_name: "Updated Factory" });

      expect(res.status).toBe(200);
      expect(res.body.factory_name).toBe("Updated Factory");
    });
  });
});
