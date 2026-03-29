"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, XCircle, ScanLine, RefreshCw } from "lucide-react";

interface ValidarResult {
  ok: boolean;
  ticket?: {
    id: number;
    clienteNombre: string;
    clienteEmail: string;
    estado: string;
    usosRealizados: number;
    usosMax: number;
  };
  evento?: { nombre: string };
  error?: string;
}

interface Props {
  eventoId: number;
}

export function ValidarClient({ eventoId }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ValidarResult | null>(null);
  const [processing, setProcessing] = useState(false);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const readerRef = useRef<{ stop?: () => void } | null>(null);
  // Use refs to avoid stale closures in the QR scanner callback
  const processingRef = useRef(false);
  const lastScannedRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (readerRef.current?.stop) readerRef.current.stop();
    };
  }, []);

  async function startScanner() {
    setScanning(true);
    setResult(null);
    setLastScanned(null);
    processingRef.current = false;
    lastScannedRef.current = null;

    try {
      const { BrowserQRCodeReader } = await import("@zxing/browser");
      const reader = new BrowserQRCodeReader();
      readerRef.current = reader as { stop?: () => void };

      reader.decodeFromVideoDevice(undefined, videoRef.current!, async (res, _err) => {
        if (res && !processingRef.current) {
          const token = res.getText();
          if (token === lastScannedRef.current) return;
          lastScannedRef.current = token;
          setLastScanned(token);
          processingRef.current = true;
          setProcessing(true);

          try {
            const response = await fetch(
              `/api/eventos/tickets/${encodeURIComponent(token)}/validar`,
              { method: "POST" }
            );
            const data = await response.json();
            setResult(data);
          } catch {
            setResult({ ok: false, error: "Error de conexión" });
          } finally {
            processingRef.current = false;
            setProcessing(false);
          }
        }
      });
    } catch {
      setResult({ ok: false, error: "No se pudo iniciar la cámara" });
      setScanning(false);
    }
  }

  function resetScan() {
    setResult(null);
    setLastScanned(null);
    setProcessing(false);
    processingRef.current = false;
    lastScannedRef.current = null;
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-slate-900 p-4">
      {/* Header */}
      <div className="mb-6 flex w-full max-w-sm items-center gap-3">
        <Link
          href={`/eventos/${eventoId}`}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="font-bold text-white">Escanear Tickets</h1>
          <p className="text-xs text-white/50">Apunta la cámara al QR del ticket</p>
        </div>
      </div>

      {/* Scanner area */}
      <div className="w-full max-w-sm">
        {!scanning ? (
          <div className="flex flex-col items-center gap-6">
            <div className="flex h-64 w-64 items-center justify-center rounded-2xl bg-white/5 border-2 border-dashed border-white/20">
              <ScanLine size={64} className="text-white/30" />
            </div>
            <button
              onClick={startScanner}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-violet-600 py-4 text-lg font-bold text-white shadow-lg hover:bg-violet-700 transition-colors"
            >
              <ScanLine size={20} />
              Iniciar Escáner
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative overflow-hidden rounded-2xl bg-black">
              <video ref={videoRef} className="w-full" autoPlay muted playsInline />
              {/* Scanning overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-48 w-48 rounded-2xl border-2 border-violet-400 shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]" />
              </div>
              {processing && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent" />
                </div>
              )}
            </div>

            {/* Result */}
            {result && (
              <div className={`rounded-2xl p-5 text-center ${result.ok ? "bg-emerald-900/80 border border-emerald-500/50" : "bg-red-900/80 border border-red-500/50"}`}>
                {result.ok ? (
                  <>
                    <CheckCircle2 size={48} className="mx-auto text-emerald-400" />
                    <p className="mt-3 text-xl font-bold text-white">
                      {result.ticket?.clienteNombre}
                    </p>
                    {result.evento && (
                      <p className="mt-1 text-sm text-emerald-200">{result.evento.nombre}</p>
                    )}
                    {result.ticket && (
                      <p className="mt-1 text-xs text-emerald-300">
                        Uso {result.ticket.usosRealizados}/{result.ticket.usosMax}
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    <XCircle size={48} className="mx-auto text-red-400" />
                    <p className="mt-3 text-lg font-bold text-white">Error</p>
                    <p className="mt-1 text-sm text-red-200">{result.error}</p>
                  </>
                )}
                <button
                  onClick={resetScan}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-white/20 py-2.5 text-sm font-bold text-white hover:bg-white/30 transition-colors"
                >
                  <RefreshCw size={14} />
                  Escanear otro
                </button>
              </div>
            )}

            {!result && (
              <p className="text-center text-sm text-white/50">
                {processing ? "Verificando..." : "Apunta al código QR del ticket..."}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
