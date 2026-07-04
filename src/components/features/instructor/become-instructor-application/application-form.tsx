"use client";

import { Plus, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { YEAR_EXPERIENCE_BUCKETS } from "@/constants/instructor-application";
import { fetchJobTitleSuggestions } from "@/lib/instructor-application/combobox";
import type { FormState } from "@/lib/instructor-application/form-state";
import {
  INSTRUCTOR_PAGE_STATE,
  type InstructorApplicationPageState,
} from "@/lib/instructor-application/page-state";
import type { ApplicationFormErrors } from "@/lib/instructor-application/validate-application-form";
import { cn } from "@/lib/utils";
import { translateValidationIssueMessage } from "@/lib/utils/validation-message";
import { CertificateList } from "./certificate-list";
import { AsyncComboboxField, CompanyComboboxField } from "./combobox-fields";
import { CollapsibleSection, Field } from "./sections";
import { TaxonomySection } from "./taxonomy-section";

export function ApplicationForm({
  form,
  setForm,
  readonly,
  canSubmit,
  onOpenCv,
  onOpenVideo,
  onSubmitClick,
  pageState,
  fieldErrors = {},
  onClearFieldError,
  initialTopicLabels = {},
  initialSkillLabels = {},
}: {
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  readonly: boolean;
  canSubmit: boolean;
  onOpenCv: () => void;
  onOpenVideo: () => void;
  onSubmitClick: () => void;
  pageState: InstructorApplicationPageState;
  fieldErrors?: ApplicationFormErrors;
  onClearFieldError?: (key: string) => void;
  initialTopicLabels?: Record<string, string>;
  initialSkillLabels?: Record<string, string>;
}) {
  const t = useTranslations("instructor.application.form");
  const tYears = useTranslations("instructor.application.years");
  const tValidation = useTranslations("instructor.validation");

  const fieldMessage = (key: string, fallback: string) =>
    fieldErrors[key]
      ? translateValidationIssueMessage(tValidation, fieldErrors[key], fallback)
      : undefined;

  const hasCertificateErrors = Object.keys(fieldErrors).some((key) =>
    key.startsWith("certificates."),
  );

  const clearError = (key: string) => onClearFieldError?.(key);

  return (
    <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
      <section className="rounded-md border p-5">
        <h2 className="mb-4 text-lg font-semibold">{t("section1Title")}</h2>
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <AsyncComboboxField
              label={t("jobTitle")}
              value={form.current_job_title}
              readonly={readonly}
              placeholder={t("jobTitlePlaceholder")}
              fieldKey="current_job_title"
              errorMessage={fieldMessage(
                "current_job_title",
                "currentJobTitle",
              )}
              onSelect={(label, id) => {
                clearError("current_job_title");
                setForm((prev) => ({
                  ...prev,
                  current_job_title: label,
                  current_job_title_id: id,
                }));
              }}
              fetchSuggestions={fetchJobTitleSuggestions}
            />
            <CompanyComboboxField
              label={t("company")}
              form={form}
              setForm={setForm}
              readonly={readonly}
              fieldKey="current_company"
              errorMessage={fieldMessage("current_company", "currentCompany")}
              onClearFieldError={clearError}
            />
          </div>
          <Field label={t("years")} required>
            <div className="flex flex-wrap gap-2">
              {YEAR_EXPERIENCE_BUCKETS.map((bucket) => (
                <Button
                  key={bucket.code}
                  type="button"
                  size="sm"
                  variant={
                    form.years_of_experience === bucket.code
                      ? "default"
                      : "outline"
                  }
                  disabled={readonly}
                  className={
                    form.years_of_experience === bucket.code
                      ? "bg-[#3dcbb1] hover:bg-[#35b39c]"
                      : undefined
                  }
                  onClick={() =>
                    setForm((prev) => ({
                      ...prev,
                      years_of_experience: bucket.code,
                    }))
                  }
                >
                  {tYears(bucket.labelKey)}
                </Button>
              ))}
            </div>
          </Field>
        </div>
      </section>

      <section className="rounded-md border p-5">
        <h2 className="mb-4 text-lg font-semibold">{t("section2Title")}</h2>
        <Field
          label={t("bio")}
          required
          fieldKey="bio"
          errorMessage={fieldMessage("bio", "bio")}
        >
          <Textarea
            value={form.bio}
            readOnly={readonly}
            rows={6}
            maxLength={2000}
            aria-invalid={Boolean(fieldErrors.bio) || undefined}
            onChange={(e) => {
              clearError("bio");
              setForm((prev) => ({ ...prev, bio: e.target.value }));
            }}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            {form.bio.length} / 2000
          </p>
        </Field>
      </section>

      <section className="rounded-md border p-5">
        <h2 className="mb-4 text-lg font-semibold">{t("section3Title")}</h2>
        <div className="space-y-4">
          <Field
            label={t("cv")}
            required
            fieldKey="cv_file_id"
            errorMessage={fieldMessage("cv_file_id", "cvFile")}
          >
            <div
              className={cn(
                "flex items-center gap-3 rounded-md border p-3",
                fieldErrors.cv_file_id &&
                  "border-destructive ring-3 ring-destructive/20",
              )}
            >
              <span className="text-sm">
                {form.cv_file_name || t("cvEmpty")}
              </span>
              {!readonly ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={onOpenCv}
                >
                  {t("chooseCv")}
                </Button>
              ) : null}
            </div>
          </Field>
          <div className="grid gap-4 md:grid-cols-2">
            <Field
              label={t("linkedin")}
              fieldKey="linkedin_url"
              errorMessage={fieldMessage("linkedin_url", "linkedinUrl")}
            >
              <Input
                value={form.linkedin_url}
                readOnly={readonly}
                aria-invalid={Boolean(fieldErrors.linkedin_url) || undefined}
                onChange={(e) => {
                  clearError("linkedin_url");
                  setForm((prev) => ({
                    ...prev,
                    linkedin_url: e.target.value,
                  }));
                }}
              />
            </Field>
            <Field
              label={t("github")}
              fieldKey="github_url"
              errorMessage={fieldMessage("github_url", "githubUrl")}
            >
              <Input
                value={form.github_url}
                readOnly={readonly}
                aria-invalid={Boolean(fieldErrors.github_url) || undefined}
                onChange={(e) => {
                  clearError("github_url");
                  setForm((prev) => ({ ...prev, github_url: e.target.value }));
                }}
              />
            </Field>
          </div>
          <Field
            label={t("portfolio")}
            fieldKey="portfolio_links"
            errorMessage={fieldMessage("portfolio_links", "url")}
          >
            <div className="space-y-2">
              {form.portfolio_links.map((link, index) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: portfolio rows have no stable ids
                <div key={`portfolio-${index}`} className="flex gap-2">
                  <Input
                    value={link}
                    readOnly={readonly}
                    placeholder="https://"
                    onChange={(e) => {
                      clearError("portfolio_links");
                      setForm((prev) => {
                        const next = [...prev.portfolio_links];
                        next[index] = e.target.value;
                        return { ...prev, portfolio_links: next };
                      });
                    }}
                  />
                  {!readonly && form.portfolio_links.length > 1 ? (
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          portfolio_links: prev.portfolio_links.filter(
                            (_, i) => i !== index,
                          ),
                        }))
                      }
                    >
                      <X className="size-4" />
                    </Button>
                  ) : null}
                </div>
              ))}
              {!readonly && form.portfolio_links.length < 5 ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setForm((prev) => ({
                      ...prev,
                      portfolio_links: [...prev.portfolio_links, ""],
                    }))
                  }
                >
                  <Plus className="mr-1 size-4" />
                  {t("addPortfolio")}
                </Button>
              ) : null}
            </div>
          </Field>
        </div>
      </section>

      <CollapsibleSection
        key={hasCertificateErrors ? "certs-open" : "certs"}
        title={t("section4Title")}
        optional
        defaultOpen={hasCertificateErrors}
      >
        <CertificateList
          form={form}
          setForm={setForm}
          readonly={readonly}
          onClearFieldError={onClearFieldError}
          fieldMessage={fieldMessage}
        />
      </CollapsibleSection>

      <CollapsibleSection title={t("section5Title")} optional>
        <div className="flex items-center gap-3 rounded-md border p-4">
          <span className="text-sm">
            {form.intro_video_name || t("videoEmpty")}
          </span>
          {!readonly ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={onOpenVideo}
            >
              {t("chooseVideo")}
            </Button>
          ) : null}
        </div>
      </CollapsibleSection>

      <TaxonomySection
        form={form}
        setForm={setForm}
        readonly={readonly}
        fieldErrors={fieldErrors}
        onClearFieldError={onClearFieldError}
        fieldMessage={fieldMessage}
        initialTopicLabels={initialTopicLabels}
        initialSkillLabels={initialSkillLabels}
      />

      {canSubmit ? (
        <div className="rounded-md border p-5">
          <p className="mb-4 text-sm text-muted-foreground">
            {t("submitNote")}
          </p>
          <Button
            type="button"
            className="w-full bg-[#3dcbb1] hover:bg-[#35b39c] md:w-auto"
            onClick={onSubmitClick}
          >
            {pageState === INSTRUCTOR_PAGE_STATE.returned_for_revision ||
            pageState === INSTRUCTOR_PAGE_STATE.rejected_can_resubmit
              ? t("resubmit")
              : t("submit")}
          </Button>
        </div>
      ) : null}
    </form>
  );
}
