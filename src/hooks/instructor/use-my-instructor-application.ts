"use client";

import useSWR from "swr";
import {
  contactInstructorAdminService,
  getMyInstructorApplicationKey,
  getMyInstructorApplicationService,
  resubmitInstructorApplicationService,
  submitInstructorApplicationService,
} from "@/api/callers/instructor/instructor";
import { useGetMe } from "@/hooks/auth/use-auth-store";
import { getPageState } from "@/lib/instructor-application/get-page-state";
import type { InstructorApplicationPageState } from "@/lib/instructor-application/page-state";
import type {
  ContactInstructorAdminPayload,
  ContactInstructorAdminResponse,
  MyInstructorApplication,
  SubmitInstructorApplicationPayload,
} from "@/types/instructor";

export function useMyInstructorApplication() {
  const { me, mePermissions, isLoading: isAuthLoading } = useGetMe();
  const isLoggedIn = Boolean(me);

  const {
    data: application,
    error,
    isLoading: isApplicationLoading,
    mutate,
  } = useSWR<MyInstructorApplication | null>(
    isLoggedIn ? getMyInstructorApplicationKey() : null,
    getMyInstructorApplicationService,
    { revalidateOnFocus: true, shouldRetryOnError: false },
  );

  const pageState: InstructorApplicationPageState = getPageState({
    isLoggedIn,
    application,
    permissions: mePermissions,
  });

  const submit = async (payload: SubmitInstructorApplicationPayload) => {
    const result = await submitInstructorApplicationService(payload);
    await mutate(result, { revalidate: false });
    return result;
  };

  const resubmit = async (payload: SubmitInstructorApplicationPayload) => {
    const result = await resubmitInstructorApplicationService(payload);
    await mutate(result, { revalidate: false });
    return result;
  };

  const contactAdmin = async (
    payload: ContactInstructorAdminPayload,
  ): Promise<ContactInstructorAdminResponse> => {
    const result = await contactInstructorAdminService(payload);
    await mutate();
    return result;
  };

  return {
    me,
    application,
    pageState,
    permissions: mePermissions,
    isLoading: isAuthLoading || (isLoggedIn && isApplicationLoading),
    error,
    mutate,
    submit,
    resubmit,
    contactAdmin,
  };
}
