"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import type { User, Session, AuthError } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, userData?: {
    name?: string;
    phone?: string;
    cedula?: string;
  }) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    // Obtener sesión inicial
    const initializeAuth = async () => {
      try {
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Error getting session:", error);
          throw error;
        }

        setSession(currentSession);
        setUser(currentSession?.user ?? null);
      } catch (error) {
        console.error("Failed to initialize auth:", error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        console.log("Auth state changed:", _event);
        setSession(newSession);
        setUser(newSession?.user ?? null);
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase.auth]);

  // Registrar nuevo usuario
  const signUp = async (
    email: string, 
    password: string,
    userData?: {
      name?: string;
      phone?: string;
      cedula?: string;
    }
  ) => {
    try {
      console.log("Attempting to sign up user:", { email, userData });
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: userData?.name || "",
            phone: userData?.phone || "",
            cedula: userData?.cedula || "",
          },
        },
      });

      if (error) {
        console.error("Sign up error:", {
          message: error.message,
          status: error.status,
          name: error.name,
        });
        return { error };
      }

      console.log("Sign up successful:", data);

      // Si el usuario se creó correctamente, también guardarlo en la tabla Users
      // El ID del usuario de Auth será el mismo ID en la tabla Users
      if (data.user && userData) {
        console.log("Inserting user into Users table with ID:", data.user.id);
        
        const { error: insertError } = await supabase
          .from("Users")
          .insert({
            id: data.user.id, // Usar el UUID del usuario de Auth
            name: userData.name || "",
            email: email,
            phone: userData.phone || "",
            cedula: userData.cedula || "",
          });

        if (insertError) {
          console.error("Error inserting user into Users table:", {
            message: insertError.message,
            details: insertError.details,
            hint: insertError.hint,
            code: insertError.code,
          });
          
          // Si falla la inserción, eliminar el usuario de Auth para mantener consistencia
          await supabase.auth.admin.deleteUser(data.user.id);
          
          throw new Error(`Failed to create user profile: ${insertError.message}`);
        }
        
        console.log("User successfully inserted into Users table");
      }

      return { error: null };
    } catch (error) {
      console.error("Unexpected error during sign up:", error);
      return { 
        error: { 
          message: error instanceof Error ? error.message : "Unknown error occurred",
          name: "UnexpectedError",
          status: 500,
        } as AuthError 
      };
    }
  };

  // Iniciar sesión
  const signIn = async (email: string, password: string) => {
    try {
      console.log("Attempting to sign in user:", email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("Sign in error:", {
          message: error.message,
          status: error.status,
          name: error.name,
        });
        return { error };
      }

      console.log("Sign in successful:", data);
      return { error: null };
    } catch (error) {
      console.error("Unexpected error during sign in:", error);
      return { 
        error: { 
          message: error instanceof Error ? error.message : "Unknown error occurred",
          name: "UnexpectedError",
          status: 500,
        } as AuthError 
      };
    }
  };

  // Cerrar sesión
  const signOut = async () => {
    try {
      console.log("Attempting to sign out");
      
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error("Sign out error:", {
          message: error.message,
          status: error.status,
          name: error.name,
        });
        return { error };
      }

      console.log("Sign out successful");
      return { error: null };
    } catch (error) {
      console.error("Unexpected error during sign out:", error);
      return { 
        error: { 
          message: error instanceof Error ? error.message : "Unknown error occurred",
          name: "UnexpectedError",
          status: 500,
        } as AuthError 
      };
    }
  };

  // Restablecer contraseña
  const resetPassword = async (email: string) => {
    try {
      console.log("Attempting to reset password for:", email);
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        console.error("Reset password error:", {
          message: error.message,
          status: error.status,
          name: error.name,
        });
        return { error };
      }

      console.log("Password reset email sent successfully");
      return { error: null };
    } catch (error) {
      console.error("Unexpected error during password reset:", error);
      return { 
        error: { 
          message: error instanceof Error ? error.message : "Unknown error occurred",
          name: "UnexpectedError",
          status: 500,
        } as AuthError 
      };
    }
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
