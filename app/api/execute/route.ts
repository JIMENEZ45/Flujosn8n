import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Hasta 60 s: los flujos de n8n suelen tardar más que el timeout por defecto.
export const maxDuration = 60;

const webhookMap: Record<string, string | undefined> = {
  "aut-tests": process.env.N8N_WEBHOOK_AUT_TESTS,
  "course-resources": process.env.N8N_WEBHOOK_COURSE_RESOURCES,
  "compare-documents": process.env.N8N_WEBHOOK_COMPARE_DOCUMENTS,
};

type JsonRecord = Record<string, unknown>;

function readMessage(data: unknown, fallback: string): string {
  if (data && typeof data === "object" && "message" in data) {
    const value = (data as JsonRecord).message;
    if (typeof value === "string" && value.trim()) return value;
  }
  return fallback;
}

export async function POST(request: NextRequest) {
  let body: JsonRecord;

  try {
    body = (await request.json()) as JsonRecord;
  } catch {
    return NextResponse.json(
      { ok: false, message: "El cuerpo de la petición no es JSON válido." },
      { status: 400 },
    );
  }

  const flowId = typeof body?.flowId === "string" ? body.flowId : "";
  const payload =
    body?.payload && typeof body.payload === "object" ? (body.payload as JsonRecord) : {};

  if (!flowId) {
    return NextResponse.json(
      { ok: false, message: "No se recibió el identificador del flujo." },
      { status: 400 },
    );
  }

  if (!Object.prototype.hasOwnProperty.call(webhookMap, flowId)) {
    return NextResponse.json(
      { ok: false, message: "Ese flujo no existe en el servidor." },
      { status: 404 },
    );
  }

  const webhookUrl = webhookMap[flowId];

  // Modo demo: la app nunca se rompe si aún no configuraste la variable de entorno.
  if (!webhookUrl) {
    await new Promise((resolve) => setTimeout(resolve, 600));
    return NextResponse.json({
      ok: true,
      demo: true,
      message:
        "Modo demo: este flujo aún no tiene webhook. Agrégalo en las Environment Variables de Vercel.",
    });
  }

  // Header tipado como Record<string, string> para poder asignar claves dinámicas.
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (process.env.N8N_SHARED_SECRET) {
    headers["x-n8n-secret"] = process.env.N8N_SHARED_SECRET;
  }

  // Corta la espera antes de que Vercel mate la función por timeout.
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 55_000);

  try {
    const n8nResponse = await fetch(webhookUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      cache: "no-store",
      signal: controller.signal,
    });

    const contentType = n8nResponse.headers.get("content-type") || "";
    let data: unknown;

    if (contentType.includes("application/json")) {
      data = await n8nResponse.json().catch(() => ({}));
    } else {
      data = { raw: await n8nResponse.text() };
    }

    if (!n8nResponse.ok) {
      return NextResponse.json(
        {
          ok: false,
          message: readMessage(data, `n8n respondió con estado ${n8nResponse.status}.`),
          data,
        },
        { status: 502 },
      );
    }

    return NextResponse.json({
      ok: true,
      message: readMessage(data, "La automatización terminó correctamente."),
      data,
    });
  } catch (error) {
    const aborted = error instanceof Error && error.name === "AbortError";

    return NextResponse.json(
      {
        ok: false,
        message: aborted
          ? "n8n tardó demasiado en responder (más de 55 s)."
          : error instanceof Error
            ? error.message
            : "Error inesperado al contactar n8n.",
      },
      { status: aborted ? 504 : 500 },
    );
  } finally {
    clearTimeout(timeout);
  }
}
