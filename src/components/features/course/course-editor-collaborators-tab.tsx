import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TabsContent } from "@/components/ui/tabs";
import type { CourseCollaborator } from "@/types/course";
import type { InstructorRosterMember } from "@/types/instructor";

type CourseCollaboratorsTabProps = {
  canManageCollaborators: boolean;
  collaboratorUserId: string;
  setCollaboratorUserId: (value: string) => void;
  rosterRows: InstructorRosterMember[];
  isSubmittingCollaborator: boolean;
  onAddCollaborator: () => void;
  collaborators: CourseCollaborator[];
  onRemoveCollaborator: (collaborator: CourseCollaborator) => void;
};

export function CourseCollaboratorsTab({
  canManageCollaborators,
  collaboratorUserId,
  setCollaboratorUserId,
  rosterRows,
  isSubmittingCollaborator,
  onAddCollaborator,
  collaborators,
  onRemoveCollaborator,
}: CourseCollaboratorsTabProps) {
  const tCommon = useTranslations("course.common");
  const t = useTranslations("course.editor.collaborators");
  return (
    <TabsContent value="collaborators" className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {canManageCollaborators ? (
            <div className="flex flex-col gap-3 rounded-md border p-3 lg:flex-row lg:items-end">
              <div className="min-w-0 flex-1 space-y-2">
                <Label>{t("addInstructorLabel")}</Label>
                <Select
                  value={collaboratorUserId || "none"}
                  onValueChange={(value) =>
                    setCollaboratorUserId(value === "none" ? "" : value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("selectInstructor")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">
                      {t("selectInstructor")}
                    </SelectItem>
                    {rosterRows.map((row) => (
                      <SelectItem key={row.id} value={String(row.id)}>
                        {row.full_name} ({row.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="button"
                disabled={!collaboratorUserId || isSubmittingCollaborator}
                onClick={onAddCollaborator}
              >
                {isSubmittingCollaborator ? t("adding") : t("addEditor")}
              </Button>
            </div>
          ) : null}

          <div className="space-y-3">
            {collaborators.map((collaborator) => (
              <div
                key={collaborator.user_id}
                className="flex flex-col gap-2 rounded-md border p-3 lg:flex-row lg:items-center lg:justify-between"
              >
                <div className="space-y-1">
                  <div className="font-medium">{collaborator.display_name}</div>
                  <div className="text-sm text-muted-foreground">
                    {collaborator.email}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {tCommon(`collaboratorRole.${collaborator.role}`)}
                  </Badge>
                  {canManageCollaborators && collaborator.role !== "OWNER" ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      onClick={() => onRemoveCollaborator(collaborator)}
                    >
                      {t("remove")}
                    </Button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
}
