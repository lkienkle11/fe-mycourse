"use client";

import { useLocale, useTranslations } from "next-intl";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  deleteTaxonomyService,
  getTaxonomyDetailService,
} from "@/api/callers/taxonomy";
import { useTaxonomyList } from "@/api/hooks/taxonomy/useTaxonomy";
import { TaxonomyFormDialog } from "@/components/features/taxonomy";
import { buildTaxonomyTableColumns } from "@/components/features/taxonomy/taxonomy-table-columns";
import { ConfirmDeleteDialog } from "@/components/shared/confirm-delete-dialog";
import type { DataTableFilterByOption } from "@/components/shared/data-table";
import { DataTable } from "@/components/shared/data-table";
import { PermissionGate } from "@/components/shared/permission-gate";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRegisterDashboardPageHeader } from "@/hooks/dashboard";
import { toastApiError } from "@/lib/utils/api-error";
import {
  getTaxonomyResourceConfig,
  getTaxonomySearchableColumns,
} from "@/lib/utils/taxonomy";
import type { PermissionName } from "@/types/permissions";
import type {
  TaxonomyEntity,
  TaxonomyListFilters,
  TaxonomyResourceKey,
  TaxonomySearchBy,
  TaxonomyStatus,
} from "@/types/taxonomy";

export type TaxonomyListPageProps = {
  resourceKey: TaxonomyResourceKey;
};

