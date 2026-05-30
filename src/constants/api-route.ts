// Public routes
export const API_PUBLIC_ROUTES = {
  auth: {
    login: "/api/v1/auth/login",
    register: "/api/v1/auth/register",
    confirm: "/api/v1/auth/confirm",
    refresh: "/api/v1/auth/refresh",
    logout: "/api/v1/auth/logout",
  },
} as const;

// Required authentication
export const API_PRIVATE_ROUTES = {
  user: {
    getMe: "/api/v1/me",
  },
  taxonomy: {
    levels: "/api/v1/taxonomy/levels",
    topics: "/api/v1/taxonomy/topics",
    outcomes: "/api/v1/taxonomy/outcomes",
    skills: "/api/v1/taxonomy/skills",
    tags: "/api/v1/taxonomy/tags",
    byId: "/api/v1/taxonomy/:segment/:id",
  },
  media: {
    files: "/api/v1/media/files",
    fileById: "/api/v1/media/files/:objectKey",
    batchDelete: "/api/v1/media/files/batch-delete",
  },
  instructor: {
    roster: "/api/v1/instructors",
    rosterById: "/api/v1/instructors/:id",
    expertiseTopics: "/api/v1/instructors/:id/expertise/topics",
    expertiseTopicByRow: "/api/v1/instructors/:id/expertise/topics/:topicRowId",
    expertiseSkills: "/api/v1/instructors/:id/expertise/skills",
    expertiseSkillByRow: "/api/v1/instructors/:id/expertise/skills/:skillRowId",
    applications: "/api/v1/instructor-applications",
    applicationById: "/api/v1/instructor-applications/:id",
    applicationApprove: "/api/v1/instructor-applications/:id/approve",
    applicationReject: "/api/v1/instructor-applications/:id/reject",
    profiles: "/api/v1/instructor-profiles",
    profileMe: "/api/v1/instructor-profiles/me",
    profileByUser: "/api/v1/instructor-profiles/:id",
    tickets: "/api/v1/instructor-tickets",
    ticketClose: "/api/v1/instructor-tickets/:id/close",
    ticketMessages: "/api/v1/instructor-tickets/:id/messages",
  },
} as const;
