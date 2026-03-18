import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { app } from "../app";
import * as postService from "../services/post.service";

describe("Posts routes", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("creates post for authenticated user", async () => {
    vi.spyOn(postService, "createPost").mockResolvedValueOnce({
      id: "post_1",
      content: "hello",
      authorId: "user_1",
      imageUrls: [],
    } as any);

    const response = await request(app)
      .post("/api/posts")
      .set("x-test-user-id", "user_1")
      .send({ content: "hello" });

    expect(response.status).toBe(201);
    expect(response.body.id).toBe("post_1");
  });

  it("returns feed page for authenticated user", async () => {
    vi.spyOn(postService, "getFeed").mockResolvedValueOnce({
      data: [{ id: "post_1" }],
      nextCursor: null,
    } as any);

    const response = await request(app)
      .get("/api/posts/feed?limit=10")
      .set("x-test-user-id", "user_1");

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  it("returns reposts page for user", async () => {
    vi.spyOn(postService, "getRepostsByUser").mockResolvedValueOnce({
      data: [{ id: "post_2" }],
      nextCursor: null,
    } as any);

    const response = await request(app)
      .get("/api/posts/user/user_1/reposts?limit=10")
      .set("x-test-user-id", "user_1");

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  it("reposts a post", async () => {
    vi.spyOn(postService, "repostPost").mockResolvedValueOnce({ success: true } as any);

    const response = await request(app)
      .post("/api/posts/post_1/repost")
      .set("x-test-user-id", "user_1");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  it("undoes repost on a post", async () => {
    vi.spyOn(postService, "unrepostPost").mockResolvedValueOnce({ success: true } as any);

    const response = await request(app)
      .delete("/api/posts/post_1/repost")
      .set("x-test-user-id", "user_1");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});
