/** Canonical permission names — 1:1 mirror of BE `constants.AllPermissions`. */
export const PERMISSIONS = {
  // Profile
  ProfileRead: "profile:read",
  ProfileUpdate: "profile:update",
  ProfileDelete: "profile:delete",
  ProfileCreate: "profile:create",
  // Course
  CourseRead: "course:read",
  CourseUpdate: "course:update",
  CourseDelete: "course:delete",
  CourseCreate: "course:create",
  // Course Instructor
  CourseInstructorRead: "course_instructor:read",
  // User
  UserRead: "user:read",
  UserUpdate: "user:update",
  UserDelete: "user:delete",
  UserCreate: "user:create",
  // Course Level
  CourseLevelRead: "course_level:read",
  CourseLevelCreate: "course_level:create",
  CourseLevelUpdate: "course_level:update",
  CourseLevelDelete: "course_level:delete",
  // Topic
  TopicRead: "topic:read",
  TopicCreate: "topic:create",
  TopicUpdate: "topic:update",
  TopicDelete: "topic:delete",
  // Course Outcome
  CourseOutcomeRead: "course_outcome:read",
  CourseOutcomeCreate: "course_outcome:create",
  CourseOutcomeUpdate: "course_outcome:update",
  CourseOutcomeDelete: "course_outcome:delete",
  // Course Skill
  CourseSkillRead: "course_skill:read",
  CourseSkillCreate: "course_skill:create",
  CourseSkillUpdate: "course_skill:update",
  CourseSkillDelete: "course_skill:delete",
  // Tag
  TagRead: "tag:read",
  TagCreate: "tag:create",
  TagUpdate: "tag:update",
  TagDelete: "tag:delete",
  // Media File
  MediaFileRead: "media_file:read",
  MediaFileCreate: "media_file:create",
  MediaFileUpdate: "media_file:update",
  MediaFileDelete: "media_file:delete",
  // Role modify (scoped admin actions)
  SysadminModify: "sysadmin:modify",
  AdminModify: "admin:modify",
  InstructorModify: "instructor:modify",
  // Instructor roster
  InstructorRosterRead: "instructor_roster:read",
  InstructorRosterCreate: "instructor_roster:create",
  InstructorRosterDelete: "instructor_roster:delete",
  // Instructor application
  InstructorApplicationRead: "instructor_application:read",
  InstructorApplicationCreate: "instructor_application:create",
  InstructorApplicationUpdate: "instructor_application:update",
  InstructorApplicationDelete: "instructor_application:delete",
  InstructorApplicationApprove: "instructor_application:approve",
  InstructorApplicationReject: "instructor_application:reject",
  InstructorApplicationSubmitBlocked: "instructor_application:submit_blocked",
  // Instructor profile
  InstructorProfileRead: "instructor_profile:read",
  InstructorProfileCreate: "instructor_profile:create",
  InstructorProfileUpdate: "instructor_profile:update",
  InstructorProfileDelete: "instructor_profile:delete",
  // Instructor expertise
  InstructorExpertiseRead: "instructor_expertise:read",
  InstructorExpertiseCreate: "instructor_expertise:create",
  InstructorExpertiseUpdate: "instructor_expertise:update",
  InstructorExpertiseDelete: "instructor_expertise:delete",
  // Instructor ticket
  InstructorTicketClose: "instructor_ticket:close",
  // Course review (admin/sysadmin queue)
  CourseReviewRead: "course_review:read",
  CourseReviewApprove: "course_review:approve",
  CourseReviewReject: "course_review:reject",
  // Course catalog (admin list + trash action)
  CourseCatalogRead: "course_catalog:read",
  CourseCatalogTrash: "course_catalog:trash",
  // Course trash bin
  CourseTrashRead: "course_trash:read",
  CourseTrashRestore: "course_trash:restore",
  CourseTrashDelete: "course_trash:delete",
  // Course collaborator picker
  CourseCollaboratorCandidateRead: "course_collaborator_candidate:read",
} as const;
