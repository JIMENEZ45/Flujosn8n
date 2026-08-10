"use client";

import { AlertCircle, CheckCircle2, LoaderCircle, Mail, User, UserPlus } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";
import { crearCuenta, type EstadoAuth } from "@/app/auth/acciones";
import CampoPassword from "@/app/campo-password";

const inicial: EstadoAuth = {};

export default function Registro() {
  const [estado, accion, pendiente] = useActionState(crearCuenta, inicial);

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
          <h2>Únete al equipo.</h2>
          <p>Crea tu cuenta para empezar a usar las automatizaciones.</p>
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

        <h1>Crear cuenta</h1>
        <p className="auth-copy">Regístrate para poder ejecutar las automatizaciones.</p>

        <form action={accion} className="flow-form">
          <label>
            <span>Nombre</span>
            <span className="input-wrap">
              <span className="input-icon">
                <User size={17} />
              </span>
              <input name="nombre" type="text" placeholder="Tu nombre" autoComplete="name" required />
            </span>
          </label>

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
            placeholder="Mínimo 8 caracteres"
            autoComplete="new-password"
            minLength={8}
            hint="Se guarda cifrada. Ni nosotros podemos verla."
          />

          <CampoPassword
            name="confirmar"
            label="Repetir contraseña"
            placeholder="Vuelve a escribirla"
            autoComplete="new-password"
            minLength={8}
          />

          <button className="execute-button" type="submit" disabled={pendiente}>
            {pendiente ? (
              <>
                <LoaderCircle className="spin" size={18} />
                Creando…
              </>
            ) : (
              <>
                <UserPlus size={17} />
                Crear cuenta
              </>
            )}
          </button>

          {estado.error && (
            <p className="auth-error" role="alert">
              <AlertCircle size={16} />
              {estado.error}
            </p>
          )}

          {estado.aviso && (
            <p className="auth-ok" role="status">
              <CheckCircle2 size={16} />
              {estado.aviso}
            </p>
          )}
        </form>

        <p className="auth-alt">
          ¿Ya tienes cuenta? <Link href="/login">Iniciar sesión</Link>
        </p>
      </section>
    </main>
  );
}
