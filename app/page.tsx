import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Panel from "./panel";

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Doble candado: el middleware ya protege, pero nunca renderizamos sin sesión.
  if (!user) redirect("/login");

  const { data: perfil } = await supabase
    .from("perfiles")
    .select("nombre, rol")
    .eq("id", user.id)
    .maybeSingle();

  const usuario = {
    nombre: perfil?.nombre || (user.user_metadata?.nombre as string) || user.email || "Usuario",
    rol: perfil?.rol || "Invitado",
    email: user.email || "",
  };

  return <Panel usuario={usuario} />;
}
