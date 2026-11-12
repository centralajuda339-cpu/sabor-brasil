"use client";

import { useState } from "react";
import { Eye, EyeSlash } from "react-bootstrap-icons";
import { campo, rotulo } from "./estilos";

// Campo de palavra-passe com botão de mostrar/ocultar (ícone de olho).
export default function CampoSenha({
  id,
  name,
  label,
  autoComplete = "current-password",
  required = false,
}: {
  id: string;
  name: string;
  label: string;
  autoComplete?: string;
  required?: boolean;
}) {
  const [visivel, setVisivel] = useState(false);

  return (
    <div>
      <label htmlFor={id} className={rotulo}>
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          name={name}
          type={visivel ? "text" : "password"}
          autoComplete={autoComplete}
          required={required}
          className={`${campo} pr-10`}
        />
        <button
          type="button"
          onClick={() => setVisivel(!visivel)}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-marca-escura"
          aria-label={
            visivel ? "Ocultar palavra-passe" : "Mostrar palavra-passe"
          }
          tabIndex={-1}
        >
          {visivel ? (
            <EyeSlash size={18} aria-hidden />
          ) : (
            <Eye size={18} aria-hidden />
          )}
        </button>
      </div>
    </div>
  );
}
