"use client";

import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { getTaxonomyListKey } from "@/api/callers/taxonomy";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { useSearchablePaginatedOptions } from "@/hooks/searchable-select/use-searchable-paginated-options";
import type { FormState } from "@/lib/instructor-application/form-state";
import type { ApplicationFormErrors } from "@/lib/instructor-application/validate-application-form";
import { cn } from "@/lib/utils";
import { toastApiError } from "@/lib/utils/api-error";
import type { TaxonomyEntityMap } from "@/types/taxonomy";
import { TaxonomySelect } from "./taxonomy-select";

export function TaxonomySection({
  form,
  setForm,
  readonly,
  fieldErrors = {},
  onClearFieldError,
  fieldMessage,
  initialTopicLabels = {},
  initialSkillLabels = {},
}: {
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  readonly: boolean;
  fieldErrors?: ApplicationFormErrors;
  onClearFieldError?: (key: string) => void;
  fieldMessage: (key: string, fallback: string) => string | undefined;
  initialTopicLabels?: Record<string, string>;
  initialSkillLabels?: Record<string, string>;
}) {
  const t = useTranslations("instructor.application.form");
  const tErrors = useTranslations("errors.codes");
  const [topicPick, setTopicPick] = useState("");
  const [skillPick, setSkillPick] = useState("");
  const [topicLabels, setTopicLabels] = useState<Record<string, string>>({});
  const [skillLabels, setSkillLabels] = useState<Record<string, string>>({});

  const mergedTopicLabels = useMemo(
    () => ({ ...initialTopicLabels, ...topicLabels }),
    [initialTopicLabels, topicLabels],
  );

  const mergedSkillLabels = useMemo(
    () => ({ ...initialSkillLabels, ...skillLabels }),
    [initialSkillLabels, skillLabels],
  );
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

  const resolveTopicLabel = useCallback(
    (id: string) => mergedTopicLabels[id] ?? "",
    [mergedTopicLabels],
  );

  const resolveSkillLabel = useCallback(
    (id: string) => mergedSkillLabels[id] ?? "",
    [mergedSkillLabels],
  );

  const addTopic = (id: string) => {
    if (!id || form.topic_ids.includes(id)) return;
    if (form.topic_ids.length >= 5) {
      toast.warning(t("topicsMax"));
      return;
    }
    const label = topicPicker.options.find(
      (option) => option.value === id,
    )?.label;
    if (label) {
      setTopicLabels((prev) => ({ ...prev, [id]: label }));
    }
    setForm((prev) => ({
      ...prev,
      topic_ids: [...prev.topic_ids, id],
    }));
    onClearFieldError?.("topic_ids");
    setTopicPick("");
    topicPicker.onOptionSelect("");
  };

  const addSkill = (id: string) => {
    if (!id || form.skill_ids.includes(id)) return;
    if (form.skill_ids.length >= 15) {
      toast.warning(t("skillsMax"));
      return;
    }
    const label = skillPicker.options.find(
      (option) => option.value === id,
    )?.label;
    if (label) {
      setSkillLabels((prev) => ({ ...prev, [id]: label }));
    }
    setForm((prev) => ({
      ...prev,
      skill_ids: [...prev.skill_ids, id],
    }));
    onClearFieldError?.("skill_ids");
    setSkillPick("");
    skillPicker.onOptionSelect("");
  };

  return (
    <section className="rounded-md border p-5">
      <h2 className="mb-4 text-lg font-semibold">{t("section5Title")}</h2>
      <div className="space-y-6">
        <div data-form-field="topic_ids">
          <Label className={cn(fieldErrors.topic_ids && "text-destructive")}>
            {t("topics")}
          </Label>
          {!readonly ? (
            <div
              className={cn(
                "mt-2",
                fieldErrors.topic_ids &&
                  "rounded-lg ring-3 ring-destructive/20 [&_button]:border-destructive",
              )}
            >
              <TaxonomySelect
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
                {resolveTopicLabel(id) || t("loading")}
                {!readonly ? (
                  <button
                    type="button"
                    onClick={() => {
                      setTopicLabels((prev) => {
                        const next = { ...prev };
                        delete next[id];
                        return next;
                      });
                      setForm((prev) => ({
                        ...prev,
                        topic_ids: prev.topic_ids.filter((x) => x !== id),
                      }));
                    }}
                  >
                    <X className="size-3" />
                  </button>
                ) : null}
              </Badge>
            ))}
          </div>
          {fieldMessage("topic_ids", "topicIdsMin") ? (
            <p className="mt-1 text-xs text-destructive" role="alert">
              {fieldMessage("topic_ids", "topicIdsMin")}
            </p>
          ) : null}
        </div>
        <div data-form-field="skill_ids">
          <Label className={cn(fieldErrors.skill_ids && "text-destructive")}>
            {t("skills")}
          </Label>
          {!readonly ? (
            <div
              className={cn(
                "mt-2",
                fieldErrors.skill_ids &&
                  "rounded-lg ring-3 ring-destructive/20 [&_button]:border-destructive",
              )}
            >
              <TaxonomySelect
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
                {resolveSkillLabel(id) || t("loading")}
                {!readonly ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSkillLabels((prev) => {
                        const next = { ...prev };
                        delete next[id];
                        return next;
                      });
                      setForm((prev) => ({
                        ...prev,
                        skill_ids: prev.skill_ids.filter((x) => x !== id),
                      }));
                    }}
                  >
                    <X className="size-3" />
                  </button>
                ) : null}
              </Badge>
            ))}
          </div>
          {fieldMessage("skill_ids", "skillIdsMin") ? (
            <p className="mt-1 text-xs text-destructive" role="alert">
              {fieldMessage("skill_ids", "skillIdsMin")}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
