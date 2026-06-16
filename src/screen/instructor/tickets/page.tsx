"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  addInstructorTicketMessageService,
  closeInstructorTicketService,
  createInstructorTicketService,
} from "@/api/callers/instructor";
import {
  useInstructorTicketMessages,
  useInstructorTicketsList,
} from "@/api/hooks/instructor";
import { InstructorListPagination } from "@/components/features/instructor/instructor-list-pagination";
import type { DataTableColumn } from "@/components/shared/data-table";
import { DataTable } from "@/components/shared/data-table";
import { PermissionGate } from "@/components/shared/permission-gate";
import { RequiredLabel } from "@/components/shared/required-label";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PERMISSIONS } from "@/constants/permissions";
import { useRegisterDashboardPageHeader } from "@/hooks/dashboard";
import { toastApiError } from "@/lib/utils/api-error";
import { toastValidationError } from "@/lib/utils/validation-message";
import { instructorTicketSchema } from "@/schema/instructor";
import type {
  InstructorTicket,
  InstructorTicketListFilters,
} from "@/types/instructor";

export function InstructorTicketsPage() {
  const t = useTranslations("instructor.tickets");
  const tc = useTranslations("instructor.common");
  const tValidation = useTranslations("instructor.validation");
  const tErrors = useTranslations("errors.codes");
  const [filters, setFilters] = useState<InstructorTicketListFilters>({
    page: 1,
    per_page: 20,
  });
  const [createOpen, setCreateOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<InstructorTicket | null>(
    null,
  );
  const [threadOpen, setThreadOpen] = useState(false);
  const [messageBody, setMessageBody] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const headerActions = useMemo(
    () => (
      <Button type="button" onClick={() => setCreateOpen(true)}>
        {t("create")}
      </Button>
    ),
    [t],
  );
  const headerOverride = useMemo(
    () => ({
      actions: headerActions,
    }),
    [headerActions],
  );

  const { rows, pageInfo, isLoading, mutate } =
    useInstructorTicketsList(filters);
  const { rows: messages, mutate: mutateMessages } =
    useInstructorTicketMessages(selectedTicket?.id ?? null);

  const page = pageInfo?.page ?? filters.page ?? 1;
  const totalPages = pageInfo?.total_pages ?? 1;

  const columns = useMemo<DataTableColumn<InstructorTicket>[]>(
    () => [
      { id: "id", header: t("columns.id"), cell: (row) => row.id },
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

  const handleCreate = async () => {
    const trimmed = subject.trim();
    const parsed = instructorTicketSchema
      .pick({ subject: true })
      .safeParse({ subject: trimmed });
    if (!parsed.success) {
      toastValidationError(tValidation, parsed.error.issues, "ticketSubject");
      return;
    }
    setIsCreating(true);
    try {
      await createInstructorTicketService({ subject: trimmed });
      toast.success(t("createSuccess"));
      setCreateOpen(false);
      setSubject("");
      await mutate();
    } catch (error) {
      toastApiError(tErrors, error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleSendMessage = async () => {
    if (!selectedTicket) return;
    const body = messageBody.trim();
    const parsed = instructorTicketSchema
      .pick({ message: true })
      .safeParse({ message: body });
    if (!parsed.success) {
      toastValidationError(tValidation, parsed.error.issues, "ticketMessage");
      return;
    }
    setIsSending(true);
    try {
      await addInstructorTicketMessageService(selectedTicket.id, { body });
      setMessageBody("");
      await mutateMessages();
    } catch (error) {
      toastApiError(tErrors, error);
    } finally {
      setIsSending(false);
    }
  };

  const handleClose = async () => {
    if (!selectedTicket) return;
    setIsClosing(true);
    try {
      await closeInstructorTicketService(selectedTicket.id);
      toast.success(t("closeSuccess"));
      setThreadOpen(false);
      await mutate();
    } catch (error) {
      toastApiError(tErrors, error);
    } finally {
      setIsClosing(false);
    }
  };

  useRegisterDashboardPageHeader(headerOverride);

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
          renderActions={(row) => (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedTicket(row);
                setThreadOpen(true);
              }}
            >
              {t("openThread")}
            </Button>
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

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("createTitle")}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-2">
            <RequiredLabel htmlFor="ticket-subject">
              {t("subjectLabel")}
            </RequiredLabel>
            <Input
              id="ticket-subject"
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setCreateOpen(false)}
            >
              {tc("cancel")}
            </Button>
            <Button
              type="button"
              disabled={isCreating || !subject.trim()}
              onClick={() => void handleCreate()}
            >
              {isCreating ? t("creating") : t("create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={threadOpen} onOpenChange={setThreadOpen}>
        <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedTicket?.subject}</DialogTitle>
          </DialogHeader>
          <ul className="mb-4 max-h-48 space-y-2 overflow-y-auto">
            {messages.map((message) => (
              <li key={message.id} className="rounded-md border p-2 text-sm">
                {message.body}
              </li>
            ))}
          </ul>
          {selectedTicket?.status === "open" ? (
            <>
              <RequiredLabel htmlFor="ticket-message">
                {t("messagePlaceholder")}
              </RequiredLabel>
              <Textarea
                id="ticket-message"
                value={messageBody}
                rows={3}
                placeholder={t("messagePlaceholder")}
                onChange={(event) => setMessageBody(event.target.value)}
              />
              <DialogFooter className="gap-2 sm:justify-between">
                <Button
                  type="button"
                  disabled={isSending || !messageBody.trim()}
                  onClick={() => void handleSendMessage()}
                >
                  {isSending ? t("sending") : t("sendMessage")}
                </Button>
                <PermissionGate
                  permissions={[PERMISSIONS.InstructorTicketClose]}
                >
                  <Button
                    type="button"
                    variant="destructive"
                    disabled={isClosing}
                    onClick={() => void handleClose()}
                  >
                    {t("close")}
                  </Button>
                </PermissionGate>
              </DialogFooter>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">{t("threadClosed")}</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
