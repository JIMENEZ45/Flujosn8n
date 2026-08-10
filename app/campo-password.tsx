"use client";

import { Eye, EyeOff, Lock } from "lucide-react";
import { useState } from "react";

type Props = {
  name: string;
  label: string;
  placeholder: string;
  autoComplete: "current-password" | "new-password";
  minLength?: number;
  hint?: string;
};

export default function CampoPassword({
  name,
  label,
  placeholder,
  autoComplete,
  minLength,
  hint,
}: Props) {
  const [visible, setVisible] = useState(false);

  return (
    <label>
      <span>{label}</span>

      <span className="input-wrap">
        <span className="input-icon">
          <Lock size={17} />
        </span>

        <input
          name={name}
          type={visible ? "text" : "password"}
          placeholder={placeholder}
          autoComplete={autoComplete}
          minLength={minLength}
          required
        />

        <button
          type="button"
          className="ver-password"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
          title={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
        >
          {visible ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      </span>

      {hint && <small className="field-hint">{hint}</small>}
    </label>
  );
}
