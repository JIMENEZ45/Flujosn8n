"use client";

import {
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
  Check,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileJson,
  FileSpreadsheet,
  FileText,
  Folder,
  FolderDown,
  LayoutTemplate,
  LoaderCircle,
  Play,
  RotateCcw,
  Search,
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
  const folderName =
    typeof result?.data?.folderName === "string" ? (result.data.folderName as string) : null;
  const fileName =
    typeof result?.data?.fileName === "string" ? (result.data.fileName as string) : null;
  const expiresIn =
    typeof result?.data?.expiresInMinutes === "number"
      ? (result.data.expiresInMinutes as number)
      : null;

  return (
    <main className="page-shell">
      <div className="content">
        <header className="topbar">
          <div className="brand">
            <span className="brand-icon">
              <svg viewBox="0 0 64 64" width="18" height="18" aria-hidden="true">
                <path
                  d="M12 40.5 C 20 44.5, 30 41, 38.5 33 C 45 26.5, 49 20.5, 52 15.5 C 49.5 24, 45.5 32.5, 38 39.5 C 30 47, 20 49, 12 45.5 Z"
                  fill="currentColor"
                />
              </svg>
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
          <p className="eyebrow">Americana · Automatizaciones</p>
          <h1>
            Equipo de Cargue,{" "}
            <span className="glow-word">el mejor del bloque.</span>
          </h1>
          <p className="hero-copy">
            Todos nuestros flujos en un solo lugar. Selecciona una automatización, completa sus
            datos y ejecútala sin entrar al editor de n8n.
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

            {!result && (
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
            )}

            {result && (
              <div
                className={`result-box ${result.ok === false ? "result-error" : "result-success"}`}
                role="status"
              >
                <div className="result-hero">
                  <span className="result-hero-icon">
                    {result.ok === false ? <AlertCircle size={22} /> : <Check size={22} />}
                  </span>

                  <div className="result-hero-text">
                    <h3>{result.ok === false ? "Error de ejecución" : "Proceso completado"}</h3>
                    <p>{result.message || "La automatización terminó correctamente."}</p>
                  </div>

                  <svg className="result-art" viewBox="0 0 96 80" aria-hidden="true">
                    <circle cx="10" cy="26" r="2.5" />
                    <circle cx="86" cy="58" r="2" />
                    <path d="M18 12v5M15.5 14.5h5" strokeWidth="2" strokeLinecap="round" />
                    <path d="M84 18v5M81.5 20.5h5" strokeWidth="2" strokeLinecap="round" />
                    <rect
                      x="30"
                      y="22"
                      width="42"
                      height="36"
                      rx="7"
                      fill="none"
                      strokeWidth="2.5"
                    />
                    <path
                      d="M30 29a7 7 0 0 1 7-7h9l4 5h15a7 7 0 0 1 7 7"
                      fill="none"
                      strokeWidth="2.5"
                    />
                    <path
                      d="M43 40.5l5.5 5.5L59 35"
                      fill="none"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>

                {(totalTests !== null || folderName || fileName || expiresIn !== null) && (
                  <div className="result-body">
                    <h4>Resumen del proceso</h4>

                    <ul className="result-rows">
                      {totalTests !== null && (
                        <li>
                          <span className="row-icon">
                            <FileText size={15} />
                          </span>
                          <span className="row-label">Archivos generados</span>
                          <span className="row-value">{totalTests}</span>
                        </li>
                      )}

                      {folderName && (
                        <li>
                          <span className="row-icon">
                            <Folder size={15} />
                          </span>
                          <span className="row-label">Carpeta</span>
                          <span className="row-value">{folderName}</span>
                        </li>
                      )}

                      {fileName && (
                        <li>
                          <span className="row-icon">
                            <FileText size={15} />
                          </span>
                          <span className="row-label">Archivo</span>
                          <span className="row-value">{fileName}</span>
                        </li>
                      )}

                      {expiresIn !== null && (
                        <li>
                          <span className="row-icon">
                            <Clock size={15} />
                          </span>
                          <span className="row-label">Se elimina en</span>
                          <span className="row-value">{expiresIn} minutos</span>
                        </li>
                      )}
                    </ul>
                  </div>
                )}

                <div className="result-actions">
                  {folderUrl && (
                    <a
                      className="result-action"
                      href={folderUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <ExternalLink size={16} />
                      Abrir en Google Drive
                    </a>
                  )}

                  <button
                    type="button"
                    className="result-again"
                    onClick={() => setResult(null)}
                  >
                    <RotateCcw size={15} />
                    Ejecutar de nuevo
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
