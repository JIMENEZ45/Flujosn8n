"use client";

import {
  ArrowUpRight,
  FileJson,
  FileSearch,
  FolderCog,
  LoaderCircle,
  Play,
  Search,
  Terminal,
  X,
} from "lucide-react";
import type { ElementType, FormEvent } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";

type Field = {
  key: string;
  label: string;
  placeholder: string;
  type?: "text" | "url" | "number";
};

type Flow = {
  id: string;
  code: string;
  name: string;
  description: string;
  category: string;
  icon: ElementType;
  fields: Field[];
};

const flows: Flow[] = [
  {
    id: "aut-tests",
    code: "NX-001",
    name: "Generar tests JSON",
    description:
      "Convierte un Google Doc con tests en archivos JSON y entrega la carpeta temporal de Drive.",
    category: "Tests",
    icon: FileJson,
    fields: [
      {
        key: "googleDocUrl",
        label: "Enlace del Google Doc",
        placeholder: "https://docs.google.com/document/d/.../edit",
        type: "url",
      },
    ],
  },
  {
    id: "course-resources",
    code: "NX-002",
    name: "Procesar recursos",
    description: "Organiza y clasifica los recursos de un curso alojados en Google Drive.",
    category: "Cursos",
    icon: FolderCog,
    fields: [
      {
        key: "folderUrl",
        label: "Carpeta de Google Drive",
        placeholder: "https://drive.google.com/drive/folders/...",
        type: "url",
      },
    ],
  },
  {
    id: "compare-documents",
    code: "NX-003",
    name: "Comparar documentos",
    description: "Contrasta la Plantilla Temática con el Diseño Instruccional y reporta diferencias.",
    category: "Validación",
    icon: FileSearch,
    fields: [
      {
        key: "templateUrl",
        label: "Enlace de la Plantilla Temática",
        placeholder: "https://docs.google.com/document/d/...",
        type: "url",
      },
      {
        key: "designUrl",
        label: "Enlace del Diseño Instruccional",
        placeholder: "https://docs.google.com/document/d/...",
        type: "url",
      },
    ],
  },
];

type ExecutionResult = {
  ok?: boolean;
  demo?: boolean;
  message?: string;
  data?: Record<string, unknown>;
};

