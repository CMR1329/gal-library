import { describe, expect, it } from "vitest";
import { isAdminRole, isSuperAdminRole, normalizeUserRole } from "./roles";

describe("administrator roles", () => {
  it("treats unknown database values as a normal user", () => {
    expect(normalizeUserRole("owner")).toBe("user");
    expect(normalizeUserRole(null)).toBe("user");
  });

  it("recognizes only admin and super_admin as backend roles", () => {
    expect(isAdminRole("user")).toBe(false);
    expect(isAdminRole("admin")).toBe(true);
    expect(isAdminRole("super_admin")).toBe(true);
    expect(isSuperAdminRole("admin")).toBe(false);
    expect(isSuperAdminRole("super_admin")).toBe(true);
  });
});
