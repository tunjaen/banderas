"use client";

import { signOut } from "next-auth/react";

export default function LogoutButton({ text }: { text?: string }) {
  return (
    <button 
      onClick={() => signOut({ callbackUrl: "/" })} 
      className="btn btn-outline"
    >
      {text || "Cerrar sesión"}
    </button>
  );
}
