"use client";

import { useState } from "react";
import { Lock, Check, X } from "lucide-react";

interface Props {
  sucursalId: number;
  currentPin: string | null;
}

export function KioskPinConfig({ sucursalId, currentPin }: Props) {
  const [pin, setPin] = useState(currentPin ?? "");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch(`/api/sucursales/${sucursalId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kioskPin: pin || null }),
      });
      if (res.ok) {
        setSaved(true);
        setEditing(false);
        setTimeout(() => setSaved(false), 2000);
      }
    } finally {
      setSaving(false);
    }
  }

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="flex items-center gap-2 w-full rounded-xl border border-surface-border px-3 py-2.5 text-sm hover:bg-surface-hover transition-all"
      >
        <Lock size={14} className="text-surface-muted" />
        <span className="text-surface-muted">PIN:</span>
        <span className="font-mono font-bold text-surface-text">
          {pin || "0000"}
        </span>
        {!pin && <span className="text-xs text-surface-muted">(default)</span>}
        {saved && <Check size={14} className="ml-auto text-emerald-500" />}
        {!saved && <span className="ml-auto text-xs text-brand-600 font-semibold">Editar</span>}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-xl border border-brand-300 bg-brand-50/30 px-3 py-2">
      <Lock size={14} className="text-brand-600 shrink-0" />
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={4}
        value={pin}
        onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
        placeholder="0000"
        autoFocus
        className="w-16 bg-transparent font-mono font-bold text-sm text-surface-text outline-none placeholder:text-surface-muted/50 tracking-widest"
      />
      <div className="ml-auto flex items-center gap-1">
        <button
          onClick={save}
          disabled={saving || pin.length !== 4}
          className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-brand-700 disabled:opacity-40 transition-all"
        >
          {saving ? "..." : "Guardar"}
        </button>
        <button
          onClick={() => { setPin(currentPin ?? ""); setEditing(false); }}
          className="rounded-lg p-1.5 text-surface-muted hover:bg-surface-hover transition-all"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
