"use client";

import { useLocale, useTranslations } from "next-intl";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  addInstructorExpertiseSkillService,
  addInstructorExpertiseTopicService,
  deleteInstructorExpertiseSkillService,
  deleteInstructorExpertiseTopicService,
  getInstructorRosterListKey,
} from "@/api/callers/instructor";
import { getTaxonomyListKey } from "@/api/callers/taxonomy";
import {
  useInstructorExpertiseSkills,
  useInstructorExpertiseTopics,
} from "@/api/hooks/instructor";
import { ConfirmDeleteDialog } from "@/components/shared/confirm-delete-dialog";
import { PermissionGate } from "@/components/shared/permission-gate";
import { RequiredLabel } from "@/components/shared/required-label";
import { SearchableSelect } from "@/components/shared/searchable-select";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PERMISSIONS } from "@/constants/permissions";
import { useSearchablePaginatedOptions } from "@/hooks/searchable-select/use-searchable-paginated-options";
import { toastApiError } from "@/lib/utils/api-error";
import { toastValidationError } from "@/lib/utils/validation-message";
import {
  instructorExpertiseSkillSchema,
  instructorExpertiseTopicSchema,
} from "@/schema/instructor";
import type { InstructorRosterMember } from "@/types/instructor";
import type { TaxonomyEntityMap } from "@/types/taxonomy";

