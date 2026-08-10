import type { NextRequest } from "next/server";
import { actualizarSesion } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await actualizarSesion(request);
}

export const config = {
  matcher: [
    /*
     * Todas las rutas salvo archivos estáticos e imágenes.
     * La API sí pasa por aquí: los webhooks no deben quedar abiertos.
     */
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|.*\\.(?:png|jpg|jpeg|gif|svg|webp)$).*)",
  ],
};
