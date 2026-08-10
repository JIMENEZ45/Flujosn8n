"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type EstadoAuth = { error?: string; aviso?: string };

/** Traduce los errores de Supabase a mensajes en español. */
function traducir(mensaje: string): string {
  const m = mensaje.toLowerCase();
  if (m.includes("invalid login credentials")) return "Correo o contraseña incorrectos.";
  if (m.includes("email not confirmed")) return "Confirma tu correo antes de entrar.";
  if (m.includes("user already registered")) return "Ya existe una cuenta con ese correo.";
  if (m.includes("password should be at least"))
    return "La contraseña debe tener al menos 8 caracteres.";
  if (m.includes("rate limit") || m.includes("too many"))
    return "Demasiados intentos. Espera un momento.";
  return "No se pudo completar la operación. Intenta de nuevo.";
}

export async function iniciarSesion(
  _estado: EstadoAuth,
  formData: FormData,
): Promise<EstadoAuth> {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");

  if (!email || !password) {
    return { error: "Escribe tu correo y tu contraseña." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) return { error: traducir(error.message) };

  revalidatePath("/", "layout");
  redirect("/");
}

export async function crearCuenta(
  _estado: EstadoAuth,
  formData: FormData,
): Promise<EstadoAuth> {
  const nombre = String(formData.get("nombre") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const confirmar = String(formData.get("confirmar") || "");

  if (!nombre) return { error: "Escribe tu nombre." };
  if (password.length < 8) return { error: "La contraseña debe tener al menos 8 caracteres." };
  if (password !== confirmar) return { error: "Las contraseñas no coinciden." };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { nombre } },
  });

  if (error) return { error: traducir(error.message) };

  // Si el proyecto exige confirmar el correo, no hay sesión todavía.
  if (!data.session) {
    return { aviso: "Cuenta creada. Revisa tu correo para confirmarla y luego inicia sesión." };
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function cerrarSesion() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
