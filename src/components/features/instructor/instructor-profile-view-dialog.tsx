"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { PreviewPdf } from "@/components/shared/preview-pdf";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { INSTRUCTOR_PROFILE_DIALOG_MAX_WIDTH_CLASS } from "@/constants/instructor-admin";
import { YEAR_EXPERIENCE_BUCKETS } from "@/constants/instructor-application";
import { resolveInstructorDisplayName } from "@/lib/instructor-application/helpers";
import type { YearsExperienceLabelKey } from "@/lib/instructor-application/page-state";
import { cn, formatUnixDateTime, pickCharacter } from "@/lib/utils";
import type {
  InstructorApplication,
  InstructorApplicationProfile,
  InstructorProfilePayload,
  InstructorRejectionRecord,
  InstructorTaxonomyChip,
  YearsExperienceCode,
} from "@/types/instructor";
import { InstructorCertificateCarousel } from "./instructor-certificate-carousel";

export type InstructorProfileViewDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile:
    | InstructorApplicationProfile
    | InstructorProfilePayload
    | null
    | undefined;
  fullName?: string;
  avatarUrl?: string;
  title?: string;
  application?: InstructorApplication | null;
  topics?: InstructorTaxonomyChip[];
  skills?: InstructorTaxonomyChip[];
  rejectionHistory?: InstructorRejectionRecord[];
  maxWidthClassName?: string;
  isLoading?: boolean;
};

function yearsLabel(code: string | number | undefined): string {
  if (code == null || code === "") return "";
  const bucket = YEAR_EXPERIENCE_BUCKETS.find(
    (item) => item.code === (String(code) as YearsExperienceCode),
  );
  return bucket?.labelKey ?? String(code);
}

