export const PUBLIC_ROUTES = {
  home: "/",
  becomeInstructor: "/become-instructor",
  forgotPassword: "/forgot-password",
  confirmEmail: "/confirm-email",
  logout: "/logout",
} as const;

export const PRIVATE_ROUTES = {
  admin: {
    root: "/admin",
    users: "/admin/users",
    courses: {
      all: "/admin/courses/all",
      reviewing: "/admin/courses/reviewing",
      trash: "/admin/courses/trash",
    },
    taxonomy: {
      levels: "/admin/taxonomy/levels",
      topics: "/admin/taxonomy/topics",
      outcomes: "/admin/taxonomy/outcomes",
      skills: "/admin/taxonomy/skills",
      tags: "/admin/taxonomy/tags",
    },
    instructors: {
      roster: "/admin/instructors/roster",
      approvals: "/admin/instructors/approvals",
      profiles: "/admin/instructors/profiles",
      expertise: "/admin/instructors/expertise",
      tickets: "/admin/instructors/tickets",
    },
  },
  instructor: {
    root: "/instructor",
    courses: "/instructor/courses",
    media: "/instructor/media",
    tickets: "/instructor/tickets",
  },
  sysadmin: {
    root: "/sysadmin",
    system: "/sysadmin/system",
    roles: "/sysadmin/roles",
    courses: {
      all: "/sysadmin/courses/all",
      reviewing: "/sysadmin/courses/reviewing",
      trash: "/sysadmin/courses/trash",
    },
    taxonomy: {
      levels: "/sysadmin/taxonomy/levels",
      topics: "/sysadmin/taxonomy/topics",
      outcomes: "/sysadmin/taxonomy/outcomes",
      skills: "/sysadmin/taxonomy/skills",
      tags: "/sysadmin/taxonomy/tags",
    },
    instructors: {
      roster: "/sysadmin/instructors/roster",
      approvals: "/sysadmin/instructors/approvals",
      profiles: "/sysadmin/instructors/profiles",
      expertise: "/sysadmin/instructors/expertise",
      tickets: "/sysadmin/instructors/tickets",
    },
  },
  account: {
    myCourses: "/my-courses",
    myCart: "/my-cart",
    wishlist: "/wishlist",
    notifications: "/notifications",
    accountSettings: "/account-settings",
  },
} as const;

export const PUBLIC_RESOURCE_ROUTES = {} as const;

export const PRIVATE_RESOURCE_ROUTES = {
  instructor: {
    courseEditor: `${PRIVATE_ROUTES.instructor.courses}/:courseId/info`,
    courseEditorTab: `${PRIVATE_ROUTES.instructor.courses}/:courseId/:tab`,
  },
  sysadmin: {
    courseReviewPreview: `${PRIVATE_ROUTES.sysadmin.courses.reviewing}/:courseId/preview`,
  },
} as const;
