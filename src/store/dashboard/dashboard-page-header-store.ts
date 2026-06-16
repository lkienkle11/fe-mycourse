import { create } from "zustand";

import type { DashboardPageHeaderOverride } from "@/types/dashboard";

type DashboardPageHeaderEntry = {
  id: symbol;
  value: DashboardPageHeaderOverride | null;
};

export type DashboardPageHeaderStoreState = {
  entry: DashboardPageHeaderEntry | null;
  setOverride: (id: symbol, next: DashboardPageHeaderOverride | null) => void;
};

export const useDashboardPageHeaderStore =
  create<DashboardPageHeaderStoreState>((set) => ({
    entry: null,

    setOverride: (id, next) => {
      set((state) => {
        if (next == null) {
          return {
            entry: state.entry?.id === id ? null : state.entry,
          };
        }

        return {
          entry: {
            id,
            value: next,
          },
        };
      });
    },
  }));
