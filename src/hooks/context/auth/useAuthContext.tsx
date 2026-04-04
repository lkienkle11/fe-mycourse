"use client";

import { useContext } from "react";
import { AuthContext, type AuthContextValue } from "@/context/auth";

export function useAuthContext(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within an <AuthProvider>.");
  }
  return context;
}
