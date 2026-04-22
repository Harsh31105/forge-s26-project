"use client";

import { createContext, useContext } from "react";
import { useMe } from "@/src/hooks/useMe";
import type { Student } from "@/src/lib/api/northStarAPI.schemas";

interface AuthContextValue {
  student: Student | undefined;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { student, isLoading } = useMe();

  return (
    <AuthContext.Provider value={{ student, isLoading, isAuthenticated: !!student }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
