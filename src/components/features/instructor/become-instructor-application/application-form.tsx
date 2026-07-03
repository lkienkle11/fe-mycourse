"use client";

import { Plus, Trash2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { getTaxonomyListKey } from "@/api/callers/taxonomy";
import { SearchableSelect } from "@/components/shared/searchable-select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { YEAR_EXPERIENCE_BUCKETS } from "@/constants/instructor-application";
import { useSearchablePaginatedOptions } from "@/hooks/searchable-select/use-searchable-paginated-options";
import { fetchJobTitleSuggestions } from "@/lib/instructor-application/combobox";
import type { FormState } from "@/lib/instructor-application/form-state";
import {
  INSTRUCTOR_PAGE_STATE,
  type InstructorApplicationPageState,
} from "@/lib/instructor-application/page-state";
import { toastApiError } from "@/lib/utils/api-error";
import type { TaxonomyEntityMap } from "@/types/taxonomy";
import { AsyncComboboxField, CompanyComboboxField } from "./combobox-fields";
import { CollapsibleSection, Field } from "./sections";

export function ApplicationForm({
  form,
  setForm,
  readonly,
  canSubmit,
  onOpenCv,
  onOpenVideo,
  onSubmitClick,
  pageState,
}: {
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  readonly: boolean;
  canSubmit: boolean;
  onOpenCv: () => void;
  onOpenVideo: () => void;
  onSubmitClick: () => void;
  pageState: InstructorApplicationPageState;
}) {
  const t = useTranslations("instructor.application.form");
  const tYears = useTranslations("instructor.application.years");

  return (
    <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
      <section className="rounded-md border p-5">
        <h2 className="mb-4 text-lg font-semibold">{t("section1Title")}</h2>
        <div className="space-y-4">
          <Field label={t("headline")} required>
            <Input
              value={form.headline}
              readOnly={readonly}
              maxLength={100}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, headline: e.target.value }))
              }
            />
          </Field>
          <div className="grid gap-4 md:grid-cols-2">
            <AsyncComboboxField
              label={t("jobTitle")}
              value={form.current_job_title}
              selectedId={form.current_job_title_id}
              readonly={readonly}
              placeholder={t("jobTitlePlaceholder")}
              onSelect={(label, id) =>
                setForm((prev) => ({
                  ...prev,
                  current_job_title: label,
                  current_job_title_id: id,
                }))
              }
              fetchSuggestions={fetchJobTitleSuggestions}
            />
            <CompanyComboboxField
              label={t("company")}
              form={form}
              setForm={setForm}
              readonly={readonly}
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
        <Field label={t("bio")} required>
          <Textarea
            value={form.bio}
            readOnly={readonly}
            rows={6}
            maxLength={2000}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, bio: e.target.value }))
            }
          />
          <p className="mt-1 text-xs text-muted-foreground">
            {form.bio.length} / 2000
          </p>
        </Field>
      </section>

      <section className="rounded-md border p-5">
        <h2 className="mb-4 text-lg font-semibold">{t("section3Title")}</h2>
        <div className="space-y-4">
          <Field label={t("cv")} required>
            <div className="flex items-center gap-3 rounded-md border p-3">
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
            <Field label={t("linkedin")}>
              <Input
                value={form.linkedin_url}
                readOnly={readonly}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, linkedin_url: e.target.value }))
                }
              />
            </Field>
            <Field label={t("github")}>
              <Input
                value={form.github_url}
                readOnly={readonly}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, github_url: e.target.value }))
                }
              />
            </Field>
          </div>
          <Field label={t("portfolio")}>
            <div className="space-y-2">
              {form.portfolio_links.map((link, index) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: portfolio rows have no stable ids
                <div key={`portfolio-${index}`} className="flex gap-2">
                  <Input
                    value={link}
                    readOnly={readonly}
                    placeholder="https://"
                    onChange={(e) =>
                      setForm((prev) => {
                        const next = [...prev.portfolio_links];
                        next[index] = e.target.value;
                        return { ...prev, portfolio_links: next };
                      })
                    }
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

      <CollapsibleSection title={t("section4Title")} optional>
        <CertificateList form={form} setForm={setForm} readonly={readonly} />
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

      <TaxonomySection form={form} setForm={setForm} readonly={readonly} />

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

export function TaxonomySection({
  form,
  setForm,
  readonly,
}: {
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  readonly: boolean;
}) {
  const t = useTranslations("instructor.application.form");
  const tErrors = useTranslations("errors.codes");
  const [topicPick, setTopicPick] = useState("");
  const [skillPick, setSkillPick] = useState("");
  const excludedTopicIds = useMemo(
    () => new Set(form.topic_ids),
    [form.topic_ids],
  );
  const excludedSkillIds = useMemo(
    () => new Set(form.skill_ids),
    [form.skill_ids],
  );

  const topicGetPageKey = useCallback(
    ({
      page,
      per_page,
      search,
    }: {
      page: number;
      per_page: number;
      search?: string;
    }) =>
      getTaxonomyListKey("topics", {
        page,
        per_page,
        search_by: "name",
        search_value: search,
        status: "ACTIVE",
        include_images: false,
      }),
    [],
  );

  const skillGetPageKey = useCallback(
    ({
      page,
      per_page,
      search,
    }: {
      page: number;
      per_page: number;
      search?: string;
    }) =>
      getTaxonomyListKey("skills", {
        page,
        per_page,
        search_by: "name",
        search_value: search,
        status: "ACTIVE",
        include_images: false,
      }),
    [],
  );

  const topicPicker = useSearchablePaginatedOptions({
    value: topicPick,
    onValueChange: setTopicPick,
    enabled: !readonly,
    excludeValues: excludedTopicIds,
    onError: (error) => toastApiError(tErrors, error),
    getPageKey: topicGetPageKey,
    mapToOption: (row: TaxonomyEntityMap["topics"]) => ({
      value: row.id,
      label: row.name,
    }),
  });

  const skillPicker = useSearchablePaginatedOptions({
    value: skillPick,
    onValueChange: setSkillPick,
    enabled: !readonly,
    excludeValues: excludedSkillIds,
    onError: (error) => toastApiError(tErrors, error),
    getPageKey: skillGetPageKey,
    mapToOption: (row: TaxonomyEntityMap["skills"]) => ({
      value: row.id,
      label: row.name,
    }),
  });

  const addTopic = (id: string) => {
    if (!id || form.topic_ids.includes(id)) return;
    if (form.topic_ids.length >= 5) {
      toast.warning(t("topicsMax"));
      return;
    }
    setForm((prev) => ({
      ...prev,
      topic_ids: [...prev.topic_ids, id],
    }));
    setTopicPick("");
    topicPicker.onOptionSelect("");
  };

  const addSkill = (id: string) => {
    if (!id || form.skill_ids.includes(id)) return;
    if (form.skill_ids.length >= 15) {
      toast.warning(t("skillsMax"));
      return;
    }
    setForm((prev) => ({
      ...prev,
      skill_ids: [...prev.skill_ids, id],
    }));
    setSkillPick("");
    skillPicker.onOptionSelect("");
  };

  return (
    <section className="rounded-md border p-5">
      <h2 className="mb-4 text-lg font-semibold">{t("section6Title")}</h2>
      <div className="space-y-6">
        <div>
          <Label>{t("topics")}</Label>
          {!readonly ? (
            <div className="mt-2 max-w-md">
              <SearchableSelect
                value={topicPick}
                onValueChange={(value) => {
                  addTopic(value);
                }}
                options={topicPicker.options}
                open={topicPicker.open}
                onOpenChange={topicPicker.onOpenChange}
                searchInput={topicPicker.searchInput}
                onSearchInputChange={topicPicker.onSearchInputChange}
                isLoading={topicPicker.isLoading}
                isLoadingMore={topicPicker.isLoadingMore}
                hasMore={topicPicker.hasMore}
                onLoadMore={topicPicker.loadMore}
                placeholder={t("pickTopic")}
                searchPlaceholder={t("searchTopic")}
                emptyLabel={t("noResults")}
                loadingLabel={t("loading")}
              />
            </div>
          ) : null}
          <div className="mt-3 flex flex-wrap gap-2">
            {form.topic_ids.map((id) => (
              <Badge key={id} variant="secondary" className="gap-1">
                {topicPicker.options.find((o) => o.value === id)?.label ?? id}
                {!readonly ? (
                  <button
                    type="button"
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        topic_ids: prev.topic_ids.filter((x) => x !== id),
                      }))
                    }
                  >
                    <X className="size-3" />
                  </button>
                ) : null}
              </Badge>
            ))}
          </div>
        </div>
        <div>
          <Label>{t("skills")}</Label>
          {!readonly ? (
            <div className="mt-2 max-w-md">
              <SearchableSelect
                value={skillPick}
                onValueChange={(value) => {
                  addSkill(value);
                }}
                options={skillPicker.options}
                open={skillPicker.open}
                onOpenChange={skillPicker.onOpenChange}
                searchInput={skillPicker.searchInput}
                onSearchInputChange={skillPicker.onSearchInputChange}
                isLoading={skillPicker.isLoading}
                isLoadingMore={skillPicker.isLoadingMore}
                hasMore={skillPicker.hasMore}
                onLoadMore={skillPicker.loadMore}
                placeholder={t("pickSkill")}
                searchPlaceholder={t("searchSkill")}
                emptyLabel={t("noResults")}
                loadingLabel={t("loading")}
              />
            </div>
          ) : null}
          <div className="mt-3 flex flex-wrap gap-2">
            {form.skill_ids.map((id) => (
              <Badge key={id} variant="outline" className="gap-1">
                {skillPicker.options.find((o) => o.value === id)?.label ?? id}
                {!readonly ? (
                  <button
                    type="button"
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        skill_ids: prev.skill_ids.filter((x) => x !== id),
                      }))
                    }
                  >
                    <X className="size-3" />
                  </button>
                ) : null}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function CertificateList({
  form,
  setForm,
  readonly,
}: {
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  readonly: boolean;
}) {
  const t = useTranslations("instructor.application.form");

  return (
    <div className="space-y-4">
      {form.certificates.map((cert, index) => (
        <div
          key={`${cert.title}-${cert.issuer}-${cert.issued_year}-${cert.credential_url ?? ""}`}
          className="rounded-md border p-4"
        >
          {!readonly ? (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="mb-2"
              onClick={() =>
                setForm((prev) => ({
                  ...prev,
                  certificates: prev.certificates.filter((_, i) => i !== index),
                }))
              }
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
              onChange={(e) =>
                setForm((prev) => {
                  const next = [...prev.certificates];
                  next[index] = { ...next[index], title: e.target.value };
                  return { ...prev, certificates: next };
                })
              }
            />
            <Input
              placeholder={t("certIssuer")}
              value={cert.issuer}
              readOnly={readonly}
              onChange={(e) =>
                setForm((prev) => {
                  const next = [...prev.certificates];
                  next[index] = { ...next[index], issuer: e.target.value };
                  return { ...prev, certificates: next };
                })
              }
            />
            <Input
              type="number"
              placeholder={t("certYear")}
              value={cert.issued_year || ""}
              readOnly={readonly}
              onChange={(e) =>
                setForm((prev) => {
                  const next = [...prev.certificates];
                  next[index] = {
                    ...next[index],
                    issued_year: Number(e.target.value) || 0,
                  };
                  return { ...prev, certificates: next };
                })
              }
            />
          </div>
          <Input
            className="mt-3"
            placeholder={t("certUrl")}
            value={cert.credential_url ?? ""}
            readOnly={readonly}
            onChange={(e) =>
              setForm((prev) => {
                const next = [...prev.certificates];
                next[index] = {
                  ...next[index],
                  credential_url: e.target.value,
                };
                return { ...prev, certificates: next };
              })
            }
          />
        </div>
      ))}
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
                },
              ],
            }))
          }
        >
          <Plus className="mr-1 size-4" />
          {t("addCert")}
        </Button>
      ) : null}
    </div>
  );
}
