"use client";

import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { X, ZoomIn, ZoomOut, Check, RotateCcw } from "lucide-react";

interface Area {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Props {
  imageSrc: string;
  onConfirm: (blob: Blob) => void;
  onCancel: () => void;
  aspect?: number; // default 1 (cuadrado)
}

async function getCroppedImg(imageSrc: string, pixelCrop: Area): Promise<Blob> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.addEventListener("load", () => resolve(img));
    img.addEventListener("error", reject);
    img.src = imageSrc;
  });

  const canvas = document.createElement("canvas");
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  const ctx = canvas.getContext("2d")!;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Canvas vacío"));
    }, "image/webp", 0.92);
  });
}

export default function ImageCropModal({
  imageSrc,
  onConfirm,
  onCancel,
  aspect = 1,
}: Props) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [loading, setLoading] = useState(false);

  const onCropComplete = useCallback((_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  async function handleConfirm() {
    if (!croppedAreaPixels) return;
    setLoading(true);
    try {
      const blob = await getCroppedImg(imageSrc, croppedAreaPixels);
      onConfirm(blob);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4">
      <div className="flex w-full max-w-sm flex-col gap-4 rounded-2xl bg-white p-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-stone-900">Ajustar foto</h3>
          <button
            onClick={onCancel}
            className="rounded-full p-1.5 hover:bg-stone-100 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Cropper */}
        <div className="relative h-72 w-full overflow-hidden rounded-xl bg-stone-900">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            showGrid={false}
            style={{
              containerStyle: { borderRadius: "0.75rem" },
            }}
          />
        </div>

        {/* Zoom slider */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setZoom((z) => Math.max(1, z - 0.2))}
            className="rounded-full p-1.5 hover:bg-stone-100 transition"
          >
            <ZoomOut size={16} className="text-stone-600" />
          </button>
          <input
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-stone-200 accent-violet-600"
          />
          <button
            onClick={() => setZoom((z) => Math.min(3, z + 0.2))}
            className="rounded-full p-1.5 hover:bg-stone-100 transition"
          >
            <ZoomIn size={16} className="text-stone-600" />
          </button>
          <button
            onClick={() => { setZoom(1); setCrop({ x: 0, y: 0 }); }}
            className="rounded-full p-1.5 hover:bg-stone-100 transition"
            title="Resetear"
          >
            <RotateCcw size={15} className="text-stone-500" />
          </button>
        </div>

        {/* Hint */}
        <p className="text-center text-xs text-stone-400">
          Arrastra para mover · Pellizca o usa el slider para zoom
        </p>

        {/* Buttons */}
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 rounded-xl border border-stone-200 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50 transition"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-violet-600 py-2.5 text-sm font-bold text-white hover:bg-violet-700 disabled:opacity-60 transition"
          >
            {loading ? (
              <span className="animate-pulse">Procesando...</span>
            ) : (
              <><Check size={16} /> Confirmar</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
