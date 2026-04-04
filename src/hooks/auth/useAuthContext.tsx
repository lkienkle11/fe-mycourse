"use client";

import { useContext } from "react";
import {
  AuthContext,
  type AuthContextValue,
  MeContext,
  type MeContextValue,
} from "@/context/auth";

export function useAuthContext(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within an <AuthProvider>.");
  }
  return context;
}

export function useGetMe(): MeContextValue {
  const context = useContext(MeContext);
  if (!context) {
    throw new Error("useGetMe must be used within a <MeProvider>.");
  }
  return context;
}
