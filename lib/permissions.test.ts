import { describe, expect, it } from "vitest";
import { can, isStaff, PERMISSIONS, type Permission } from "@/lib/permissions";

const matrix: Record<string, Permission[]> = {
  VIEWER: ["console.view", "wedding.view"],
  SUPPORT: ["console.view", "wedding.view", "wedding.edit", "user.reset", "payment.reverify", "notes.write"],
  ADMIN: [
    "console.view", "wedding.view", "wedding.edit", "wedding.manage", "wedding.status", "wedding.comp",
    "user.reset", "user.impersonate", "payment.reverify", "notes.write",
  ],
  SUPER_ADMIN: Object.keys(PERMISSIONS) as Permission[],
};

describe("permissions", () => {
  for (const [role, allowed] of Object.entries(matrix)) {
    it(`${role} has exactly its permissions`, () => {
      const actual = (Object.keys(PERMISSIONS) as Permission[]).filter((p) => can(role, p));
      expect(actual.sort()).toEqual([...allowed].sort());
    });
  }

  it("couples and unknown roles have no staff permissions", () => {
    for (const role of ["USER", "", null, undefined, "HACKER"]) {
      expect(isStaff(role)).toBe(false);
      expect((Object.keys(PERMISSIONS) as Permission[]).some((p) => can(role, p))).toBe(false);
    }
  });

  it("only super admins manage staff and plans", () => {
    expect(can("ADMIN", "staff.manage")).toBe(false);
    expect(can("ADMIN", "plans.manage")).toBe(false);
    expect(can("SUPER_ADMIN", "staff.manage")).toBe(true);
  });
});