export function InstructorExpertisePage() {
  const t = useTranslations("instructor.expertise");
  const tc = useTranslations("instructor.common");
  const tErrors = useTranslations("errors.codes");
  const tValidation = useTranslations("instructor.validation");
  const locale = useLocale();
  const [instructorId, setInstructorId] = useState<string | null>(null);
  const [topicToAdd, setTopicToAdd] = useState<string>("");
  const [skillToAdd, setSkillToAdd] = useState<string>("");
  const [deleteTopicId, setDeleteTopicId] = useState<string | null>(null);
  const [deleteSkillId, setDeleteSkillId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handlePickerError = useCallback(
    (error: unknown) => {
      toastApiError(tErrors, error);
    },
    [tErrors],
  );

  const { rows: topics, mutate: mutateTopics } = useInstructorExpertiseTopics(
    instructorId,
    locale,
  );
  const { rows: skills, mutate: mutateSkills } = useInstructorExpertiseSkills(
    instructorId,
    locale,
  );

  const instructorGetPageKey = useCallback(
    ({
      page,
      per_page,
      search,
    }: {
      page: number;
      per_page: number;
      search?: string;
    }) => getInstructorRosterListKey({ page, per_page, search }),
    [],
  );

  const mapInstructorOption = useCallback(
    (member: InstructorRosterMember) => ({
      value: String(member.id),
      label: `${member.full_name} (${member.email})`,
    }),
    [],
  );

  const instructorPicker = useSearchablePaginatedOptions({
    value: instructorId ?? "",
    onValueChange: (nextValue) => {
      setInstructorId(nextValue || null);
      setTopicToAdd("");
      setSkillToAdd("");
    },
    onError: handlePickerError,
    getPageKey: instructorGetPageKey,
    mapToOption: mapInstructorOption,
  });

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
        status: "ACTIVE",
        include_images: false,
        locale,
        ...(search ? { search_by: "name" as const, search_value: search } : {}),
      }),
    [locale],
  );

  const mapTopicOption = useCallback(
    (topic: TaxonomyEntityMap["topics"]) => ({
      value: String(topic.id),
      label: topic.name,
    }),
    [],
  );

  const assignedTopicIds = useMemo(
    () => new Set(topics.map((row) => row.topic_id)),
    [topics],
  );

  const topicPicker = useSearchablePaginatedOptions({
    value: topicToAdd,
    onValueChange: setTopicToAdd,
    enabled: instructorId != null,
    onError: handlePickerError,
    getPageKey: topicGetPageKey,
    mapToOption: mapTopicOption,
    excludeValues: assignedTopicIds,
  });

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
        status: "ACTIVE",
        include_images: false,
        locale,
        ...(search ? { search_by: "name" as const, search_value: search } : {}),
      }),
    [locale],
  );

  const mapSkillOption = useCallback(
    (skill: TaxonomyEntityMap["skills"]) => ({
      value: String(skill.id),
      label: skill.name,
    }),
    [],
  );

  const assignedSkillIds = useMemo(
    () => new Set(skills.map((row) => row.skill_id)),
    [skills],
  );

  const skillPicker = useSearchablePaginatedOptions({
    value: skillToAdd,
    onValueChange: setSkillToAdd,
    enabled: instructorId != null,
    onError: handlePickerError,
    getPageKey: skillGetPageKey,
    mapToOption: mapSkillOption,
    excludeValues: assignedSkillIds,
  });

  const resolveTopicName = (topicId: string, joinedName?: string) =>
    joinedName?.trim() || t("unknownName", { id: topicId });
  const resolveSkillName = (skillId: string, joinedName?: string) =>
    joinedName?.trim() || t("unknownName", { id: skillId });

  const addTopic = async () => {
    if (!instructorId) return;
    const parsed = instructorExpertiseTopicSchema.safeParse({
      topic_id: topicToAdd,
    });
    if (!parsed.success) {
      toastValidationError(tValidation, parsed.error.issues, "topicId");
      return;
    }
    try {
      await addInstructorExpertiseTopicService(instructorId, {
        topic_id: parsed.data.topic_id,
      });
      toast.success(t("addTopicSuccess"));
      topicPicker.onOptionSelect("");
      await mutateTopics();
    } catch (error) {
      toastApiError(tErrors, error);
    }
  };

  const addSkill = async () => {
    if (!instructorId) return;
    const parsed = instructorExpertiseSkillSchema.safeParse({
      skill_id: skillToAdd,
    });
    if (!parsed.success) {
      toastValidationError(tValidation, parsed.error.issues, "skillId");
      return;
    }
    try {
      await addInstructorExpertiseSkillService(instructorId, {
        skill_id: parsed.data.skill_id,
      });
      toast.success(t("addSkillSuccess"));
      skillPicker.onOptionSelect("");
      await mutateSkills();
    } catch (error) {
      toastApiError(tErrors, error);
    }
  };

  const confirmDelete = async () => {
    if (!instructorId) return;
    setIsDeleting(true);
    try {
      if (deleteTopicId != null) {
        await deleteInstructorExpertiseTopicService(
          instructorId,
          deleteTopicId,
        );
        await mutateTopics();
      }
      if (deleteSkillId != null) {
        await deleteInstructorExpertiseSkillService(
          instructorId,
          deleteSkillId,
        );
        await mutateSkills();
      }
      toast.success(tc("deleteSuccess"));
      setDeleteTopicId(null);
      setDeleteSkillId(null);
    } catch (error) {
      toastApiError(tErrors, error);
    } finally {
      setIsDeleting(false);
    }
  };

  const pickerLabels = {
    searchPlaceholder: tc("search"),
    emptyLabel: tc("empty"),
    loadingLabel: tc("loading"),
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex max-w-md flex-col gap-2">
        <span className="text-sm font-medium">{t("selectInstructor")}</span>
        <SearchableSelect
          value={instructorId ?? ""}
          onValueChange={instructorPicker.onOptionSelect}
          selectedLabel={instructorPicker.selectedLabel}
          options={instructorPicker.options}
          open={instructorPicker.open}
          onOpenChange={instructorPicker.onOpenChange}
          searchInput={instructorPicker.searchInput}
          onSearchInputChange={instructorPicker.onSearchInputChange}
          isLoading={instructorPicker.isLoading}
          isLoadingMore={instructorPicker.isLoadingMore}
          hasMore={instructorPicker.hasMore}
          onLoadMore={instructorPicker.loadMore}
          placeholder={t("selectInstructorPlaceholder")}
          {...pickerLabels}
        />
      </div>

      {!instructorId ? (
        <p className="text-sm text-muted-foreground">{t("selectFirst")}</p>
      ) : (
        <Tabs defaultValue="topics">
          <TabsList>
            <TabsTrigger value="topics">{t("tabs.topics")}</TabsTrigger>
            <TabsTrigger value="skills">{t("tabs.skills")}</TabsTrigger>
          </TabsList>
          <TabsContent value="topics" className="space-y-4">
            <PermissionGate
              permissions={[PERMISSIONS.InstructorExpertiseCreate]}
            >
              <div className="flex flex-wrap items-end gap-2">
                <div className="space-y-2">
                  <RequiredLabel>{t("pickTopic")}</RequiredLabel>
                  <SearchableSelect
                    value={topicToAdd}
                    onValueChange={topicPicker.onOptionSelect}
                    selectedLabel={topicPicker.selectedLabel}
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
                    triggerClassName="w-[280px]"
                    {...pickerLabels}
                  />
                </div>
                <Button type="button" onClick={() => void addTopic()}>
                  {t("addTopic")}
                </Button>
              </div>
            </PermissionGate>
            <ul className="divide-y rounded-md border">
              {topics.length === 0 ? (
                <li className="p-3 text-sm text-muted-foreground">
                  {tc("empty")}
                </li>
              ) : (
                topics.map((row) => (
                  <li
                    key={row.id}
                    className="flex items-center justify-between p-3 text-sm"
                  >
                    <span className="font-medium">
                      {resolveTopicName(row.topic_id, row.name)}
                    </span>
                    <PermissionGate
                      permissions={[PERMISSIONS.InstructorExpertiseDelete]}
                    >
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => setDeleteTopicId(row.id)}
                      >
                        {tc("delete")}
                      </Button>
                    </PermissionGate>
                  </li>
                ))
              )}
            </ul>
          </TabsContent>
          <TabsContent value="skills" className="space-y-4">
            <PermissionGate
              permissions={[PERMISSIONS.InstructorExpertiseCreate]}
            >
              <div className="flex flex-wrap items-end gap-2">
                <div className="space-y-2">
                  <RequiredLabel>{t("pickSkill")}</RequiredLabel>
                  <SearchableSelect
                    value={skillToAdd}
                    onValueChange={skillPicker.onOptionSelect}
                    selectedLabel={skillPicker.selectedLabel}
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
                    triggerClassName="w-[280px]"
                    {...pickerLabels}
                  />
                </div>
                <Button type="button" onClick={() => void addSkill()}>
                  {t("addSkill")}
                </Button>
              </div>
            </PermissionGate>
            <ul className="divide-y rounded-md border">
              {skills.length === 0 ? (
                <li className="p-3 text-sm text-muted-foreground">
                  {tc("empty")}
                </li>
              ) : (
                skills.map((row) => (
                  <li
                    key={row.id}
                    className="flex items-center justify-between p-3 text-sm"
                  >
                    <span className="font-medium">
                      {resolveSkillName(row.skill_id, row.name)}
                    </span>
                    <PermissionGate
                      permissions={[PERMISSIONS.InstructorExpertiseDelete]}
                    >
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => setDeleteSkillId(row.id)}
                      >
                        {tc("delete")}
                      </Button>
                    </PermissionGate>
                  </li>
                ))
              )}
            </ul>
          </TabsContent>
        </Tabs>
      )}

      <ConfirmDeleteDialog
        open={deleteTopicId != null || deleteSkillId != null}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTopicId(null);
            setDeleteSkillId(null);
          }
        }}
        onConfirm={confirmDelete}
        isLoading={isDeleting}
        title={t("deleteTitle")}
        description={t("deleteDescription")}
      />
    </div>
  );
}
