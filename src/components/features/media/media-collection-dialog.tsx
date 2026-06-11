"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { deleteMediaFile } from "@/api/callers/media";
import { useMediaFiles } from "@/api/hooks/media/useMediaFiles";
import { MediaTabPanel } from "@/components/features/media/media-tab-panel";
import { MediaUploadDialog } from "@/components/features/media/media-upload-dialog";
import { ConfirmDeleteDialog } from "@/components/shared/confirm-delete-dialog";
import { PermissionGate } from "@/components/shared/permission-gate";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PERMISSIONS } from "@/constants/permissions";
import { useSatisfiesPermissions } from "@/hooks/auth";
import { toastApiError } from "@/lib/utils/api-error";
import {
  getMediaDeleteKey,
  mediaTabToCategory,
  parseMediaSortOption,
  resolveMediaCollectionDefaultTab,
  resolveVisibleMediaTabs,
} from "@/lib/utils/media";
import type { MediaFile, MediaSortOption, MediaTab } from "@/types/media";

export type MediaCollectionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Which tabs to show (subset of image / document / video). Omit = all tabs. */
  visibleTabs?: readonly MediaTab[];
  defaultTab?: MediaTab;
  selectionMode?: "single" | "none";
  selectedFileId?: string;
  onSelect?: (file: MediaFile, type: MediaTab) => void;
};

export function MediaCollectionDialog({
  open,
  onOpenChange,
  visibleTabs: visibleTabsProp,
  defaultTab = "image",
  selectionMode = "none",
  selectedFileId,
  onSelect,
}: MediaCollectionDialogProps) {
  const t = useTranslations("media.collection");
  const tErrors = useTranslations("errors.codes");
  const visibleTabs = useMemo(
    () => resolveVisibleMediaTabs(visibleTabsProp),
    [visibleTabsProp],
  );
  const initialTab = useMemo(
    () => resolveMediaCollectionDefaultTab(defaultTab, visibleTabs),
    [defaultTab, visibleTabs],
  );
  const showTabBar = visibleTabs.length > 1;

  const [activeTab, setActiveTab] = useState<MediaTab>(initialTab);
  const [sortOption, setSortOption] =
    useState<MediaSortOption>("created_at_desc");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<MediaFile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const listActiveTab = visibleTabs.includes(activeTab)
    ? activeTab
    : (visibleTabs[0] ?? "image");

  const listFilters = useMemo(
    () => ({
      page,
      per_page: 20,
      search: search || undefined,
      category: mediaTabToCategory(listActiveTab),
      ...parseMediaSortOption(sortOption),
    }),
    [listActiveTab, page, search, sortOption],
  );

  const { rows, pageInfo, isLoading, mutate } = useMediaFiles(listFilters);
  const canDelete = useSatisfiesPermissions({
    permissions: [PERMISSIONS.MediaFileDelete],
  });

  const handleOpenChange = (next: boolean) => {
    if (next) {
      setActiveTab(resolveMediaCollectionDefaultTab(defaultTab, visibleTabs));
      setSearchInput("");
      setSearch("");
      setPage(1);
    }
    onOpenChange(next);
  };

  const totalPages = pageInfo?.total_pages ?? 1;
  const currentPage = pageInfo?.page ?? page;

  const handleSelect = (file: MediaFile) => {
    onSelect?.(file, listActiveTab);
    handleOpenChange(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteMediaFile(getMediaDeleteKey(deleteTarget));
      toast.success(t("deleteSuccess"));
      setDeleteTarget(null);
      await mutate();
    } catch (error) {
      toastApiError(tErrors, error);
    } finally {
      setIsDeleting(false);
    }
  };

  const applySearch = () => {
    setSearch(searchInput.trim());
    setPage(1);
  };

  const toolbar = (
    <div
      className={
        showTabBar
          ? "flex flex-wrap items-center justify-between gap-2 border-b px-6 py-3"
          : "flex flex-wrap items-center justify-end gap-2 border-b px-6 py-3"
      }
    >
      {showTabBar ? (
        <TabsList>
          {visibleTabs.map((tab) => (
            <TabsTrigger key={tab} value={tab}>
              {t(`tabs.${tab}`)}
            </TabsTrigger>
          ))}
        </TabsList>
      ) : null}
      <div className="flex flex-wrap items-center gap-2">
        <form
          className="flex items-center gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            applySearch();
          }}
        >
          <Input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder={t("searchPlaceholder")}
            className="h-9 w-[220px]"
          />
          <Button type="submit" size="sm" variant="secondary">
            {t("search")}
          </Button>
        </form>
        <Select
          value={sortOption}
          onValueChange={(value) => {
            setSortOption(value as MediaSortOption);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="created_at_desc">{t("sort.newest")}</SelectItem>
            <SelectItem value="filename_asc">{t("sort.nameAsc")}</SelectItem>
          </SelectContent>
        </Select>
        <PermissionGate permissions={[PERMISSIONS.MediaFileCreate]}>
          <Button type="button" size="sm" onClick={() => setUploadOpen(true)}>
            {t(`add.${activeTab}`)}
          </Button>
        </PermissionGate>
      </div>
    </div>
  );

  const tabPanels = visibleTabs.map((tab) => (
    <TabsContent
      key={tab}
      value={tab}
      className="scrollbar-app mt-0 min-h-0 flex-1 overflow-y-auto px-6 py-4"
    >
      <MediaTabPanel
        files={tab === listActiveTab ? rows : []}
        isLoading={tab === listActiveTab && isLoading}
        selectionMode={selectionMode}
        selectedId={selectedFileId}
        onSelect={handleSelect}
        onDelete={(file) => setDeleteTarget(file)}
        canDelete={canDelete}
      />
    </TabsContent>
  ));

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="flex max-h-[90vh] max-w-5xl sm:max-w-3xl flex-col gap-0 overflow-hidden p-0">
          <DialogHeader className="space-y-0 border-b px-6 py-4">
            <DialogTitle>{t("title")}</DialogTitle>
            <DialogDescription className="sr-only">
              {t("description")}
            </DialogDescription>
          </DialogHeader>

          {showTabBar ? (
            <Tabs
              value={activeTab}
              onValueChange={(value) => {
                setActiveTab(value as MediaTab);
                setPage(1);
              }}
              className="flex min-h-0 flex-1 flex-col gap-0"
            >
              {toolbar}
              {tabPanels}
            </Tabs>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col gap-0">
              {toolbar}
              <div className="scrollbar-app min-h-0 flex-1 overflow-y-auto px-6 py-4">
                <MediaTabPanel
                  files={rows}
                  isLoading={isLoading}
                  selectionMode={selectionMode}
                  selectedId={selectedFileId}
                  onSelect={handleSelect}
                  onDelete={(file) => setDeleteTarget(file)}
                  canDelete={canDelete}
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between border-t px-6 py-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              {t("previous")}
            </Button>
            <p className="text-sm text-muted-foreground">
              {t("pageOf", {
                page: String(currentPage),
                totalPages: String(totalPages),
              })}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              {t("next")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <MediaUploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        tab={activeTab}
        onUploaded={async () => {
          await mutate();
        }}
      />

      <ConfirmDeleteDialog
        open={deleteTarget != null}
        onOpenChange={(next) => {
          if (!next) setDeleteTarget(null);
        }}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        title={t("deleteTitle")}
        description={t("deleteDescription", {
          name: deleteTarget?.filename ?? "",
        })}
      />
    </>
  );
}
