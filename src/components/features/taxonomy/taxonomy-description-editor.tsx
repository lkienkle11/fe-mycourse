"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { SortableList } from "@/components/shared/sortable-list";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { newV7 } from "@/lib/utils/uuid";

const MAX_PARAGRAPHS = 8;

type DescriptionRow = {
  id: string;
  value: string;
};

function toRows(values: string[]): DescriptionRow[] {
  return values.map((value) => ({
    id: newV7(),
    value,
  }));
}

function fromRows(rows: DescriptionRow[]): string[] {
  return rows.map((row) => row.value);
}

export type TaxonomyDescriptionEditorProps = {
  value: string[];
  onChange: (value: string[]) => void;
};

export function TaxonomyDescriptionEditor({
  value,
  onChange,
}: TaxonomyDescriptionEditorProps) {
  const t = useTranslations("taxonomy.description");
  const [rows, setRows] = useState<DescriptionRow[]>(() =>
    toRows(value.length ? value : [""]),
  );

  const updateRows = (nextRows: DescriptionRow[]) => {
    setRows(nextRows);
    onChange(fromRows(nextRows));
  };

  return (
    <div className="space-y-2">
      <SortableList
        items={rows}
        dragLabel={t("dragHandle")}
        onReorder={updateRows}
        renderItem={(row, index) => (
          <div className="flex gap-2">
            <Input
              value={row.value}
              placeholder={t("placeholder")}
              onChange={(event) => {
                const next = [...rows];
                next[index] = { ...row, value: event.target.value };
                updateRows(next);
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                updateRows(rows.filter((item) => item.id !== row.id));
              }}
            >
              {t("remove")}
            </Button>
          </div>
        )}
      />
      <Button
        type="button"
        variant="secondary"
        size="sm"
        disabled={rows.length >= MAX_PARAGRAPHS}
        onClick={() => {
          updateRows([...rows, { id: newV7(), value: "" }]);
        }}
      >
        {t("addParagraph")}
      </Button>
    </div>
  );
}
