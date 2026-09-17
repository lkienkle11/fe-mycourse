import { describe, expect, it } from "@jest/globals";
import { INSTRUCTOR_PAGE_STATE } from "@/constants/instructor-application";
import { PERMISSIONS } from "@/constants/permissions";
import type { MyInstructorApplication } from "@/types/instructor";
import { getPageState } from "./get-page-state";

function buildApplication(
  overrides: Partial<MyInstructorApplication> = {},
): MyInstructorApplication {
  return {
    id: "app-1",
    user_id: "user-1",
    display_name: "Learner",
    email: "learner@example.com",
    review_status: "pending",
    can_resubmit: false,
    rejection_count: 0,
    latest_submission: null,
    rejection_history: [],
    ...overrides,
  };
}

describe("getPageState", () => {
  it("returns unauthenticated whenever the user is not logged in, regardless of application state", () => {
    expect(
      getPageState({
        isLoggedIn: false,
        application: buildApplication({ review_status: "approved" }),
        permissions: [PERMISSIONS.InstructorApplicationSubmitBlocked],
      }),
    ).toBe(INSTRUCTOR_PAGE_STATE.unauthenticated);
  });

  it("returns approved once the application is approved, even with 5+ rejections recorded historically", () => {
    expect(
      getPageState({
        isLoggedIn: true,
        application: buildApplication({
          review_status: "approved",
          rejection_count: 7,
        }),
        permissions: [],
      }),
    ).toBe(INSTRUCTOR_PAGE_STATE.approved);
  });

  it("returns rejected_contact_admin once rejection_count reaches 5, before checking submit-blocked", () => {
    expect(
      getPageState({
        isLoggedIn: true,
        application: buildApplication({
          review_status: "rejected",
          rejection_count: 5,
        }),
        permissions: [PERMISSIONS.InstructorApplicationSubmitBlocked],
      }),
    ).toBe(INSTRUCTOR_PAGE_STATE.rejected_contact_admin);
  });

  it("returns submit_blocked when the permission is present and no application exists yet", () => {
    expect(
      getPageState({
        isLoggedIn: true,
        application: null,
        permissions: [PERMISSIONS.InstructorApplicationSubmitBlocked],
      }),
    ).toBe(INSTRUCTOR_PAGE_STATE.submit_blocked);
  });

  it("returns ready_to_apply when there is no application and no block", () => {
    expect(
      getPageState({ isLoggedIn: true, application: null, permissions: [] }),
    ).toBe(INSTRUCTOR_PAGE_STATE.ready_to_apply);
  });

  it.each([
    ["pending", INSTRUCTOR_PAGE_STATE.pending_review],
    ["returned", INSTRUCTOR_PAGE_STATE.returned_for_revision],
    ["rejected", INSTRUCTOR_PAGE_STATE.rejected_can_resubmit],
  ] as const)("maps review_status %s to %s when under the rejection-count and block thresholds", (reviewStatus, expected) => {
    expect(
      getPageState({
        isLoggedIn: true,
        application: buildApplication({
          review_status: reviewStatus,
          rejection_count: 1,
        }),
        permissions: [],
      }),
    ).toBe(expected);
  });

  it("falls back to ready_to_apply for a null review_status on an existing application", () => {
    expect(
      getPageState({
        isLoggedIn: true,
        application: buildApplication({ review_status: null }),
        permissions: [],
      }),
    ).toBe(INSTRUCTOR_PAGE_STATE.ready_to_apply);
  });
});
