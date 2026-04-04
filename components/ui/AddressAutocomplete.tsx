"use client";

import { useEffect, useRef, useState } from "react";
import { setOptions, importLibrary } from "@googlemaps/js-api-loader";
import { MapPin, Loader2 } from "lucide-react";

interface AddressResult {
  direccion: string;
  lat: number | null;
  lng: number | null;
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  onSelect: (result: AddressResult) => void;
  placeholder?: string;
  className?: string;
}

const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

export default function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = "Dirección de entrega",
  className = "",
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const onChangeRef = useRef(onChange);
  const onSelectRef = useRef(onSelect);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  // Mantener refs actualizadas sin re-crear el Autocomplete
  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);
  useEffect(() => { onSelectRef.current = onSelect; }, [onSelect]);

  // Google Places manipula el valor del input directamente.
  // Sincronizamos el DOM con el estado externo sin volverlo controlado.
  useEffect(() => {
    if (!inputRef.current) return;
    if (inputRef.current.value !== value) {
      inputRef.current.value = value;
    }
  }, [value]);

  // Cargar librería Google Places una sola vez
  useEffect(() => {
    if (!apiKey) return;
    setOptions({ key: apiKey, v: "weekly", language: "es", region: "CL" });
    importLibrary("places")
      .then(() => setLoaded(true))
      .catch(() => setError(true));
  }, []);

  // Crear Autocomplete una sola vez cuando la librería está lista
  useEffect(() => {
    if (!loaded || !inputRef.current || autocompleteRef.current) return;

    autocompleteRef.current = new google.maps.places.Autocomplete(
      inputRef.current,
      {
        types: ["address"],
        componentRestrictions: { country: "cl" },
        fields: ["formatted_address", "geometry"],
      }
    );

    autocompleteRef.current.addListener("place_changed", () => {
      const place = autocompleteRef.current!.getPlace();
      const formatted = place.formatted_address ?? "";
      const lat = place.geometry?.location?.lat() ?? null;
      const lng = place.geometry?.location?.lng() ?? null;
      onChangeRef.current(formatted);
      onSelectRef.current({ direccion: formatted, lat, lng });
    });
  }, [loaded]);

  return (
    <div className="relative">
      <MapPin
        size={16}
        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-stone-400"
      />
      <input
        ref={inputRef}
        type="text"
        defaultValue={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        className={`w-full rounded-2xl border border-stone-200 bg-white py-3 pl-11 pr-10 text-sm outline-none transition focus:border-amber-400 ${className}`}
      />
      {apiKey && !loaded && !error && (
        <Loader2
          size={14}
          className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-stone-300"
        />
      )}
    </div>
  );
}
