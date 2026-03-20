import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "../../lib/prisma";
import { app } from "../../app";

const describeIntegration = process.env.RUN_INTEGRATION_TESTS === "true" ? describe : describe.skip;

describeIntegration("DB integration", () => {
  beforeAll(async () => {
    await prisma.notification.deleteMany();
    await prisma.like.deleteMany();
    await prisma.comment.deleteMany();
    await prisma.repost.deleteMany();
    await prisma.post.deleteMany();
    await prisma.follow.deleteMany();
    await prisma.profileLink.deleteMany();
    await prisma.user.deleteMany();

    await prisma.user.create({
      data: {
        id: "int_user_1",
        email: "int1@example.com",
        username: "int_user_1",
        displayName: "Integration User",
      },
    });

    await prisma.post.create({
      data: {
        authorId: "int_user_1",
        content: "integration test post",
      },
    });
  }, 30000);

  afterAll(async () => {
    await prisma.notification.deleteMany();
    await prisma.like.deleteMany();
    await prisma.comment.deleteMany();
    await prisma.repost.deleteMany();
    await prisma.post.deleteMany();
    await prisma.follow.deleteMany();
    await prisma.profileLink.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  }, 30000);

  it("returns current authenticated user from real database", async () => {
    const response = await request(app)
      .get("/api/users/me")
      .set("x-test-user-id", "int_user_1");

    expect(response.status).toBe(200);
    expect(response.body.id).toBe("int_user_1");
    expect(response.body.username).toBe("int_user_1");
  });

  it("returns feed data from real database", async () => {
    const response = await request(app)
      .get("/api/posts/feed?limit=10")
      .set("x-test-user-id", "int_user_1");

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data.length).toBeGreaterThan(0);
    expect(response.body.data[0].content).toBe("integration test post");
  });
});
