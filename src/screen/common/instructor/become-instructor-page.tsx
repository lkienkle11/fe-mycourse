"use client";

import { Loader2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ApplicationForm } from "@/components/features/instructor/become-instructor-application/application-form";
import {
  ContactAdminPanel,
  RejectionHistoryPanel,
} from "@/components/features/instructor/become-instructor-application/panels";
import {
  BecomeInstructorHero,
  BecomeInstructorSidebar,
  StateCard,
  StatusBanner,
  TabButton,
} from "@/components/features/instructor/become-instructor-application/sections";
import { MediaCollectionDialog } from "@/components/features/media";
import { ConfirmActionDialog } from "@/components/shared/confirm-action-dialog";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { PRIVATE_ROUTES, PUBLIC_ROUTES } from "@/constants/route";
import { useMyInstructorApplication } from "@/hooks/instructor/use-my-instructor-application";
import { Link } from "@/i18n/navigation";
import {
  type FormState,
  resolveInitialForm,
  toSubmitPayload,
} from "@/lib/instructor-application/form-state";
import {
  INSTRUCTOR_PAGE_STATE,
  type InstructorApplicationActiveTab,
} from "@/lib/instructor-application/page-state";
import { preloadRemoteDatasets } from "@/lib/instructor-application/remote-data";
import { cn } from "@/lib/utils";
import { toastApiError } from "@/lib/utils/api-error";
import { toastValidationError } from "@/lib/utils/validation-message";
import {
  instructorApplicationSubmitSchema,
  instructorContactAdminSchema,
} from "@/schema/instructor";
import { useAuthStore } from "@/store/auth";
import type { MediaFile } from "@/types/media";

