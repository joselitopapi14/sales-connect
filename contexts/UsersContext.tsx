"use client";

import * as React from "react";
import type { User } from "@/data/users/columns";
import { createClient } from "@/utils/supabase/client";

interface UsersContextType {
  users: User[];
  isLoading: boolean;
  error: string | null;
  addUser: (user: Omit<User, "id" | "created_at">) => Promise<void>;
  updateUser: (id: string, user: Partial<Omit<User, "id" | "created_at">>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  deleteUsers: (ids: string[]) => Promise<void>;
  refreshUsers: () => Promise<void>;
}

const UsersContext = React.createContext<UsersContextType | undefined>(
  undefined
);

export function UsersProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = React.useState<User[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const supabase = createClient();

  // Load users from Supabase
  const refreshUsers = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      console.log("Fetching users from Supabase...");
      
      const { data, error: supabaseError } = await supabase
        .from("Users")
        .select("*")
        .order("created_at", { ascending: false });

      console.log("Supabase fetch response:", { data, error: supabaseError });

      if (supabaseError) {
        console.error("Supabase error details:", {
          message: supabaseError.message,
          details: supabaseError.details,
          hint: supabaseError.hint,
          code: supabaseError.code,
        });
        throw new Error(
          supabaseError.message || 
          supabaseError.details || 
          `Database error (${supabaseError.code})`
        );
      }

      setUsers(data || []);
      console.log(`Loaded ${data?.length || 0} users`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      setError(errorMessage);
      console.error("Error fetching users:", {
        error: err,
        message: errorMessage,
        type: typeof err,
      });
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  // Load users on mount
  React.useEffect(() => {
    refreshUsers();
  }, [refreshUsers]);

  const addUser = React.useCallback(async (user: Omit<User, "id" | "created_at">) => {
    setIsLoading(true);
    setError(null);
    try {
      console.log("Attempting to create user:", user);
      
      const { data, error: supabaseError } = await supabase
        .from("Users")
        .insert([user])
        .select()
        .single();

      console.log("Supabase response:", { data, error: supabaseError });

      if (supabaseError) {
        console.error("Supabase error details:", {
          message: supabaseError.message,
          details: supabaseError.details,
          hint: supabaseError.hint,
          code: supabaseError.code,
        });
        throw new Error(
          supabaseError.message || 
          supabaseError.details || 
          `Database error (${supabaseError.code})`
        );
      }

      if (!data) {
        throw new Error("No data returned from database");
      }

      setUsers((prev) => [data, ...prev]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      setError(errorMessage);
      console.error("Error creating user:", {
        error: err,
        message: errorMessage,
        type: typeof err,
      });
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  const updateUser = React.useCallback(
    async (id: string, updatedFields: Partial<Omit<User, "id" | "created_at">>) => {
      setIsLoading(true);
      setError(null);
      try {
        const { data, error: supabaseError } = await supabase
          .from("Users")
          .update(updatedFields)
          .eq("id", id)
          .select()
          .single();

        if (supabaseError) {
          throw supabaseError;
        }

        setUsers((prev) =>
          prev.map((user) =>
            user.id === id ? data : user
          )
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        console.error("Error updating user:", err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [supabase]
  );

  const deleteUser = React.useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      console.log("Deleting user:", id);
      
      const { error: supabaseError } = await supabase
        .from("Users")
        .delete()
        .eq("id", id);

      if (supabaseError) {
        console.error("Supabase error deleting user:", {
          message: supabaseError.message,
          details: supabaseError.details,
          hint: supabaseError.hint,
          code: supabaseError.code,
        });
        throw new Error(
          supabaseError.message || 
          supabaseError.details || 
          `Database error (${supabaseError.code})`
        );
      }

      setUsers((prev) => prev.filter((user) => user.id !== id));
      console.log("User deleted successfully");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      setError(errorMessage);
      console.error("Error deleting user:", {
        error: err,
        message: errorMessage,
        type: typeof err,
      });
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  const deleteUsers = React.useCallback(async (ids: string[]) => {
    setIsLoading(true);
    setError(null);
    try {
      const { error: supabaseError } = await supabase
        .from("Users")
        .delete()
        .in("id", ids);

      if (supabaseError) {
        throw supabaseError;
      }

      setUsers((prev) => prev.filter((user) => !ids.includes(user.id)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Error deleting users:", err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  const value = React.useMemo(
    () => ({
      users,
      isLoading,
      error,
      addUser,
      updateUser,
      deleteUser,
      deleteUsers,
      refreshUsers,
    }),
    [users, isLoading, error, addUser, updateUser, deleteUser, deleteUsers, refreshUsers]
  );

  return (
    <UsersContext.Provider value={value}>
      {children}
    </UsersContext.Provider>
  );
}

export function useUsers() {
  const context = React.useContext(UsersContext);
  if (context === undefined) {
    throw new Error("useUsers must be used within a UsersProvider");
  }
  return context;
}