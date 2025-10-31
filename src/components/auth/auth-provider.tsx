"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type {
  AuthError,
  Session,
  SignInWithPasswordCredentials,
  SignUpWithPasswordCredentials,
  User,
} from "@supabase/supabase-js";

import { createSupabaseBrowserClient } from "@/lib/supabaseClient";

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  initializationError: string | null;
  signInWithPassword: (
    credentials: SignInWithPasswordCredentials,
  ) => Promise<{ data: { user: User | null; session: Session | null } | null; error: AuthError | null }>;
  signUpWithPassword: (
    credentials: SignUpWithPasswordCredentials,
  ) => Promise<{
    data: { user: User | null; session: Session | null } | null;
    error: AuthError | null;
  }>;
  signOut: () => Promise<{ error: AuthError | null }>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [{ supabase, initializationError }] = useState(() => {
    try {
      return { supabase: createSupabaseBrowserClient(), initializationError: null };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Supabase client could not be initialized. Check your environment configuration.";
      if (process.env.NODE_ENV !== "production") {
        console.error("Supabase initialization failed", error);
      }
      return { supabase: null, initializationError: message };
    }
  });

  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (isMounted) {
          setSession(data.session ?? null);
          setIsLoading(false);
        }
      })
      .catch((error) => {
        if (process.env.NODE_ENV !== "production") {
          console.error("Failed to fetch initial session", error);
        }
        if (isMounted) {
          setIsLoading(false);
        }
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const value = useMemo<AuthContextValue>(() => {
    const unavailableClientError: string =
      initializationError ?? "Supabase client is not configured. Provide public URL and anon key.";

    const ensureClient = <T,>(action: () => Promise<T>) => {
      if (!supabase) {
        return Promise.reject(new Error(unavailableClientError));
      }

      return action();
    };

    return {
      user: session?.user ?? null,
      session,
      isLoading,
      initializationError,
      signInWithPassword: (credentials) =>
        ensureClient(() => supabase.auth.signInWithPassword(credentials)),
      signUpWithPassword: (credentials) => ensureClient(() => supabase.auth.signUp(credentials)),
      signOut: () => ensureClient(() => supabase.auth.signOut()),
    };
  }, [supabase, session, isLoading, initializationError]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
