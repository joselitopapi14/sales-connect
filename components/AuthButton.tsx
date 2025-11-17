"use client";

import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Image from "next/image";

export function AuthButton() {
  const { user, loading, signInWithGoogle, signOut } = useAuth();

  if (loading) {
    return (
      <Button variant="outline" disabled>
        Cargando...
      </Button>
    );
  }

  if (!user) {
    return (
      <Button variant="outline" onClick={signInWithGoogle}>
        Iniciar Sesión
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          {user.user_metadata?.avatar_url ? (
            <Image
              src={user.user_metadata.avatar_url}
              alt={user.user_metadata?.name || "User"}
              width={24}
              height={24}
              className="rounded-full"
            />
          ) : (
            <div className="size-6 rounded-full bg-slate-700 flex items-center justify-center text-white text-xs font-medium">
              {user.email?.[0].toUpperCase()}
            </div>
          )}
          <span className="text-sm font-medium text-slate-700">
            {user.user_metadata?.name || user.email}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="start">
        <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem disabled>
            <div className="flex items-center gap-2">
              {user.user_metadata?.avatar_url ? (
                <Image
                  src={user.user_metadata.avatar_url}
                  alt={user.user_metadata?.name || "User"}
                  width={32}
                  height={32}
                  className="rounded-full"
                />
              ) : (
                <div className="size-8 rounded-full bg-slate-700 flex items-center justify-center text-white text-sm font-medium">
                  {user.email?.[0].toUpperCase()}
                </div>
              )}
              <div className="flex flex-col">
                <span className="font-medium text-slate-700">
                  {user.user_metadata?.name || "Usuario"}
                </span>
                <span className="text-xs text-neutral-500">{user.email}</span>
              </div>
            </div>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={signOut} className="cursor-pointer text-red-600">
          Cerrar Sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
