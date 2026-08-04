"use client";

import {
  ArrowRight,
  ArrowUpRight,
  FileJson,
  FileSpreadsheet,
  FolderDown,
  LayoutTemplate,
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
  placeholder?: string;
  type?: "text" | "url" | "number" | "select";
  /** Solo para type "select". */
  options?: string[];
  defaultValue?: string;
  hint?: string;
};

type Flow = {
  id: string;
  code: string;
  name: string;
  description: string;
  category: string;
  icon: ElementType;
  /** Color del módulo: define ícono, etiqueta y botón. */
  accent: "blue" | "purple" | "green" | "orange";
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
    accent: "blue",
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
    id: "descargar-recursos",
    code: "NX-002",
    name: "Descarga de recursos",
    description:
      "Descarga los recursos listados en una hoja de Google Sheets, con opción de dividirlos por unidad.",
    category: "Recursos",
    icon: FolderDown,
    accent: "purple",
    fields: [
      {
        key: "sheetUrl",
        label: "URL de la hoja (Google Sheet)",
        placeholder: "https://docs.google.com/spreadsheets/d/.../edit",
        type: "url",
        hint: "Cópiala y pégala tal cual desde la barra del navegador.",
      },
      {
        key: "dividirPorUnidad",
        label: "Dividir recursos por unidad",
        type: "select",
        options: ["Si", "No"],
        defaultValue: "Si",
        hint: "Este proceso puede tardar varios minutos.",
      },
    ],
  },
  {
    id: "matriz-csv",
    code: "NX-003",
    name: "Matriz de importación CSV",
    description:
      "Genera la matriz de importación a partir de la plantilla de la asignatura y sus códigos.",
    category: "Matrices",
    icon: FileSpreadsheet,
    accent: "green",
    fields: [
      {
        key: "codigos",
        label: "Código Programa (PR) + Pensum (PS) + Asignatura (AS)",
        placeholder: "PR PS AS Nombre de la asignatura",
        type: "text",
        hint: "Pega los códigos en ese orden, seguidos del nombre de la asignatura.",
      },
      {
        key: "filaInicio",
        label: "Fila desde la que inicia la tabla",
        type: "select",
        options: ["3", "4", "5", "6", "7"],
        defaultValue: "5",
        hint: "Por defecto la plantilla inicia en la fila 5.",
      },
      {
        key: "plantillaUrl",
        label: "URL de la plantilla de la asignatura",
        placeholder: "https://docs.google.com/spreadsheets/d/...",
        type: "url",
      },
    ],
  },
  {
    id: "plantillas-tematicas",
    code: "NX-004",
    name: "Generador de plantillas temáticas",
    description:
      "Crea las plantillas temáticas a partir de una carpeta principal de Google Drive.",
    category: "Plantillas",
    icon: LayoutTemplate,
    accent: "orange",
    fields: [
      {
        key: "folderUrl",
        label: "Link de la carpeta principal",
        placeholder: "https://drive.google.com/drive/folders/1ABC123xyz",
        type: "url",
        hint: "Solo la carpeta principal, no una subcarpeta.",
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
  const [elapsed, setElapsed] = useState(0);

  // Reloj HUD (solo en cliente para evitar errores de hidratación)
  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString("es-CO", { hour12: false }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Cronómetro visible mientras corre un flujo largo
  useEffect(() => {
    if (!submitting) return;
    setElapsed(0);
    const id = setInterval(() => setElapsed((value) => value + 1), 1000);
    return () => clearInterval(id);
  }, [submitting]);

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
      <div className="content">
        <header className="topbar">
          <div className="brand">
            <span className="brand-icon">
              <Terminal size={20} />
            </span>
            <span>
              <span className="brand-name">Equipo de Cargue</span>
              <span className="brand-sub">Centro de automatizaciones</span>
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
            Todos tus flujos,{" "}
            <span className="glow-word">en un solo lugar.</span>
          </h1>
          <p className="hero-copy">
            Selecciona una automatización, completa sus datos y ejecútala sin entrar al editor
            de n8n.
          </p>

          <div className="hero-meta">
            <span className="chip">
              Motor <b>n8n</b>
            </span>
            <span className="chip">
              Módulos <b>{flows.length}</b>
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
                className={`flow-card accent-${flow.accent}`}
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
                  <ArrowRight size={16} />
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

        <p className="footer-note">Equipo de Cargue · Interfaz de control para n8n</p>
      </div>

      {selectedFlow && (
        <div className="modal-backdrop" onMouseDown={closeFlow}>
          <section
            className={`flow-modal accent-${selectedFlow.accent}`}
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

                  {field.type === "select" ? (
                    <select
                      name={field.key}
                      defaultValue={field.defaultValue || field.options?.[0]}
                      required
                    >
                      {(field.options || []).map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      name={field.key}
                      type={field.type || "text"}
                      placeholder={field.placeholder}
                      autoComplete="off"
                      required
                    />
                  )}

                  {field.hint && <small className="field-hint">{field.hint}</small>}
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
