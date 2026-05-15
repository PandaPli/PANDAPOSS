"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, ImageIcon, CheckCircle2, AlertCircle, Loader2, X, ExternalLink } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface Props {
  currentUrl?: string | null;
}

export function HomeEditorModule({ currentUrl }: Props) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentUrl ?? null);
  const [uploading, setUploading]   = useState(false);
  const [status, setStatus]         = useState<"idle" | "ok" | "error">("idle");
  const [msg, setMsg]               = useState("");
  const [dragging, setDragging]     = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    if (!file) return;
    if (!["image/jpeg","image/png","image/webp"].includes(file.type)) {
      setStatus("error"); setMsg("Solo JPG, PNG o WEBP"); return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setStatus("error"); setMsg("Máximo 8 MB"); return;
    }

    setUploading(true); setStatus("idle"); setMsg("");

    try {
      // 1. Subir imagen a Vercel Blob
      const fd = new FormData();
      fd.append("file", file);
      const upRes = await fetch("/api/upload?tipo=fondo", { method:"POST", body:fd });
      if (!upRes.ok) throw new Error((await upRes.json()).error ?? "Error al subir");
      const { url } = await upRes.json() as { url: string };

      // 2. Guardar URL en configuración
      const cfgRes = await fetch("/api/configuracion", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ homePreviewUrl: url }),
      });
      if (!cfgRes.ok) throw new Error("Error al guardar configuración");

      setPreviewUrl(url);
      setStatus("ok");
      setMsg("Imagen actualizada correctamente");
    } catch (e) {
      setStatus("error");
      setMsg(e instanceof Error ? e.message : "Error inesperado");
    } finally {
      setUploading(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleRemove = async () => {
    setUploading(true);
    try {
      await fetch("/api/configuracion", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ homePreviewUrl: null }),
      });
      setPreviewUrl(null);
      setStatus("ok");
      setMsg("Imagen eliminada");
    } catch {
      setStatus("error"); setMsg("Error al eliminar");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="card p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-indigo-100 rounded-xl flex items-center justify-center shrink-0">
            <ImageIcon size={15} className="text-indigo-600" />
          </div>
          <div>
            <h3 className="text-sm font-black text-surface-text leading-none">Editor Home</h3>
            <p className="text-[10px] text-surface-muted mt-0.5">Imagen de preview del sistema</p>
          </div>
        </div>
        <Link
          href="/home"
          target="_blank"
          className="flex items-center gap-1 text-xs text-brand-600 hover:underline font-semibold"
        >
          Ver Home <ExternalLink size={11} />
        </Link>
      </div>

      {/* Preview actual */}
      {previewUrl ? (
        <div className="relative rounded-xl overflow-hidden border border-surface-border group">
          <div className="relative w-full aspect-video bg-slate-900">
            <Image
              src={previewUrl}
              alt="Preview Home"
              fill
              className="object-cover"
              unoptimized
            />
          </div>
          {/* Overlay hover */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
            <button
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-1.5 bg-white text-slate-800 text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors"
            >
              <Upload size={12} /> Cambiar
            </button>
            <button
              onClick={handleRemove}
              disabled={uploading}
              className="flex items-center gap-1.5 bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-red-600 transition-colors"
            >
              <X size={12} /> Quitar
            </button>
          </div>
        </div>
      ) : (
        /* Drop zone */
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={`
            relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed
            cursor-pointer transition-all py-10 px-6 text-center
            ${dragging
              ? "border-indigo-400 bg-indigo-50"
              : "border-surface-border bg-surface-bg hover:border-indigo-300 hover:bg-indigo-50/40"
            }
          `}
        >
          {uploading ? (
            <Loader2 size={28} className="text-indigo-500 animate-spin" />
          ) : (
            <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center">
              <Upload size={22} className="text-indigo-600" />
            </div>
          )}
          <div>
            <p className="text-sm font-bold text-surface-text">
              {dragging ? "Suelta la imagen aquí" : "Sube la imagen de preview"}
            </p>
            <p className="text-xs text-surface-muted mt-1">
              JPG, PNG o WEBP · máximo 8 MB
            </p>
          </div>
        </div>
      )}

      {/* Input oculto */}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
      />

      {/* Cargando encima del preview */}
      {uploading && previewUrl && (
        <div className="flex items-center gap-2 text-xs text-indigo-600 font-semibold">
          <Loader2 size={13} className="animate-spin" /> Subiendo imagen…
        </div>
      )}

      {/* Feedback */}
      {status === "ok" && (
        <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
          <CheckCircle2 size={13} /> {msg}
        </div>
      )}
      {status === "error" && (
        <div className="flex items-center gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          <AlertCircle size={13} /> {msg}
        </div>
      )}

      <p className="text-[10px] text-surface-muted">
        La imagen aparece en la sección &quot;Ve el sistema en acción&quot; de la página de inicio pública.
      </p>
    </div>
  );
}
