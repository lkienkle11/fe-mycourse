import { describe, expect, it } from "@jest/globals";
import { PERMISSIONS } from "@/constants/permissions";
import type { PermissionNavNode } from "./permission";
import {
  canShowWithPermissions,
  filterPermissionNavTree,
  hasAllPermissions,
  hasAnyPermission,
  isLearnerUser,
  satisfiesPermissions,
  toPermissionSet,
} from "./permission";

describe("hasAllPermissions / hasAnyPermission", () => {
  const set = toPermissionSet([
    PERMISSIONS.CourseRead,
    PERMISSIONS.CourseUpdate,
  ]);

  it("hasAllPermissions requires every listed permission", () => {
    expect(hasAllPermissions(set, PERMISSIONS.CourseRead)).toBe(true);
    expect(
      hasAllPermissions(set, PERMISSIONS.CourseRead, PERMISSIONS.CourseUpdate),
    ).toBe(true);
    expect(
      hasAllPermissions(set, PERMISSIONS.CourseRead, PERMISSIONS.CourseDelete),
    ).toBe(false);
  });

  it("hasAnyPermission requires at least one listed permission", () => {
    expect(hasAnyPermission(set, PERMISSIONS.CourseDelete)).toBe(false);
    expect(
      hasAnyPermission(set, PERMISSIONS.CourseDelete, PERMISSIONS.CourseUpdate),
    ).toBe(true);
  });
});

describe("satisfiesPermissions", () => {
  const set = toPermissionSet([PERMISSIONS.CourseRead]);

  it("empty/omitted requirement is always visible", () => {
    expect(satisfiesPermissions(set, {})).toBe(true);
    expect(satisfiesPermissions(set, { permissions: [] })).toBe(true);
  });

  it("defaults to 'all' mode", () => {
    expect(
      satisfiesPermissions(set, {
        permissions: [PERMISSIONS.CourseRead, PERMISSIONS.CourseUpdate],
      }),
    ).toBe(false);
  });

  it("'any' mode passes with a single matching permission", () => {
    expect(
      satisfiesPermissions(set, {
        permissions: [PERMISSIONS.CourseRead, PERMISSIONS.CourseUpdate],
        permissionMode: "any",
      }),
    ).toBe(true);
  });

  it("absent permission fails 'all' mode", () => {
    expect(
      satisfiesPermissions(set, { permissions: [PERMISSIONS.CourseDelete] }),
    ).toBe(false);
  });
});

describe("canShowWithPermissions", () => {
  it("delegates to satisfiesPermissions with the given mode", () => {
    const set = toPermissionSet([PERMISSIONS.CourseRead]);
    expect(canShowWithPermissions(set, [PERMISSIONS.CourseRead])).toBe(true);
    expect(
      canShowWithPermissions(
        set,
        [PERMISSIONS.CourseRead, PERMISSIONS.CourseDelete],
        "any",
      ),
    ).toBe(true);
  });
});

describe("isLearnerUser", () => {
  it("is true when the user can apply but holds no elevated role-modify permission", () => {
    const set = toPermissionSet([PERMISSIONS.InstructorApplicationCreate]);
    expect(isLearnerUser(set)).toBe(true);
  });

  it("is false without instructor-application-create", () => {
    const set = toPermissionSet([PERMISSIONS.CourseRead]);
    expect(isLearnerUser(set)).toBe(false);
  });

  it("is false when the user already holds an elevated role-modify permission", () => {
    const set = toPermissionSet([
      PERMISSIONS.InstructorApplicationCreate,
      PERMISSIONS.InstructorModify,
    ]);
    expect(isLearnerUser(set)).toBe(false);
  });

  it("role labels never substitute for permission inputs", () => {
    const set = toPermissionSet([]);
    expect(isLearnerUser(set)).toBe(false);
  });
});

describe("filterPermissionNavTree", () => {
  const tree: PermissionNavNode[] = [
    {
      href: "/courses",
      permissions: [PERMISSIONS.CourseRead],
    },
    {
      href: "/users",
      permissions: [PERMISSIONS.UserRead],
    },
    {
      children: [
        {
          href: "/admin/deep",
          permissions: [PERMISSIONS.CourseDelete],
        },
        {
          href: "/admin/shallow",
          permissions: [PERMISSIONS.CourseRead],
        },
      ],
    },
  ];

  it("keeps only leaves whose permission requirement is satisfied", () => {
    const set = toPermissionSet([PERMISSIONS.CourseRead]);
    const result = filterPermissionNavTree(set, tree);

    expect(result).toHaveLength(2);
    expect(result[0]?.href).toBe("/courses");
    expect(result[1]?.children).toHaveLength(1);
    expect(result[1]?.children?.[0]?.href).toBe("/admin/shallow");
  });

  it("drops a branch entirely once every descendant is filtered out", () => {
    const set = toPermissionSet([]);
    const result = filterPermissionNavTree(set, tree);
    expect(result).toHaveLength(0);
  });

  it("retains a nested branch when a deep leaf remains visible", () => {
    const set = toPermissionSet([PERMISSIONS.CourseDelete]);
    const result = filterPermissionNavTree(set, tree);
    const branch = result.find((item) => !item.href);
    expect(branch?.children).toHaveLength(1);
    expect(branch?.children?.[0]?.href).toBe("/admin/deep");
  });
});
