import { describe, expect, it } from "vitest";
import { assertAuthenticatedUserId, AuthenticationError } from "./current-user";

describe("authenticated identity guard", () => {
  it("does not invent a default identity for anonymous access", () => {
    expect(() => assertAuthenticatedUserId(null)).toThrow(AuthenticationError);
    expect(() => assertAuthenticatedUserId(undefined)).toThrow("请先登录");
  });

  it("returns only the authenticated session identity", () => {
    expect(assertAuthenticatedUserId("session-user-id")).toBe("session-user-id");
  });
});
