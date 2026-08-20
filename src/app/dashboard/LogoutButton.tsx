"use client";

import { signOut } from "next-auth/react";

export default function LogoutButton() {
  return (
    <button 
      onClick={() => signOut({ callbackUrl: "/" })} 
      className="btn btn-outline"
    >
      Cerrar sesión
    </button>
  );
}