export function TaxonomyListPage({ resourceKey }: TaxonomyListPageProps) {
  const t = useTranslations("taxonomy");
  const tErrors = useTranslations("errors.codes");
  const locale = useLocale();
  const config = getTaxonomyResourceConfig(resourceKey);
  const searchableColumns = getTaxonomySearchableColumns(resourceKey);
  const [filters, setFilters] = useState<TaxonomyListFilters>({
    page: 1,
    per_page: 20,
    sort_by: config.listColumns.find((col) => col.sortKey)?.sortKey,
    sort_desc: false,
  });
  const [searchInput, setSearchInput] = useState("");
  const defaultFilterBy = searchableColumns[0] ?? "status";
  const [selectedFilterBy, setSelectedFilterBy] =
    useState<string>(defaultFilterBy);
  const resolvedFilterBy = searchableColumns.includes(
    selectedFilterBy as TaxonomySearchBy,
  )
    ? selectedFilterBy
    : defaultFilterBy;
  const [formOpen, setFormOpen] = useState(false);
  const [formDialogKey, setFormDialogKey] = useState(0);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [selectedRow, setSelectedRow] = useState<TaxonomyEntity | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<TaxonomyEntity | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditLoading, setIsEditLoading] = useState(false);

  const listFilters = useMemo(
    () => ({ ...filters, locale }),
    [filters, locale],
  );

  const { rows, pageInfo, isLoading, mutate } = useTaxonomyList(
    resourceKey,
    listFilters,
  );

  const page = pageInfo?.page ?? filters.page ?? 1;
  const totalPages = pageInfo?.total_pages ?? 1;

  const createPermission = config.permissions.create as PermissionName;
  const updatePermission = config.permissions.update as PermissionName;
  const deletePermission = config.permissions.delete as PermissionName;
  const permissions = {
    create: [createPermission],
    update: [updatePermission],
    delete: [deletePermission],
  };

  const tableColumns = buildTaxonomyTableColumns(
    resourceKey,
    config.listColumns,
    t,
  );
  const statusFilterInput = (
    <Select
      value={filters.status ?? "ALL"}
      onValueChange={(value) => {
        setFilters((prev) => ({
          ...prev,
          page: 1,
          status: value === "ALL" ? undefined : (value as TaxonomyStatus),
        }));
      }}
    >
      <SelectTrigger className="w-[180px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="ALL">{t("common.statusAll")}</SelectItem>
        <SelectItem value="ACTIVE">{t("common.statusActive")}</SelectItem>
        <SelectItem value="INACTIVE">{t("common.statusInactive")}</SelectItem>
      </SelectContent>
    </Select>
  );

  const searchableSet = new Set<string>(searchableColumns);
  const filterByOptions: DataTableFilterByOption[] = tableColumns
    .filter((column) => column.id === "status" || searchableSet.has(column.id))
    .map((column) => ({
      value: column.id,
      label: column.header,
      customInputComponent:
        column.id === "status" ? statusFilterInput : undefined,
    }));

  const applySearch = () => {
    const isStatusFilter = resolvedFilterBy === "status";
    const value = searchInput.trim();
    setFilters((prev) => ({
      ...prev,
      page: 1,
      search_by: isStatusFilter
        ? undefined
        : (resolvedFilterBy as TaxonomySearchBy),
      search_value: isStatusFilter ? undefined : value || undefined,
    }));
  };

  const handleSortChange = (sortBy: string) => {
    setFilters((prev) => {
      const sameColumn = prev.sort_by === sortBy;
      return {
        ...prev,
        page: 1,
        sort_by: sortBy,
        sort_desc: sameColumn ? !prev.sort_desc : false,
      };
    });
  };
  const handleFilterByChange = (value: string) => {
    setSelectedFilterBy(value);
    const nextOption = filterByOptions.find((option) => option.value === value);
    const isCustomInputOption = Boolean(nextOption?.customInputComponent);
    setFilters((prev) => ({
      ...prev,
      page: 1,
      search_by: isCustomInputOption ? undefined : (value as TaxonomySearchBy),
      search_value: undefined,
      status: isCustomInputOption ? prev.status : undefined,
    }));
    setSearchInput("");
  };

  const openEdit = async (row: TaxonomyEntity) => {
    setIsEditLoading(true);
    try {
      const detail = await getTaxonomyDetailService(resourceKey, row.id, {
        view: "edit",
      });
      setFormMode("edit");
      setSelectedRow(detail);
      setFormDialogKey((key) => key + 1);
      setFormOpen(true);
    } catch (error) {
      toastApiError(tErrors, error);
    } finally {
      setIsEditLoading(false);
    }
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: React state setters are stable.
  const openCreate = useCallback(() => {
    setFormMode("create");
    setSelectedRow(null);
    setFormDialogKey((key) => key + 1);
    setFormOpen(true);
  }, [setFormDialogKey, setFormMode, setFormOpen, setSelectedRow]);

  const openDelete = (row: TaxonomyEntity) => {
    setDeleteTarget(row);
    setDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteTaxonomyService(resourceKey, deleteTarget.id);
      toast.success(t("common.deleteSuccess"));
      setDeleteOpen(false);
      setDeleteTarget(null);
      await mutate();
    } catch (error) {
      toastApiError(tErrors, error);
    } finally {
      setIsDeleting(false);
    }
  };
  const headerActions = useMemo(
    () => (
      <PermissionGate permissions={[createPermission]}>
        <Button type="button" onClick={openCreate}>
          {t("common.add")}
        </Button>
      </PermissionGate>
    ),
    [createPermission, openCreate, t],
  );
  const headerOverride = useMemo(
    () => ({
      actions: headerActions,
    }),
    [headerActions],
  );

  useRegisterDashboardPageHeader(headerOverride);

  return (
    <div className="flex flex-col gap-4">
      {isLoading ? (
        <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
      ) : (
        <DataTable
          columns={tableColumns}
          rows={rows}
          sort={filters}
          onSortChange={handleSortChange}
          actionsHeader={t("common.actions")}
          emptyMessage={t("common.empty")}
          filterByOptions={filterByOptions}
          selectedFilterBy={resolvedFilterBy}
          onFilterByChange={handleFilterByChange}
          filterByLabel={t("common.filterBy")}
          searchValue={searchInput}
          searchPlaceholder={t("common.searchPlaceholder")}
          searchButtonLabel={t("common.search")}
          onSearchValueChange={setSearchInput}
          onSearchSubmit={applySearch}
          renderActions={(row) => (
            <div className="flex gap-2">
              <PermissionGate permissions={permissions.update}>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isEditLoading}
                  onClick={() => void openEdit(row)}
                >
                  {t("common.edit")}
                </Button>
              </PermissionGate>
              <PermissionGate permissions={permissions.delete}>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => openDelete(row)}
                >
                  {t("common.delete")}
                </Button>
              </PermissionGate>
            </div>
          )}
        />
      )}

      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="outline"
          disabled={page <= 1}
          onClick={() =>
            setFilters((prev) => ({ ...prev, page: Math.max(1, page - 1) }))
          }
        >
          {t("common.previous")}
        </Button>
        <p className="text-sm text-muted-foreground">
          {t("common.pageOf", {
            page: String(page),
            totalPages: String(totalPages),
          })}
        </p>
        <Button
          type="button"
          variant="outline"
          disabled={page >= totalPages}
          onClick={() =>
            setFilters((prev) => ({
              ...prev,
              page: Math.min(totalPages, page + 1),
            }))
          }
        >
          {t("common.next")}
        </Button>
      </div>

      <TaxonomyFormDialog
        key={formDialogKey}
        resourceKey={resourceKey}
        mode={formMode}
        open={formOpen}
        onOpenChange={setFormOpen}
        initialData={selectedRow}
        onSuccess={() => void mutate()}
      />

      <ConfirmDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={handleDelete}
        isLoading={isDeleting}
      />
    </div>
  );
}
