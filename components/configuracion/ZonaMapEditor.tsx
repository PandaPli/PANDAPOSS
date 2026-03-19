"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Trash2, Loader2 } from "lucide-react";

interface ZonaDelivery {
  id: number;
  nombre: string;
  precio: number;
  polygon?: { lat: number; lng: number }[];
}

interface Props {
  zonas: ZonaDelivery[];
  onChange: (zonas: ZonaDelivery[]) => void;
  apiKey: string;
  defaultCenter?: { lat: number; lng: number };
}

const POLYGON_COLORS = ["#f97316", "#3b82f6", "#22c55e", "#a855f7", "#ef4444", "#06b6d4"];

declare global {
  interface Window {
    google: typeof google;
    _googleMapsDrawingLoaded?: boolean;
    _googleMapsDrawingCallbacks?: (() => void)[];
  }
}

function loadGoogleMapsDrawing(apiKey: string, callback: () => void) {
  if (window._googleMapsDrawingLoaded) {
    callback();
    return;
  }
  if (!window._googleMapsDrawingCallbacks) {
    window._googleMapsDrawingCallbacks = [];
  }
  window._googleMapsDrawingCallbacks.push(callback);

  // Avoid adding the script more than once
  if (document.querySelector('script[data-gm-drawing]')) return;

  const script = document.createElement("script");
  script.setAttribute("data-gm-drawing", "true");
  script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=drawing&language=es&region=CL`;
  script.async = true;
  script.defer = true;
  script.onload = () => {
    window._googleMapsDrawingLoaded = true;
    (window._googleMapsDrawingCallbacks ?? []).forEach((cb) => cb());
    window._googleMapsDrawingCallbacks = [];
  };
  document.head.appendChild(script);
}

export default function ZonaMapEditor({ zonas, onChange, apiKey, defaultCenter }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const drawingManagerRef = useRef<google.maps.drawing.DrawingManager | null>(null);
  const polygonRefs = useRef<Map<number, google.maps.Polygon>>(new Map());

  const [loaded, setLoaded] = useState(false);
  const [pendingPolygon, setPendingPolygon] = useState<google.maps.Polygon | null>(null);
  const [pendingForm, setPendingForm] = useState<{ nombre: string; precio: string }>({ nombre: "", precio: "" });

  const center = defaultCenter ?? { lat: -33.4489, lng: -70.6693 };

  // Draw existing zones on map
  const renderExistingPolygons = useCallback(
    (map: google.maps.Map, currentZonas: ZonaDelivery[]) => {
      // Remove old polygon overlays
      polygonRefs.current.forEach((p) => p.setMap(null));
      polygonRefs.current.clear();

      currentZonas.forEach((zona, idx) => {
        if (!zona.polygon?.length) return;
        const color = POLYGON_COLORS[idx % POLYGON_COLORS.length];
        const poly = new google.maps.Polygon({
          paths: zona.polygon,
          strokeColor: color,
          strokeOpacity: 0.9,
          strokeWeight: 2,
          fillColor: color,
          fillOpacity: 0.2,
          map,
        });
        polygonRefs.current.set(zona.id, poly);
      });
    },
    []
  );

  useEffect(() => {
    if (!apiKey) return;
    loadGoogleMapsDrawing(apiKey, () => setLoaded(true));
  }, [apiKey]);

  useEffect(() => {
    if (!loaded || !mapRef.current || mapInstanceRef.current) return;

    const map = new google.maps.Map(mapRef.current, {
      center,
      zoom: 13,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    });
    mapInstanceRef.current = map;

    const dm = new google.maps.drawing.DrawingManager({
      drawingMode: google.maps.drawing.OverlayType.POLYGON,
      drawingControl: true,
      drawingControlOptions: {
        position: google.maps.ControlPosition.TOP_CENTER,
        drawingModes: [google.maps.drawing.OverlayType.POLYGON],
      },
      polygonOptions: {
        strokeColor: "#f97316",
        strokeOpacity: 0.9,
        strokeWeight: 2,
        fillColor: "#f97316",
        fillOpacity: 0.25,
        editable: true,
      },
    });
    dm.setMap(map);
    drawingManagerRef.current = dm;

    google.maps.event.addListener(dm, "polygoncomplete", (polygon: google.maps.Polygon) => {
      // Switch back to non-drawing mode
      dm.setDrawingMode(null);
      setPendingPolygon(polygon);
      setPendingForm({ nombre: "", precio: "" });
    });

    renderExistingPolygons(map, zonas);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);

  // Re-render polygons when zonas change (but map already initialized)
  useEffect(() => {
    if (!mapInstanceRef.current || !loaded) return;
    renderExistingPolygons(mapInstanceRef.current, zonas);
  }, [zonas, loaded, renderExistingPolygons]);

  function getPolygonCoords(polygon: google.maps.Polygon): { lat: number; lng: number }[] {
    const path = polygon.getPath();
    const coords: { lat: number; lng: number }[] = [];
    path.forEach((latLng) => {
      coords.push({ lat: latLng.lat(), lng: latLng.lng() });
    });
    return coords;
  }

  function handleConfirmZona() {
    if (!pendingPolygon) return;
    const nombre = pendingForm.nombre.trim();
    const precio = Number(pendingForm.precio);
    if (!nombre || !precio || precio <= 0) return;

    const coords = getPolygonCoords(pendingPolygon);
    // Remove the temporary polygon (it will be re-rendered via zonas state)
    pendingPolygon.setMap(null);

    const nuevaZona: ZonaDelivery = {
      id: Date.now(),
      nombre,
      precio,
      polygon: coords,
    };
    const nuevasZonas = [...zonas, nuevaZona];
    onChange(nuevasZonas);
    setPendingPolygon(null);
    setPendingForm({ nombre: "", precio: "" });

    // Re-enable drawing mode
    drawingManagerRef.current?.setDrawingMode(google.maps.drawing.OverlayType.POLYGON);
  }

  function handleCancelPending() {
    if (pendingPolygon) {
      pendingPolygon.setMap(null);
    }
    setPendingPolygon(null);
    setPendingForm({ nombre: "", precio: "" });
    drawingManagerRef.current?.setDrawingMode(google.maps.drawing.OverlayType.POLYGON);
  }

  function handleDeleteZona(id: number) {
    const poly = polygonRefs.current.get(id);
    if (poly) poly.setMap(null);
    polygonRefs.current.delete(id);
    const nuevasZonas = zonas.filter((z) => z.id !== id);
    onChange(nuevasZonas);
  }

  if (!apiKey) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
        No se encontro la clave de Google Maps (NEXT_PUBLIC_GOOGLE_MAPS_API_KEY).
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Map container */}
      <div className="relative overflow-hidden rounded-xl border border-surface-border" style={{ height: 380 }}>
        {!loaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-surface-bg">
            <Loader2 size={28} className="animate-spin text-brand-600" />
          </div>
        )}
        <div ref={mapRef} className="h-full w-full" />
      </div>

      {/* Pending polygon form */}
      {pendingPolygon && (
        <div className="rounded-xl border border-brand-200 bg-brand-50 p-4 space-y-3">
          <p className="text-sm font-semibold text-surface-text">Zona dibujada — asignale un nombre y precio</p>
          <div className="flex gap-2">
            <input
              className="input flex-1"
              placeholder="Nombre de zona (ej: Centro)"
              value={pendingForm.nombre}
              onChange={(e) => setPendingForm((f) => ({ ...f, nombre: e.target.value }))}
              onKeyDown={(e) => e.key === "Enter" && handleConfirmZona()}
              autoFocus
            />
            <input
              className="input w-32"
              type="number"
              placeholder="Precio"
              min={0}
              value={pendingForm.precio}
              onChange={(e) => setPendingForm((f) => ({ ...f, precio: e.target.value }))}
              onKeyDown={(e) => e.key === "Enter" && handleConfirmZona()}
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleConfirmZona}
              disabled={!pendingForm.nombre.trim() || !pendingForm.precio || Number(pendingForm.precio) <= 0}
              className="btn-primary"
            >
              Guardar zona
            </button>
            <button type="button" onClick={handleCancelPending} className="btn-secondary">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Zone list */}
      <div className="space-y-2">
        {zonas.length === 0 && (
          <p className="text-sm text-surface-muted italic">
            Sin zonas con polygon. Dibuja un polygono en el mapa para agregar una zona geografica.
          </p>
        )}
        {zonas.map((zona, idx) => {
          const color = POLYGON_COLORS[idx % POLYGON_COLORS.length];
          return (
            <div
              key={zona.id}
              className="flex items-center justify-between rounded-lg border border-surface-border bg-surface-bg px-4 py-2.5"
            >
              <div className="flex items-center gap-2">
                {zona.polygon?.length ? (
                  <span
                    className="inline-block h-3 w-3 rounded-full border border-white/40 shadow-sm"
                    style={{ background: color }}
                  />
                ) : null}
                <span className="text-sm font-semibold text-surface-text">{zona.nombre}</span>
                <span className="ml-1 text-sm text-surface-muted">${zona.precio.toLocaleString("es-CL")}</span>
                {zona.polygon?.length ? (
                  <span className="ml-1 rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-bold text-brand-700">
                    📍 Polygon
                  </span>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => handleDeleteZona(zona.id)}
                className="text-red-500 hover:text-red-700 transition-colors p-1 rounded"
              >
                <Trash2 size={15} />
              </button>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-surface-muted">
        Dibuja un polygono en el mapa haciendo clic para agregar puntos. Cierra el polygono haciendo doble clic o conectando con el primer punto.
      </p>
    </div>
  );
}