export function InstructorProfileViewDialog({
  open,
  onOpenChange,
  profile,
  fullName = "",
  avatarUrl = "",
  title,
  application,
  topics = application?.topics,
  skills = application?.skills,
  rejectionHistory = application?.rejection_history,
  maxWidthClassName = INSTRUCTOR_PROFILE_DIALOG_MAX_WIDTH_CLASS,
  isLoading = false,
}: InstructorProfileViewDialogProps) {
  const t = useTranslations("instructor.profileView");
  const tc = useTranslations("instructor.common");
  const tYears = useTranslations("instructor.application.years");
  const locale = useLocale();
  const applicantName =
    fullName.trim() || resolveInstructorDisplayName(application ?? null);
  const { label, color, backgroundColor } = pickCharacter(
    applicantName || "User",
  );

  if (!profile && !isLoading) return null;

  const companyProfile = (profile ?? {}) as InstructorApplicationProfile;
  const cvUrl = companyProfile.cv_file?.url;
  const videoName =
    companyProfile.intro_video_file?.filename ||
    companyProfile.intro_video_file_id;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn("max-h-[85vh] overflow-y-auto", maxWidthClassName)}
      >
        <DialogHeader>
          <DialogTitle>{title ?? t("title")}</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">{tc("loading")}</p>
        ) : profile ? (
          <>
            {applicantName ? (
              <div className="mb-1 flex items-center gap-3 rounded-md border p-3">
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt={`${applicantName} avatar`}
                    width={40}
                    height={40}
                    className="size-10 rounded-full object-cover"
                  />
                ) : (
                  <div
                    className="flex size-10 items-center justify-center rounded-full"
                    style={{ backgroundColor }}
                  >
                    <span
                      style={{ color }}
                      className="text-sm font-semibold leading-none"
                    >
                      {label}
                    </span>
                  </div>
                )}
                <div>
                  <p className="text-xs text-muted-foreground">
                    {t("userName")}
                  </p>
                  <p className="font-medium">{applicantName}</p>
                </div>
              </div>
            ) : null}
            <dl className="grid gap-3 text-sm">
              <Field label={t("bio")} value={profile.bio} />
              {cvUrl ? (
                <div>
                  <dt className="mb-2 font-medium text-muted-foreground">
                    {t("cv")}
                  </dt>
                  <dd>
                    <PreviewPdf
                      url={cvUrl}
                      title={companyProfile.cv_file?.filename ?? t("cv")}
                    />
                  </dd>
                </div>
              ) : null}
              <Field
                label={t("yearsOfExperience")}
                value={(() => {
                  const key = yearsLabel(profile.years_of_experience);
                  if (YEAR_EXPERIENCE_BUCKETS.some((b) => b.labelKey === key)) {
                    return tYears(key as YearsExperienceLabelKey);
                  }
                  return key;
                })()}
              />
              <Field
                label={t("currentJobTitle")}
                value={profile.current_job_title}
              />
              <Field
                label={t("currentCompany")}
                value={profile.current_company}
              />
              {companyProfile.current_company_domain ? (
                <Field
                  label={t("companyDomain")}
                  value={companyProfile.current_company_domain}
                />
              ) : null}
              {companyProfile.current_company_description ? (
                <Field
                  label={t("companyDescription")}
                  value={companyProfile.current_company_description}
                />
              ) : null}
              {companyProfile.current_company_location ? (
                <Field
                  label={t("companyLocation")}
                  value={companyProfile.current_company_location}
                />
              ) : null}
              <Field label={t("linkedin")} value={profile.linkedin_url ?? ""} />
              <Field label={t("github")} value={profile.github_url ?? ""} />
              {topics?.length ? (
                <div>
                  <dt className="font-medium text-muted-foreground">
                    {t("topics")}
                  </dt>
                  <dd className="mt-1 flex flex-wrap gap-2">
                    {topics.map((chip) => (
                      <Badge key={chip.id} variant="secondary">
                        {chip.name}
                      </Badge>
                    ))}
                  </dd>
                </div>
              ) : null}
              {skills?.length ? (
                <div>
                  <dt className="font-medium text-muted-foreground">
                    {t("skills")}
                  </dt>
                  <dd className="mt-1 flex flex-wrap gap-2">
                    {skills.map((chip) => (
                      <Badge key={chip.id} variant="outline">
                        {chip.name}
                      </Badge>
                    ))}
                  </dd>
                </div>
              ) : null}
              {profile.portfolio_links?.length ? (
                <div>
                  <dt className="font-medium text-muted-foreground">
                    {t("portfolioLinks")}
                  </dt>
                  <dd className="mt-1 list-inside list-disc">
                    {profile.portfolio_links.map((link) => (
                      <li key={link}>{link}</li>
                    ))}
                  </dd>
                </div>
              ) : null}
              {profile.certificates?.length ? (
                <div>
                  <dt className="mb-2 font-medium text-muted-foreground">
                    {t("certificates")}
                  </dt>
                  <dd>
                    <InstructorCertificateCarousel
                      certificates={profile.certificates}
                    />
                  </dd>
                </div>
              ) : null}
              {videoName ? (
                <Field label={t("introVideo")} value={videoName} />
              ) : null}
              {rejectionHistory?.length ? (
                <div>
                  <dt className="font-medium text-muted-foreground">
                    {t("rejectionHistory")}
                  </dt>
                  <dd className="mt-2 space-y-2">
                    {[...rejectionHistory].reverse().map((record) => (
                      <div
                        key={`${record.rejected_at}-${record.reviewer_display_name}-${record.reason}`}
                        className="rounded-md border p-3"
                      >
                        <div className="mb-1 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                          <span>{record.reviewer_display_name}</span>
                          <span>
                            {formatUnixDateTime(record.rejected_at, locale)}
                          </span>
                        </div>
                        <p className="whitespace-pre-wrap text-sm">
                          {record.reason}
                        </p>
                      </div>
                    ))}
                  </dd>
                </div>
              ) : null}
            </dl>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div>
      <dt className="font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 whitespace-pre-wrap">{value}</dd>
    </div>
  );
}
