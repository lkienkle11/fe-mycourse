"use client";

import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { InstructorProfilePayload } from "@/types/instructor";

export type InstructorProfileViewDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: InstructorProfilePayload | null;
  title?: string;
};

export function InstructorProfileViewDialog({
  open,
  onOpenChange,
  profile,
  title,
}: InstructorProfileViewDialogProps) {
  const t = useTranslations("instructor.profileView");

  if (!profile) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title ?? t("title")}</DialogTitle>
        </DialogHeader>
        <dl className="grid gap-3 text-sm">
          <Field label={t("headline")} value={profile.headline} />
          <Field label={t("bio")} value={profile.bio} />
          <Field
            label={t("yearsOfExperience")}
            value={String(profile.years_of_experience)}
          />
          <Field
            label={t("currentJobTitle")}
            value={profile.current_job_title}
          />
          <Field label={t("currentCompany")} value={profile.current_company} />
          <Field label={t("linkedin")} value={profile.linkedin_url} />
          <Field label={t("github")} value={profile.github_url} />
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
              <dt className="font-medium text-muted-foreground">
                {t("certificates")}
              </dt>
              <dd className="mt-1 space-y-2">
                {profile.certificates.map((cert) => (
                  <div
                    key={`${cert.title}-${cert.issuer}-${cert.issued_year}-${cert.credential_url ?? ""}`}
                    className="rounded-md border p-2"
                  >
                    <p className="font-medium">{cert.title}</p>
                    <p className="text-muted-foreground">
                      {cert.issuer} · {cert.issued_year}
                    </p>
                    {cert.credential_url ? (
                      <p className="truncate text-xs">{cert.credential_url}</p>
                    ) : null}
                  </div>
                ))}
              </dd>
            </div>
          ) : null}
        </dl>
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
