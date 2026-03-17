import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { app } from "../app";
import * as commentService from "../services/comment.service";

describe("Comments routes", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("creates comment for a post", async () => {
    vi.spyOn(commentService, "createComment").mockResolvedValueOnce({
      id: "comment_1",
      content: "nice",
      postId: "post_1",
      authorId: "user_1",
    } as any);

    const response = await request(app)
      .post("/api/comments/post/post_1")
      .set("x-test-user-id", "user_1")
      .send({ content: "nice" });

    expect(response.status).toBe(201);
    expect(response.body.id).toBe("comment_1");
  });

  it("returns comments by user", async () => {
    vi.spyOn(commentService, "getCommentsByUser").mockResolvedValueOnce({
      data: [{ id: "comment_2", content: "reply" }],
      nextCursor: null,
    } as any);

    const response = await request(app)
      .get("/api/comments/user/user_1?limit=10")
      .set("x-test-user-id", "user_1");

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.data)).toBe(true);
  });
});
