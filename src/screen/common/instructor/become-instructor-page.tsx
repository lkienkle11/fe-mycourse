"use client";

import { Loader2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";
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
import { MEDIA_PDF_EXTENSIONS } from "@/constants/media/file-rules";
import { PRIVATE_ROUTES, PUBLIC_ROUTES } from "@/constants/route";
import { useMyInstructorApplication } from "@/hooks/instructor/use-my-instructor-application";
import { Link } from "@/i18n/navigation";
import {
  type FormState,
  resolveInitialForm,
} from "@/lib/instructor-application/form-state";
import { resolveApplicationTaxonomyLabels } from "@/lib/instructor-application/helpers";
import {
  INSTRUCTOR_PAGE_STATE,
  type InstructorApplicationActiveTab,
} from "@/lib/instructor-application/page-state";
import { preloadRemoteDatasets } from "@/lib/instructor-application/remote-data";
import {
  type ApplicationFormErrors,
  firstApplicationFormErrorKey,
  refreshCertificateFieldErrors,
  validateApplicationForm,
} from "@/lib/instructor-application/validate-application-form";
import { cn } from "@/lib/utils";
import { toastApiError } from "@/lib/utils/api-error";
import { isPdfMedia } from "@/lib/utils/media";
import { toastValidationError } from "@/lib/utils/validation-message";
import { instructorContactAdminSchema } from "@/schema/instructor";
import { useAuthStore } from "@/store/auth";
import type { MediaFile } from "@/types/media";

export function BecomeInstructorPage() {
  const t = useTranslations("instructor.application");
  const tForm = useTranslations("instructor.application.form");
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
  const [fieldErrors, setFieldErrors] = useState<ApplicationFormErrors>({});
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

  const taxonomyLabels = useMemo(
    () => resolveApplicationTaxonomyLabels(application),
    [application],
  );

  useEffect(() => {
    preloadRemoteDatasets();
  }, []);

  const clearFieldError = useCallback((key: string) => {
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const refreshCertificateErrors = useCallback((nextForm: FormState) => {
    setFieldErrors((prev) => refreshCertificateFieldErrors(prev, nextForm));
  }, []);

  const scrollToFirstFieldError = useCallback(
    (errors: ApplicationFormErrors) => {
      const key = firstApplicationFormErrorKey(errors);
      if (!key) return;
      const el = document.querySelector(`[data-form-field="${key}"]`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    },
    [],
  );

  const handlePrepareSubmit = () => {
    const result = validateApplicationForm(form);
    if (!result.ok) {
      setFieldErrors(result.errors);
      scrollToFirstFieldError(result.errors);
      return;
    }
    setFieldErrors({});
    setConfirmOpen(true);
  };

  const handleSubmit = async () => {
    const result = validateApplicationForm(form);
    if (!result.ok) {
      setConfirmOpen(false);
      setFieldErrors(result.errors);
      scrollToFirstFieldError(result.errors);
      return;
    }
    setIsSubmitting(true);
    try {
      if (pageState === INSTRUCTOR_PAGE_STATE.ready_to_apply) {
        await submit(result.data);
      } else {
        await resubmit(result.data);
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
      toastValidationError(tValidation, parsed.error.issues, "subject");
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
    <div className="flex min-h-[calc(100svh-4rem)] flex-col bg-background">
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
        <div className="flex flex-1 flex-col">
          <div className="shrink-0 border-b bg-background">
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
          <div className="mx-auto flex w-full max-w-[1200px] flex-1 flex-col px-4 py-8">
            <div
              className={cn(
                "grid flex-1 gap-8",
                showFormLayout && activeTab === "info"
                  ? "lg:grid-cols-[1fr_20rem]"
                  : "grid-cols-1",
              )}
            >
              <div
                className={cn(
                  activeTab === "history" && "flex min-h-0 flex-1 flex-col",
                )}
              >
                {activeTab === "info" &&
                pageState === INSTRUCTOR_PAGE_STATE.rejected_contact_admin ? (
                  <>
                    <StatusBanner
                      pageState={pageState}
                      application={application}
                    />
                    <ContactAdminPanel onSubmit={handleContactAdmin} />
                  </>
                ) : null}
                {activeTab === "info" && showFormLayout ? (
                  <>
                    <StatusBanner
                      pageState={pageState}
                      application={application}
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
                      onSubmitClick={handlePrepareSubmit}
                      pageState={pageState}
                      fieldErrors={fieldErrors}
                      onClearFieldError={clearFieldError}
                      onRefreshCertificateFieldErrors={refreshCertificateErrors}
                      initialTopicLabels={taxonomyLabels.topics}
                      initialSkillLabels={taxonomyLabels.skills}
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
        </div>
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
        uploadAllowedExtensions={MEDIA_PDF_EXTENSIONS}
        selectedFileId={form.cv_file_id}
        onSelect={(file: MediaFile) => {
          if (!isPdfMedia(file)) {
            toast.error(tForm("cvPdfOnly"));
            return;
          }
          setForm((prev) => ({
            ...prev,
            cv_file_id: file.id ?? "",
            cv_file_name: file.filename ?? "",
          }));
          clearFieldError("cv_file_id");
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
