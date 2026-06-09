"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  addInstructorExpertiseSkillService,
  addInstructorExpertiseTopicService,
  deleteInstructorExpertiseSkillService,
  deleteInstructorExpertiseTopicService,
} from "@/api/callers/instructor";
import {
  useInstructorExpertiseSkills,
  useInstructorExpertiseTopics,
  useInstructorRosterList,
} from "@/api/hooks/instructor";
import { useTaxonomyList } from "@/api/hooks/taxonomy/useTaxonomy";
import { ConfirmDeleteDialog } from "@/components/shared/confirm-delete-dialog";
import { PermissionGate } from "@/components/shared/permission-gate";
import { RequiredLabel } from "@/components/shared/required-label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PERMISSIONS } from "@/constants/permissions";
import { toastApiError } from "@/lib/utils/api-error";
import { toastValidationError } from "@/lib/utils/validation-message";
import {
  instructorExpertiseSkillSchema,
  instructorExpertiseTopicSchema,
} from "@/schema/instructor";

export function InstructorExpertisePage() {
  const t = useTranslations("instructor.expertise");
  const tc = useTranslations("instructor.common");
  const tErrors = useTranslations("errors.codes");
  const tValidation = useTranslations("instructor.validation");
  const [instructorId, setInstructorId] = useState<string | null>(null);
  const [topicToAdd, setTopicToAdd] = useState<string>("");
  const [skillToAdd, setSkillToAdd] = useState<string>("");
  const [deleteTopicId, setDeleteTopicId] = useState<string | null>(null);
  const [deleteSkillId, setDeleteSkillId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { rows: roster } = useInstructorRosterList({ page: 1, per_page: 100 });
  const { rows: topics, mutate: mutateTopics } =
    useInstructorExpertiseTopics(instructorId);
  const { rows: skills, mutate: mutateSkills } =
    useInstructorExpertiseSkills(instructorId);
  const { rows: taxonomyTopics } = useTaxonomyList("topics", {
    page: 1,
    per_page: 100,
    status: "ACTIVE",
  });
  const { rows: taxonomySkills } = useTaxonomyList("skills", {
    page: 1,
    per_page: 100,
    status: "ACTIVE",
  });

  const instructorOptions = useMemo(
    () =>
      roster.map((member) => ({
        value: String(member.id),
        label: `${member.full_name} (${member.email})`,
      })),
    [roster],
  );

  const topicNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const topic of taxonomyTopics) {
      map.set(topic.id, topic.name);
    }
    return map;
  }, [taxonomyTopics]);

  const skillNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const skill of taxonomySkills) {
      map.set(skill.id, skill.name);
    }
    return map;
  }, [taxonomySkills]);

  const assignedTopicIds = useMemo(
    () => new Set(topics.map((row) => row.topic_id)),
    [topics],
  );
  const assignedSkillIds = useMemo(
    () => new Set(skills.map((row) => row.skill_id)),
    [skills],
  );

  const availableTopics = useMemo(
    () => taxonomyTopics.filter((topic) => !assignedTopicIds.has(topic.id)),
    [taxonomyTopics, assignedTopicIds],
  );
  const availableSkills = useMemo(
    () => taxonomySkills.filter((skill) => !assignedSkillIds.has(skill.id)),
    [taxonomySkills, assignedSkillIds],
  );

  const resolveTopicName = (topicId: string) =>
    topicNameById.get(topicId) ?? t("unknownName", { id: topicId });
  const resolveSkillName = (skillId: string) =>
    skillNameById.get(skillId) ?? t("unknownName", { id: skillId });

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
      setTopicToAdd("");
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
      setSkillToAdd("");
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

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">{t("title")}</h1>
      <p className="text-sm text-muted-foreground">{t("description")}</p>

      <div className="flex max-w-md flex-col gap-2">
        <span className="text-sm font-medium">{t("selectInstructor")}</span>
        <Select
          value={instructorId ?? ""}
          onValueChange={(value) => setInstructorId(value || null)}
        >
          <SelectTrigger>
            <SelectValue placeholder={t("selectInstructorPlaceholder")} />
          </SelectTrigger>
          <SelectContent>
            {instructorOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
                  <Select value={topicToAdd} onValueChange={setTopicToAdd}>
                    <SelectTrigger className="w-[280px]">
                      <SelectValue placeholder={t("pickTopic")} />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTopics.map((topic) => (
                        <SelectItem key={topic.id} value={String(topic.id)}>
                          {topic.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                      {resolveTopicName(row.topic_id)}
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
                  <Select value={skillToAdd} onValueChange={setSkillToAdd}>
                    <SelectTrigger className="w-[280px]">
                      <SelectValue placeholder={t("pickSkill")} />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSkills.map((skill) => (
                        <SelectItem key={skill.id} value={String(skill.id)}>
                          {skill.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                      {resolveSkillName(row.skill_id)}
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
