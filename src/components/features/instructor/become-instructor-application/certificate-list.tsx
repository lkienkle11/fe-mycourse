"use client";

import { Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { MediaCollectionDialog } from "@/components/features/media";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MEDIA_PDF_EXTENSIONS } from "@/constants/media/file-rules";
import type { FormState } from "@/lib/instructor-application/form-state";
import { cn } from "@/lib/utils";
import { isPdfMedia } from "@/lib/utils/media";
import type { MediaFile } from "@/types/media";

export function CertificateList({
  form,
  setForm,
  readonly,
  onClearFieldError,
  onRefreshCertificateFieldErrors,
  fieldMessage,
}: {
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  readonly: boolean;
  onClearFieldError?: (key: string) => void;
  onRefreshCertificateFieldErrors?: (nextForm: FormState) => void;
  fieldMessage: (key: string, fallback: string) => string | undefined;
}) {
  const t = useTranslations("instructor.application.form");
  const [pdfDialogIndex, setPdfDialogIndex] = useState<number | null>(null);

  return (
    <div className="space-y-4">
      {form.certificates.map((cert, index) => {
        const certFieldKey = `certificates.${index}`;
        const certError = fieldMessage(certFieldKey, "certProof");
        // Any edit to a certificate row can resolve OR create a duplicate
        // collision on a sibling row, so revalidate the whole certificate
        // section instead of only clearing this row's error. Falls back to
        // clearing just this row when the section revalidator is not wired.
        const notifyCertChange = (nextForm: FormState) => {
          if (onRefreshCertificateFieldErrors) {
            onRefreshCertificateFieldErrors(nextForm);
          } else {
            onClearFieldError?.(certFieldKey);
          }
        };
        return (
          <div
            key={
              cert._local_id ??
              `${cert.title}-${cert.issuer}-${cert.issued_year}`
            }
            data-form-field={certFieldKey}
            className={cn(
              "rounded-md border p-4",
              certError && "border-destructive ring-3 ring-destructive/20",
            )}
          >
            {!readonly ? (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="mb-2"
                onClick={() => {
                  setForm((prev) => {
                    const nextForm = {
                      ...prev,
                      certificates: prev.certificates.filter(
                        (_, i) => i !== index,
                      ),
                    };
                    onRefreshCertificateFieldErrors?.(nextForm);
                    return nextForm;
                  });
                }}
              >
                <Trash2 className="mr-1 size-4" />
                {t("removeCert")}
              </Button>
            ) : null}
            <div className="grid gap-3 md:grid-cols-3">
              <Input
                placeholder={t("certTitle")}
                value={cert.title}
                readOnly={readonly}
                onChange={(e) => {
                  setForm((prev) => {
                    const next = [...prev.certificates];
                    next[index] = { ...next[index], title: e.target.value };
                    const nextForm = { ...prev, certificates: next };
                    notifyCertChange(nextForm);
                    return nextForm;
                  });
                }}
              />
              <Input
                placeholder={t("certIssuer")}
                value={cert.issuer}
                readOnly={readonly}
                onChange={(e) => {
                  setForm((prev) => {
                    const next = [...prev.certificates];
                    next[index] = { ...next[index], issuer: e.target.value };
                    const nextForm = { ...prev, certificates: next };
                    notifyCertChange(nextForm);
                    return nextForm;
                  });
                }}
              />
              <Input
                type="number"
                placeholder={t("certYear")}
                value={cert.issued_year || ""}
                readOnly={readonly}
                onChange={(e) => {
                  setForm((prev) => {
                    const next = [...prev.certificates];
                    next[index] = {
                      ...next[index],
                      issued_year: Number(e.target.value) || 0,
                    };
                    const nextForm = { ...prev, certificates: next };
                    notifyCertChange(nextForm);
                    return nextForm;
                  });
                }}
              />
            </div>
            <Input
              className="mt-3"
              placeholder={t("certUrl")}
              value={cert.credential_url ?? ""}
              readOnly={readonly}
              onChange={(e) => {
                setForm((prev) => {
                  const next = [...prev.certificates];
                  next[index] = {
                    ...next[index],
                    credential_url: e.target.value,
                  };
                  const nextForm = { ...prev, certificates: next };
                  notifyCertChange(nextForm);
                  return nextForm;
                });
              }}
            />
            <p className="mt-3 text-sm text-muted-foreground">{t("certOr")}</p>
            <div className="mt-2">
              <Label className="mb-2 block text-sm font-medium">
                {t("certPdfLabel")}
              </Label>
              <div className="flex flex-wrap items-center gap-3 rounded-md border p-3">
                <span className="text-sm">
                  {cert.certificate_file?.filename ??
                    (cert.certificate_file_id
                      ? cert.certificate_file_id
                      : t("certPdfEmpty"))}
                </span>
                {!readonly ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setPdfDialogIndex(index)}
                  >
                    {t("chooseCertPdf")}
                  </Button>
                ) : null}
              </div>
            </div>
            {certError ? (
              <p className="mt-2 text-xs text-destructive" role="alert">
                {certError}
              </p>
            ) : null}
          </div>
        );
      })}
      {!readonly && form.certificates.length < 10 ? (
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() =>
            setForm((prev) => ({
              ...prev,
              certificates: [
                ...prev.certificates,
                {
                  title: "",
                  issuer: "",
                  issued_year: new Date().getFullYear(),
                  credential_url: "",
                  certificate_file_id: "",
                  _local_id: crypto.randomUUID(),
                },
              ],
            }))
          }
        >
          <Plus className="mr-1 size-4" />
          {t("addCert")}
        </Button>
      ) : null}

      <MediaCollectionDialog
        open={pdfDialogIndex !== null}
        onOpenChange={(open) => {
          if (!open) setPdfDialogIndex(null);
        }}
        visibleTabs={["document"]}
        defaultTab="document"
        selectionMode="single"
        uploadAllowedExtensions={MEDIA_PDF_EXTENSIONS}
        selectedFileId={
          pdfDialogIndex === null
            ? undefined
            : (form.certificates[pdfDialogIndex]?.certificate_file_id ?? "")
        }
        onSelect={(file: MediaFile) => {
          if (pdfDialogIndex === null) return;
          if (!isPdfMedia(file)) {
            toast.error(t("certPdfOnly"));
            return;
          }
          setForm((prev) => {
            const next = [...prev.certificates];
            const row = next[pdfDialogIndex];
            if (!row) return prev;
            next[pdfDialogIndex] = {
              ...row,
              certificate_file_id: file.id ?? "",
              certificate_file: {
                id: file.id ?? "",
                url: file.url ?? "",
                filename: file.filename,
                mime_type: file.mime_type,
              },
            };
            const nextForm = { ...prev, certificates: next };
            if (onRefreshCertificateFieldErrors) {
              onRefreshCertificateFieldErrors(nextForm);
            } else {
              onClearFieldError?.(`certificates.${pdfDialogIndex}`);
            }
            return nextForm;
          });
          setPdfDialogIndex(null);
        }}
      />
    </div>
  );
}