export function BecomeInstructorPage() {
  const t = useTranslations("instructor.application");
  const tValidation = useTranslations("instructor.validation");
  const tErrors = useTranslations("errors.codes");
  const locale = useLocale();
  const { openLoginModal } = useAuthStore();
  const {
    application,
    pageState,
    isLoading,
    submit,
    resubmit,
    contactAdmin,
    mutate,
  } = useMyInstructorApplication();

  const [activeTab, setActiveTab] =
    useState<InstructorApplicationActiveTab>("info");
  const formSyncToken = `${pageState}-${application?.id ?? "none"}`;
  const baseForm = useMemo(
    () => resolveInitialForm(application, pageState),
    [application, pageState],
  );
  const [editingForm, setEditingForm] = useState<{
    token: string;
    form: FormState;
  } | null>(null);
  const form =
    editingForm?.token === formSyncToken ? editingForm.form : baseForm;
  const setForm: React.Dispatch<React.SetStateAction<FormState>> = (action) => {
    setEditingForm((prev) => {
      const current = prev?.token === formSyncToken ? prev.form : baseForm;
      const next = typeof action === "function" ? action(current) : action;
      return { token: formSyncToken, form: next };
    });
  };
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cvDialogOpen, setCvDialogOpen] = useState(false);
  const [videoDialogOpen, setVideoDialogOpen] = useState(false);
  const [mobileGuideOpen, setMobileGuideOpen] = useState(false);

  const readonly = pageState === INSTRUCTOR_PAGE_STATE.pending_review;
  const canSubmit =
    pageState === INSTRUCTOR_PAGE_STATE.ready_to_apply ||
    pageState === INSTRUCTOR_PAGE_STATE.returned_for_revision ||
    pageState === INSTRUCTOR_PAGE_STATE.rejected_can_resubmit;
  const showFormLayout =
    pageState === INSTRUCTOR_PAGE_STATE.ready_to_apply ||
    pageState === INSTRUCTOR_PAGE_STATE.pending_review ||
    pageState === INSTRUCTOR_PAGE_STATE.returned_for_revision ||
    pageState === INSTRUCTOR_PAGE_STATE.rejected_can_resubmit;
  const showTabs =
    showFormLayout ||
    pageState === INSTRUCTOR_PAGE_STATE.rejected_contact_admin;

  useEffect(() => {
    preloadRemoteDatasets();
  }, []);

  const handleSubmit = async () => {
    const payload = toSubmitPayload(form);
    const parsed = instructorApplicationSubmitSchema.safeParse(payload);
    if (!parsed.success) {
      toastValidationError(tValidation, parsed.error.issues, "headline");
      return;
    }
    setIsSubmitting(true);
    try {
      if (pageState === INSTRUCTOR_PAGE_STATE.ready_to_apply) {
        await submit(parsed.data);
      } else {
        await resubmit(parsed.data);
      }
      toast.success(t("toast.submitSuccess"));
      setConfirmOpen(false);
      await mutate();
    } catch (error) {
      toastApiError(tErrors, error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContactAdmin = async (subject: string, message: string) => {
    const parsed = instructorContactAdminSchema.safeParse({ subject, message });
    if (!parsed.success) {
      toastValidationError(tValidation, parsed.error.issues, "headline");
      return;
    }
    try {
      await contactAdmin(parsed.data);
      toast.success(t("toast.contactSuccess"));
    } catch (error) {
      toastApiError(tErrors, error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-[#3dcbb1]" />
      </div>
    );
  }

  return (
    <div className="bg-background">
      <BecomeInstructorHero />
      {pageState === INSTRUCTOR_PAGE_STATE.unauthenticated ? (
        <StateCard
          icon="🔒"
          title={t("stateA.title")}
          description={t("stateA.description")}
          action={
            <Button
              className="bg-[#3dcbb1] hover:bg-[#35b39c]"
              onClick={() => openLoginModal(PUBLIC_ROUTES.becomeInstructor)}
            >
              {t("stateA.login")}
            </Button>
          }
        />
      ) : null}
      {pageState === INSTRUCTOR_PAGE_STATE.submit_blocked ? (
        <StateCard
          icon="🚫"
          title={t("stateB.title")}
          description={t("stateB.description")}
          action={
            <Button asChild className="bg-[#3dcbb1] hover:bg-[#35b39c]">
              <Link href={PRIVATE_ROUTES.instructor.root}>
                {t("stateB.cta")}
              </Link>
            </Button>
          }
        />
      ) : null}
      {pageState === INSTRUCTOR_PAGE_STATE.approved ? (
        <StateCard
          icon="✅"
          title={t("stateG.title")}
          description={t("stateG.description")}
          action={
            <Button asChild className="bg-[#3dcbb1] hover:bg-[#35b39c]">
              <Link href={PRIVATE_ROUTES.instructor.root}>
                {t("stateG.cta")}
              </Link>
            </Button>
          }
        />
      ) : null}

      {showTabs ? (
        <>
          <div className="border-b bg-background">
            <div className="mx-auto flex h-12 max-w-[1200px] gap-6 px-4">
              <TabButton
                active={activeTab === "info"}
                onClick={() => setActiveTab("info")}
                label={
                  pageState === INSTRUCTOR_PAGE_STATE.rejected_contact_admin
                    ? t("tabs.contactAdmin")
                    : t("tabs.info")
                }
              />
              <TabButton
                active={activeTab === "history"}
                onClick={() => setActiveTab("history")}
                label={t("tabs.history")}
              />
            </div>
          </div>
          <div className="mx-auto max-w-[1200px] px-4 py-8">
            <div
              className={cn(
                "grid gap-8",
                showFormLayout && activeTab === "info"
                  ? "lg:grid-cols-[1fr_20rem]"
                  : "grid-cols-1",
              )}
            >
              <div>
                {activeTab === "info" &&
                pageState === INSTRUCTOR_PAGE_STATE.rejected_contact_admin ? (
                  <>
                    <StatusBanner
                      pageState={pageState}
                      application={application}
                      locale={locale}
                    />
                    <ContactAdminPanel onSubmit={handleContactAdmin} />
                  </>
                ) : null}
                {activeTab === "info" && showFormLayout ? (
                  <>
                    <StatusBanner
                      pageState={pageState}
                      application={application}
                      locale={locale}
                    />
                    <Collapsible
                      open={mobileGuideOpen}
                      onOpenChange={setMobileGuideOpen}
                      className="mb-6 rounded-md border lg:hidden"
                    >
                      <CollapsibleTrigger className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium">
                        {t("sidebar.guideTitle")}
                        <span>{mobileGuideOpen ? "▴" : "▾"}</span>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="px-4 pb-4">
                        <BecomeInstructorSidebar compact />
                      </CollapsibleContent>
                    </Collapsible>
                    <ApplicationForm
                      form={form}
                      setForm={setForm}
                      readonly={readonly}
                      canSubmit={canSubmit}
                      onOpenCv={() => setCvDialogOpen(true)}
                      onOpenVideo={() => setVideoDialogOpen(true)}
                      onSubmitClick={() => setConfirmOpen(true)}
                      pageState={pageState}
                    />
                  </>
                ) : null}
                {activeTab === "history" ? (
                  <RejectionHistoryPanel
                    application={application}
                    locale={locale}
                  />
                ) : null}
              </div>
              {showFormLayout && activeTab === "info" ? (
                <aside className="hidden lg:block">
                  <div className="sticky top-24 space-y-4 rounded-md border p-4">
                    <BecomeInstructorSidebar />
                  </div>
                </aside>
              ) : null}
            </div>
          </div>
        </>
      ) : null}

      <ConfirmActionDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        onConfirm={handleSubmit}
        title={t("confirm.title")}
        description={t("confirm.description")}
        confirmLabel={
          pageState === INSTRUCTOR_PAGE_STATE.returned_for_revision ||
          pageState === INSTRUCTOR_PAGE_STATE.rejected_can_resubmit
            ? t("confirm.resubmit")
            : t("confirm.submit")
        }
        cancelLabel={t("confirm.cancel")}
        isLoading={isSubmitting}
        loadingLabel={t("confirm.loading")}
      />

      <MediaCollectionDialog
        open={cvDialogOpen}
        onOpenChange={setCvDialogOpen}
        visibleTabs={["document"]}
        defaultTab="document"
        selectionMode="single"
        selectedFileId={form.cv_file_id}
        onSelect={(file: MediaFile) => {
          setForm((prev) => ({
            ...prev,
            cv_file_id: file.id ?? "",
            cv_file_name: file.filename ?? "",
          }));
          setCvDialogOpen(false);
        }}
      />
      <MediaCollectionDialog
        open={videoDialogOpen}
        onOpenChange={setVideoDialogOpen}
        visibleTabs={["video"]}
        defaultTab="video"
        selectionMode="single"
        selectedFileId={form.intro_video_file_id}
        onSelect={(file: MediaFile) => {
          setForm((prev) => ({
            ...prev,
            intro_video_file_id: file.id ?? "",
            intro_video_name: file.filename ?? "",
          }));
          setVideoDialogOpen(false);
        }}
      />
    </div>
  );
}
