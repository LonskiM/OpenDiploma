import request from "supertest";
import "../index"; // ensure app is started

describe("healthcheck", () => {
    it("GET /healthz should return ok", async () => {
        const res = await request("http://localhost:" + (process.env.PORT ?? 5000)).get(
            "/healthz"
        );

        expect(res.status).toBe(200);
        expect(res.body).toEqual({ status: "ok" });
    });
});

