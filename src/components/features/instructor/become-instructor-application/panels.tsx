"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { useMyInstructorApplication } from "@/hooks/useMyInstructorApplication";
import { formatUnixDateTime } from "@/lib/utils";
import { Field } from "./sections";

export function RejectionHistoryPanel({
  application,
  locale,
}: {
  application: ReturnType<typeof useMyInstructorApplication>["application"];
  locale: string;
}) {
  const t = useTranslations("instructor.application.history");
  const history = application?.rejection_history ?? [];

  if (!history.length) {
    return (
      <div className="rounded-md border p-8 text-center text-sm text-muted-foreground">
        <p className="text-2xl">📋</p>
        <p className="mt-2 font-medium">{t("emptyTitle")}</p>
        <p className="mt-1">{t("emptyBody")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t("title")}</h2>
        <span className="text-sm text-muted-foreground">
          {t("count", {
            count: String(application?.rejection_count ?? history.length),
          })}
        </span>
      </div>
      <div className="space-y-3">
        {[...history].reverse().map((record, index) => (
          <div
            key={`${record.rejected_at}-${record.reviewer_display_name}`}
            className="rounded-md border p-4"
          >
            <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {t("attempt", { order: String(history.length - index) })}
              </span>
              <span>{formatUnixDateTime(record.rejected_at, locale)}</span>
            </div>
            <p className="text-sm font-medium">
              {record.reviewer_display_name}
            </p>
            <p className="mt-2 whitespace-pre-wrap text-sm">{record.reason}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ContactAdminPanel({
  onSubmit,
}: {
  onSubmit: (subject: string, message: string) => Promise<void>;
}) {
  const t = useTranslations("instructor.application.contact");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  return (
    <div className="rounded-md border p-5">
      <h2 className="mb-4 text-lg font-semibold">{t("title")}</h2>
      <div className="space-y-4">
        <Field label={t("subject")} required>
          <Input
            value={subject}
            maxLength={200}
            onChange={(e) => setSubject(e.target.value)}
          />
        </Field>
        <Field label={t("message")} required>
          <Textarea
            value={message}
            rows={6}
            maxLength={2000}
            onChange={(e) => setMessage(e.target.value)}
          />
        </Field>
        <Button
          type="button"
          disabled={loading}
          onClick={async () => {
            setLoading(true);
            try {
              await onSubmit(subject, message);
              setSubject("");
              setMessage("");
            } finally {
              setLoading(false);
            }
          }}
        >
          {loading ? t("sending") : t("send")}
        </Button>
      </div>
    </div>
  );
}