export default function Home() {
  const [query, setQuery] = useState("");
  const [selectedFlow, setSelectedFlow] = useState<Flow | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [clock, setClock] = useState("--:--:--");

  // Reloj HUD (solo en cliente para evitar errores de hidratación)
  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString("es-CO", { hour12: false }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const filteredFlows = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return flows;

    return flows.filter((flow) =>
      [flow.name, flow.description, flow.category, flow.code].some((text) =>
        text.toLowerCase().includes(value),
      ),
    );
  }, [query]);

  const closeFlow = useCallback(() => {
    if (submitting) return;
    setSelectedFlow(null);
    setResult(null);
  }, [submitting]);

  // Cerrar con Escape + bloquear scroll de fondo
  useEffect(() => {
    if (!selectedFlow) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeFlow();
    };

    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [selectedFlow, closeFlow]);

  function openFlow(flow: Flow) {
    setSelectedFlow(flow);
    setResult(null);
  }

  async function executeFlow(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedFlow) return;

    setSubmitting(true);
    setResult(null);

    const formData = new FormData(event.currentTarget);
    const payload: Record<string, string> = {};
    formData.forEach((value, key) => {
      payload[key] = typeof value === "string" ? value.trim() : "";
    });

    try {
      const response = await fetch("/api/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flowId: selectedFlow.id, payload }),
      });

      let responseData: ExecutionResult;

      try {
        responseData = (await response.json()) as ExecutionResult;
      } catch {
        throw new Error(`El servidor respondió con estado ${response.status}.`);
      }

      if (!response.ok || responseData.ok === false) {
        throw new Error(responseData.message || "No se pudo ejecutar la automatización.");
      }

      setResult(responseData);
    } catch (error) {
      setResult({
        ok: false,
        message: error instanceof Error ? error.message : "Ocurrió un error inesperado.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  const folderUrl =
    typeof result?.data?.folderUrl === "string" ? (result.data.folderUrl as string) : null;
  const totalTests =
    typeof result?.data?.totalTests === "number" ? (result.data.totalTests as number) : null;

  return (
    <main className="page-shell">
      <div className="grid-layer" />
      <div className="floor-layer" />
      <div className="aurora aurora-1" />
      <div className="aurora aurora-2" />
      <div className="aurora aurora-3" />
      <div className="sweep" />
      <div className="scanlines" />
      <div className="vignette" />

      <div className="content">
        <header className="topbar">
          <div className="brand">
            <span className="brand-icon">
              <Terminal size={20} />
            </span>
            <span>
              <span className="brand-name">Flow Center</span>
              <span className="brand-sub">n8n control node</span>
            </span>
          </div>

          <div className="hud-stats">
            <div className="hud-stat">
              <span>Flujos</span>
              <strong>{String(flows.length).padStart(2, "0")}</strong>
            </div>
            <div className="hud-stat">
              <span>Hora local</span>
              <strong>{clock}</strong>
            </div>
            <span className="status-pill">
              <span className="status-dot" />
              Sistema en línea
            </span>
          </div>
        </header>

        <section className="hero">
          <p className="eyebrow">Automatizaciones</p>
          <h1>
            Todos tus flujos,
            <br />
            <span className="glow-word">en un solo lugar.</span>
          </h1>
          <p className="hero-copy">
            Selecciona una automatización, completa sus datos y ejecútala sin entrar al editor de
            n8n. Respuesta en tiempo real, directo desde el navegador.
          </p>

          <div className="hero-meta">
            <span className="chip">
              Motor <b>n8n</b>
            </span>
            <span className="chip">
              Runtime <b>Next.js 15</b>
            </span>
            <span className="chip">
              Estado <b>Operativo</b>
            </span>
          </div>
        </section>

        <div className="toolbar">
          <div className="search-box">
            <Search size={18} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar automatización..."
              aria-label="Buscar automatización"
            />
          </div>
          <span className="count-label">
            {filteredFlows.length} / {flows.length} módulos
          </span>
        </div>

        <section className="flow-grid" aria-label="Automatizaciones disponibles">
          {filteredFlows.map((flow, index) => {
            const Icon = flow.icon;

            return (
              <button
                key={flow.id}
                type="button"
                className="flow-card"
                style={{ animationDelay: `${index * 90}ms` }}
                onClick={() => openFlow(flow)}
              >
                <div className="flow-card-header">
                  <span className="flow-icon">
                    <Icon size={24} />
                  </span>
                  <span className="category">{flow.category}</span>
                </div>

                <div>
                  <p className="flow-id">// {flow.code}</p>
                  <h2>{flow.name}</h2>
                  <p>{flow.description}</p>
                </div>

                <span className="open-label">
                  Ejecutar
                  <ArrowUpRight size={15} />
                </span>
              </button>
            );
          })}
        </section>

        {filteredFlows.length === 0 && (
          <div className="empty-state">
            &gt; Sin resultados para &quot;{query}&quot;. Intenta con otro término.
          </div>
        )}

        <p className="footer-note">Flow Center · Interfaz de control para n8n</p>
      </div>

      {selectedFlow && (
        <div className="modal-backdrop" onMouseDown={closeFlow}>
          <section
            className="flow-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="flow-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="close-button"
              onClick={closeFlow}
              aria-label="Cerrar"
            >
              <X size={18} />
            </button>

            <div className="modal-icon">
              <selectedFlow.icon size={24} />
            </div>

            <p className="eyebrow">
              {selectedFlow.code} · {selectedFlow.category}
            </p>
            <h2 id="flow-title">{selectedFlow.name}</h2>
            <p className="modal-copy">{selectedFlow.description}</p>

            <form onSubmit={executeFlow} className="flow-form">
              {selectedFlow.fields.map((field) => (
                <label key={field.key}>
                  <span>{field.label}</span>
                  <input
                    name={field.key}
                    type={field.type || "text"}
                    placeholder={field.placeholder}
                    autoComplete="off"
                    required
                  />
                </label>
              ))}

              <button className="execute-button" type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <LoaderCircle className="spin" size={18} />
                    Ejecutando...
                  </>
                ) : (
                  <>
                    <Play size={16} fill="currentColor" />
                    Ejecutar automatización
                  </>
                )}
              </button>
            </form>

            {result && (
              <div
                className={`result-box ${result.ok === false ? "result-error" : "result-success"}`}
                role="status"
              >
                <strong>
                  {result.ok === false ? "// Error de ejecución" : "// Proceso completado"}
                </strong>
                <p>{result.message || "La automatización terminó correctamente."}</p>

                {totalTests !== null && <p>Archivos generados: {totalTests}</p>}

                {folderUrl && (
                  <a href={folderUrl} target="_blank" rel="noreferrer">
                    Abrir carpeta de Drive
                    <ArrowUpRight size={14} />
                  </a>
                )}
              </div>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
