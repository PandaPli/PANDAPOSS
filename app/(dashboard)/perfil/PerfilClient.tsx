"use client";

import { useState } from "react";
import { User, Lock, Save, Loader2, CheckCircle2 } from "lucide-react";

interface Props {
  nombre: string;
  usuario: string;
  rol: string;
  email: string | null;
}

export function PerfilClient({ nombre: initialNombre, usuario, rol, email }: Props) {
  const [nombre, setNombre] = useState(initialNombre);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (password && password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }
    if (password && password.length < 4) {
      setError("La contraseña debe tener al menos 4 caracteres");
      return;
    }

    setLoading(true);
    try {
      const body: Record<string, unknown> = { nombre };
      if (password) body.password = password;

      const res = await fetch("/api/perfil", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al guardar");

      setSuccess("Perfil actualizado correctamente");
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="bg-white rounded-2xl border border-surface-border shadow-card overflow-hidden">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-brand-600 to-brand-500 flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
            <span className="text-white text-2xl font-bold">{nombre.charAt(0).toUpperCase()}</span>
          </div>
          <div>
            <h2 className="text-white font-bold text-lg">{nombre}</h2>
            <p className="text-white/70 text-sm">@{usuario}</p>
            {email && <p className="text-white/60 text-xs mt-0.5">{email}</p>}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>
          )}
          {success && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm flex items-center gap-2">
              <CheckCircle2 size={16} /> {success}
            </div>
          )}

          {/* Nombre */}
          <div>
            <label className="label flex items-center gap-1.5">
              <User size={13} className="text-surface-muted" /> Nombre
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
              className="input"
            />
          </div>

          {/* Usuario (readonly) */}
          <div>
            <label className="label">Usuario</label>
            <input
              type="text"
              value={usuario}
              readOnly
              className="input bg-surface-bg text-surface-muted cursor-not-allowed"
            />
            <p className="text-xs text-surface-muted mt-1">El nombre de usuario no se puede cambiar</p>
          </div>

          <hr className="border-surface-border" />

          {/* Contraseña */}
          <div>
            <label className="label flex items-center gap-1.5">
              <Lock size={13} className="text-surface-muted" /> Nueva contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Dejar en blanco para no cambiar"
              className="input"
            />
          </div>

          {password && (
            <div>
              <label className="label">Confirmar contraseña</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repite la nueva contraseña"
                className="input"
              />
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-2.5">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Guardar cambios
          </button>
        </form>
      </div>
    </div>
  );
}
