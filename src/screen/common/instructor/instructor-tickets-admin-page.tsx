"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { closeInstructorTicketService } from "@/api/callers/instructor";
import {
  useInstructorTicketMessages,
  useInstructorTicketsList,
} from "@/api/hooks/instructor";
import { InstructorListPagination } from "@/components/features/instructor/instructor-list-pagination";
import { InstructorUserCell } from "@/components/features/instructor/instructor-user-cell";
import type { DataTableColumn } from "@/components/shared/data-table";
import { DataTable } from "@/components/shared/data-table";
import { PermissionGate } from "@/components/shared/permission-gate";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PERMISSIONS } from "@/constants/permissions";
import { toastApiError } from "@/lib/utils/api-error";
import type {
  InstructorTicket,
  InstructorTicketListFilters,
  InstructorTicketStatus,
} from "@/types/instructor";

export function InstructorTicketsAdminPage() {
  const t = useTranslations("instructor.tickets");
  const tc = useTranslations("instructor.common");
  const tErrors = useTranslations("errors.codes");
  const [filters, setFilters] = useState<InstructorTicketListFilters>({
    page: 1,
    per_page: 20,
    scope: "all",
  });
  const [selectedTicket, setSelectedTicket] = useState<InstructorTicket | null>(
    null,
  );
  const [messagesOpen, setMessagesOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const { rows, pageInfo, isLoading, mutate } =
    useInstructorTicketsList(filters);
  const { rows: messages, isLoading: messagesLoading } =
    useInstructorTicketMessages(selectedTicket?.id ?? null);

  const page = pageInfo?.page ?? filters.page ?? 1;
  const totalPages = pageInfo?.total_pages ?? 1;

  const columns = useMemo<DataTableColumn<InstructorTicket>[]>(
    () => [
      {
        id: "user",
        header: t("columns.user"),
        cell: (row) => <InstructorUserCell user={row} />,
      },
      {
        id: "subject",
        header: t("columns.subject"),
        cell: (row) => row.subject,
      },
      {
        id: "status",
        header: t("columns.status"),
        cell: (row) => t(`status.${row.status}` as "status.open"),
      },
    ],
    [t],
  );

  const statusFilter = (
    <Select
      value={filters.ticket_status ?? "ALL"}
      onValueChange={(value) => {
        setFilters((prev) => ({
          ...prev,
          page: 1,
          ticket_status:
            value === "ALL" ? undefined : (value as InstructorTicketStatus),
        }));
      }}
    >
      <SelectTrigger className="w-[180px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="ALL">{t("statusAll")}</SelectItem>
        <SelectItem value="open">{t("status.open")}</SelectItem>
        <SelectItem value="closed">{t("status.closed")}</SelectItem>
      </SelectContent>
    </Select>
  );

  const handleClose = async (ticket: InstructorTicket) => {
    setIsClosing(true);
    try {
      await closeInstructorTicketService(ticket.id);
      toast.success(t("closeSuccess"));
      await mutate();
    } catch (error) {
      toastApiError(tErrors, error);
    } finally {
      setIsClosing(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {isLoading ? (
        <p className="text-sm text-muted-foreground">{tc("loading")}</p>
      ) : (
        <DataTable
          columns={columns}
          rows={rows}
          actionsHeader={tc("actions")}
          emptyMessage={tc("empty")}
          filterByOptions={[
            {
              value: "status",
              label: t("columns.status"),
              customInputComponent: statusFilter,
            },
          ]}
          selectedFilterBy="status"
          onFilterByChange={() => {}}
          filterByLabel={tc("filterBy")}
          renderActions={(row) => (
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedTicket(row);
                  setMessagesOpen(true);
                }}
              >
                {t("viewMessages")}
              </Button>
              {row.status === "open" ? (
                <PermissionGate
                  permissions={[PERMISSIONS.InstructorTicketClose]}
                >
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    disabled={isClosing}
                    onClick={() => void handleClose(row)}
                  >
                    {t("close")}
                  </Button>
                </PermissionGate>
              ) : null}
            </div>
          )}
        />
      )}

      <InstructorListPagination
        page={page}
        totalPages={totalPages}
        onPageChange={(next) => setFilters((prev) => ({ ...prev, page: next }))}
        previousLabel={tc("previous")}
        nextLabel={tc("next")}
        pageOfLabel={tc("pageOf", {
          page: String(page),
          totalPages: String(totalPages),
        })}
      />

      <Dialog open={messagesOpen} onOpenChange={setMessagesOpen}>
        <DialogContent className="max-h-[80vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {t("messagesTitle", {
                subject: selectedTicket?.subject ?? "",
              })}
            </DialogTitle>
          </DialogHeader>
          {messagesLoading ? (
            <p className="text-sm text-muted-foreground">{tc("loading")}</p>
          ) : messages.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("noMessages")}</p>
          ) : (
            <ul className="space-y-3">
              {messages.map((message) => (
                <li key={message.id} className="rounded-md border p-3 text-sm">
                  <p className="text-xs text-muted-foreground">
                    {t("messageMeta", {
                      name: message.author_full_name || "—",
                    })}
                    {message.author_email ? (
                      <span>{` · ${message.author_email}`}</span>
                    ) : null}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap">{message.body}</p>
                </li>
              ))}
            </ul>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
