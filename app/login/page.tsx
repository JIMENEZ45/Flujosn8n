"use client";

import { AlertCircle, LoaderCircle, LogIn, Mail } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";
import { iniciarSesion, type EstadoAuth } from "@/app/auth/acciones";
import CampoPassword from "@/app/campo-password";

const inicial: EstadoAuth = {};

export default function Login() {
  const [estado, accion, pendiente] = useActionState(iniciarSesion, inicial);

  return (
    <main className="auth-shell">
      <aside className="auth-foto">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/equipo.jpg"
          alt="Equipo de Cargue de la Universidad Americana"
          width={1600}
          height={1200}
        />
        <div className="auth-foto-texto">
          <h2>Bienvenido de vuelta.</h2>
          <p>El centro de automatizaciones del Equipo de Cargue.</p>
        </div>
      </aside>

      <section className="auth-card">
        <div className="auth-brand">
          <span className="brand-icon">
            <svg viewBox="0 0 64 64" width="19" height="19" aria-hidden="true">
              <path
                d="M32 6l7.6 15.4 17 2.5-12.3 12 2.9 16.9L32 44.8 16.8 52.8l2.9-16.9-12.3-12 17-2.5z"
                fill="currentColor"
              />
            </svg>
          </span>
          <span>
            <span className="brand-name">Equipo de Cargue</span>
            <span className="brand-sub">Centro de automatizaciones</span>
          </span>
        </div>

        <h1>Iniciar sesión</h1>
        <p className="auth-copy">Entra con tu cuenta para acceder a las automatizaciones.</p>

        <form action={accion} className="flow-form">
          <label>
            <span>Correo</span>
            <span className="input-wrap">
              <span className="input-icon">
                <Mail size={17} />
              </span>
              <input
                name="email"
                type="email"
                placeholder="nombre@americana.edu.co"
                autoComplete="email"
                required
              />
            </span>
          </label>

          <CampoPassword
            name="password"
            label="Contraseña"
            placeholder="Tu contraseña"
            autoComplete="current-password"
          />

          <button className="execute-button" type="submit" disabled={pendiente}>
            {pendiente ? (
              <>
                <LoaderCircle className="spin" size={18} />
                Entrando…
              </>
            ) : (
              <>
                <LogIn size={17} />
                Entrar
              </>
            )}
          </button>

          {estado.error && (
            <p className="auth-error" role="alert">
              <AlertCircle size={16} />
              {estado.error}
            </p>
          )}
        </form>

        <p className="auth-alt">
          ¿No tienes cuenta? <Link href="/registro">Crear una</Link>
        </p>
      </section>
    </main>
  );
}
