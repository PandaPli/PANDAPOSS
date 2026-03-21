"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, MapPin, ShoppingBag, Package, UtensilsCrossed, Share2 } from "lucide-react";

/* ─── Types ─────────────────────────────────────────────────────────── */
interface Producto {
  id: number;
  nombre: string;
  descripcion: string | null;
  precio: number;
  imagen: string | null;
}
interface Categoria {
  id: number;
  nombre: string;
  productos: Producto[];
}
interface Branch {
  id: number;
  nombre: string;
  direccion: string | null;
  logoUrl: string | null;
  simbolo: string | null;
  delivery: boolean;
  socialFacebook: string | null;
  socialInstagram: string | null;
  socialWhatsapp: string | null;
  socialYoutube: string | null;
  socialTiktok: string | null;
  socialTwitter: string | null;
}
interface Props {
  branch: Branch;
  categorias: Categoria[];
  slug: string;
}

/* ─── Helpers ────────────────────────────────────────────────────────── */
function fmt(price: number, simbolo: string) {
  return `${simbolo}${price.toLocaleString("es-CL")}`;
}

/* ─── Main Component ─────────────────────────────────────────────────── */
export default function VerCartaClient({ branch, categorias, slug }: Props) {
  const [activeCat, setActiveCat] = useState<number>(categorias[0]?.id ?? -1);
  const sectionRefs = useRef<Map<number, HTMLElement>>(new Map());
  const tabsRef = useRef<HTMLDivElement>(null);
  const tabItemRefs = useRef<Map<number, HTMLButtonElement>>(new Map());
  const scrollingRef = useRef(false);

  /* Scrollspy via IntersectionObserver */
  useEffect(() => {
    if (categorias.length <= 1) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (scrollingRef.current) return;
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = Number(entry.target.getAttribute("data-cat-id"));
            if (id) setActiveCat(id);
          }
        });
      },
      { rootMargin: "-30% 0px -60% 0px", threshold: 0 }
    );

    sectionRefs.current.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [categorias]);

  /* Auto-scroll the active tab pill into view */
  useEffect(() => {
    const btn = tabItemRefs.current.get(activeCat);
    if (btn && tabsRef.current) {
      btn.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }, [activeCat]);

  const scrollToCategory = useCallback((id: number) => {
    const el = sectionRefs.current.get(id);
    if (!el) return;
    setActiveCat(id);
    scrollingRef.current = true;
    const OFFSET = 132;
    const y = el.getBoundingClientRect().top + window.scrollY - OFFSET;
    window.scrollTo({ top: y, behavior: "smooth" });
    setTimeout(() => { scrollingRef.current = false; }, 800);
  }, []);

  const simbolo = branch.simbolo ?? "$";

  return (
    <div
      className="min-h-screen"
      style={{ background: "linear-gradient(160deg, #f5f7fa 0%, #eef0f5 100%)" }}
    >

      {/* ── Sticky Header ────────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-50"
        style={{
          background: "rgba(245,247,250,0.82)",
          backdropFilter: "blur(24px) saturate(200%)",
          WebkitBackdropFilter: "blur(24px) saturate(200%)",
          borderBottom: "1px solid rgba(255,255,255,0.7)",
          boxShadow: "0 2px 24px rgba(0,0,0,0.07)",
        }}
      >
        {/* Row 1: nav */}
        <div className="mx-auto max-w-2xl px-4 pt-3 pb-2.5 flex items-center gap-3">

          {/* Back */}
          <Link
            href="/vercarta"
            className="flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-2xl transition-all duration-200 hover:scale-105 active:scale-95"
            style={{ background: "rgba(0,0,0,0.07)" }}
          >
            <ArrowLeft size={17} className="text-gray-600" />
          </Link>

          {/* Logo */}
          {branch.logoUrl ? (
            <div
              className="flex-shrink-0 w-10 h-10 rounded-2xl overflow-hidden"
              style={{
                boxShadow: "0 2px 12px rgba(0,0,0,0.12)",
                border: "2px solid rgba(255,255,255,0.9)",
              }}
            >
              <img
                src={branch.logoUrl}
                alt={branch.nombre}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div
              className="flex-shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center text-base font-black text-white"
              style={{ background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)" }}
            >
              {branch.nombre.charAt(0).toUpperCase()}
            </div>
          )}

          {/* Name + address */}
          <div className="flex-1 min-w-0">
            <p className="font-extrabold text-gray-900 leading-tight truncate text-[15px]">
              {branch.nombre}
            </p>
            {branch.direccion && (
              <p className="text-[11px] text-gray-400 truncate flex items-center gap-1 mt-0.5">
                <MapPin size={9} />
                {branch.direccion}
              </p>
            )}
          </div>

          {/* Delivery CTA */}
          {branch.delivery && (
            <Link
              href={`/pedir/${slug}`}
              className="flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold text-white transition-all duration-200 hover:scale-105 hover:brightness-110 active:scale-95"
              style={{
                background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                boxShadow: "0 4px 14px rgba(245,158,11,0.38)",
              }}
            >
              <ShoppingBag size={13} />
              Pedir
            </Link>
          )}
        </div>

        {/* Row 2: category tabs */}
        {categorias.length > 1 && (
          <div
            ref={tabsRef}
            className="mx-auto max-w-2xl px-4 pb-3 flex gap-2 overflow-x-auto"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {categorias.map((cat) => {
              const isActive = activeCat === cat.id;
              return (
                <button
                  key={cat.id}
                  ref={(el) => { if (el) tabItemRefs.current.set(cat.id, el); }}
                  onClick={() => scrollToCategory(cat.id)}
                  className="flex-shrink-0 px-4 py-1.5 rounded-full text-[11px] font-bold transition-all duration-200 whitespace-nowrap"
                  style={
                    isActive
                      ? {
                          background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                          color: "white",
                          boxShadow: "0 4px 14px rgba(245,158,11,0.38)",
                          transform: "scale(1.04)",
                        }
                      : {
                          background: "rgba(0,0,0,0.06)",
                          color: "#9ca3af",
                        }
                  }
                >
                  {cat.nombre}
                </button>
              );
            })}
          </div>
        )}
      </header>

      {/* ── Main content ─────────────────────────────────────────────── */}
      <main className="mx-auto max-w-2xl px-4 pt-6 pb-24 space-y-10">

        {categorias.length === 0 ? (
          /* Empty state */
          <div
            className="mt-12 flex flex-col items-center justify-center gap-4 rounded-3xl py-16 px-8 text-center"
            style={{
              background: "rgba(255,255,255,0.65)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(255,255,255,0.85)",
              boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
            }}
          >
            <div
              className="flex items-center justify-center w-16 h-16 rounded-3xl"
              style={{ background: "linear-gradient(135deg, #f3f4f6, #e5e7eb)" }}
            >
              <Package size={30} className="text-gray-400" />
            </div>
            <div>
              <p className="font-bold text-gray-700 text-lg">Sin productos disponibles</p>
              <p className="text-sm text-gray-400 mt-1">No hay items en el menú en este momento.</p>
            </div>
          </div>
        ) : (
          categorias.map((categoria) => (
            <section
              key={categoria.id}
              ref={(el) => { if (el) sectionRefs.current.set(categoria.id, el); }}
              data-cat-id={categoria.id}
              className="scroll-mt-36"
            >
              {/* Category header */}
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full"
                  style={{ background: "rgba(245,158,11,0.12)" }}
                >
                  <UtensilsCrossed size={11} className="text-amber-500" />
                  <span className="text-[11px] font-black uppercase tracking-[0.18em] text-amber-600">
                    {categoria.nombre}
                  </span>
                </div>
                <div
                  className="flex-1 h-px"
                  style={{
                    background:
                      "linear-gradient(to right, rgba(245,158,11,0.2), transparent)",
                  }}
                />
              </div>

              {/* Product cards */}
              <div className="space-y-3">
                {categoria.productos.map((producto) => (
                  <ProductCard
                    key={producto.id}
                    producto={producto}
                    simbolo={simbolo}
                    deliverySlug={branch.delivery ? slug : null}
                  />
                ))}
              </div>
            </section>
          ))
        )}
      </main>

      {/* ── Floating delivery button (mobile) ───────────────────────── */}
      {branch.delivery && (
        <div className="fixed bottom-6 inset-x-0 flex justify-center z-40 pointer-events-none">
          <Link
            href={`/pedir/${slug}`}
            className="pointer-events-auto inline-flex items-center gap-2 px-6 py-3.5 rounded-full font-bold text-white text-sm transition-all duration-200 hover:scale-105 hover:brightness-110 active:scale-95"
            style={{
              background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
              boxShadow: "0 8px 32px rgba(245,158,11,0.45)",
            }}
          >
            <ShoppingBag size={16} />
            Hacer un pedido
          </Link>
        </div>
      )}

      {/* ── Radial Social Menu ─────────────────────────────────────── */}
      <SocialRadialMenu branch={branch} />
    </div>
  );
}

/* ─── Social Radial Menu ─────────────────────────────────────────────── */
const SOCIAL_STYLES = `
  @keyframes socialPop {
    0%   { opacity:0; transform: rotate(calc(360deg / var(--total) * var(--i))) scale(0.2); }
    100% { opacity:1; transform: rotate(calc(360deg / var(--total) * var(--i))) scale(1); }
  }
  .social-item-active {
    animation: socialPop 0.35s cubic-bezier(.34,1.56,.64,1) both;
    animation-delay: calc(0.04s * var(--i));
  }
  .social-toggle-spin { transform: rotate(405deg) !important; }
`;

function SocialRadialMenu({ branch }: { branch: Branch }) {
  const [open, setOpen] = useState(false);

  // Construir links dinámicos solo con los que tienen valor
  const links: { href: string; icon: string; color: string; label: string }[] = [];

  if (branch.socialWhatsapp) {
    const num = branch.socialWhatsapp.replace(/\D/g, "");
    links.push({ href: `https://wa.me/${num}`, icon: "whatsapp", color: "#25D366", label: "WhatsApp" });
  }
  if (branch.socialInstagram) {
    links.push({ href: branch.socialInstagram, icon: "instagram", color: "#E1306C", label: "Instagram" });
  }
  if (branch.socialFacebook) {
    links.push({ href: branch.socialFacebook, icon: "facebook-f", color: "#1877F2", label: "Facebook" });
  }
  if (branch.socialTiktok) {
    links.push({ href: branch.socialTiktok, icon: "tiktok", color: "#010101", label: "TikTok" });
  }
  if (branch.socialYoutube) {
    links.push({ href: branch.socialYoutube, icon: "youtube", color: "#FF0000", label: "YouTube" });
  }
  if (branch.socialTwitter) {
    links.push({ href: branch.socialTwitter, icon: "x-twitter", color: "#14171A", label: "X / Twitter" });
  }

  if (links.length === 0) return null;

  const RADIUS = 72;          // px desde el centro hasta cada ícono
  const TOTAL  = links.length;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: SOCIAL_STYLES }} />
      {/* Font Awesome CDN — solo carga si este componente monta */}
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css"
      />

      {/* Overlay para cerrar al tocar fuera */}
      {open && (
        <div
          className="fixed inset-0 z-[45]"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Contenedor fijo bottom-right */}
      <div
        className="fixed z-50"
        style={{ bottom: branch.delivery ? "88px" : "24px", right: "20px" }}
      >
        {/* Íconos radiales */}
        {open && links.map((link, i) => {
          const angle = (360 / TOTAL) * i - 90; // empezar desde arriba
          const rad   = (angle * Math.PI) / 180;
          const x     = Math.cos(rad) * RADIUS;
          const y     = Math.sin(rad) * RADIUS;

          return (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              title={link.label}
              className="social-item-active absolute flex items-center justify-center rounded-full text-white shadow-lg transition-transform duration-200 hover:scale-110 active:scale-95"
              style={{
                "--i": i,
                "--total": TOTAL,
                width: 44,
                height: 44,
                bottom: -22 + y * -1,   // invertir Y (CSS y hacia abajo)
                right:  -22 + x * -1,
                background: link.color,
                boxShadow: `0 4px 16px ${link.color}55`,
              } as React.CSSProperties}
            >
              <i className={`fab fa-${link.icon} text-[18px]`} />
            </a>
          );
        })}

        {/* Botón toggle central */}
        <button
          onClick={() => setOpen((v) => !v)}
          className="relative z-10 flex items-center justify-center w-13 h-13 rounded-full text-white shadow-xl transition-all duration-500 hover:scale-110 active:scale-95"
          style={{
            width: 52,
            height: 52,
            background: open
              ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
              : "linear-gradient(135deg, #f59e0b, #d97706)",
            boxShadow: open
              ? "0 8px 28px rgba(99,102,241,0.5)"
              : "0 8px 28px rgba(245,158,11,0.45)",
            transform: open ? "rotate(405deg)" : "rotate(0deg)",
          }}
          aria-label={open ? "Cerrar redes sociales" : "Ver redes sociales"}
        >
          <Share2 size={20} />
        </button>
      </div>
    </>
  );
}

/* ─── Product Card ───────────────────────────────────────────────────── */
function ProductCard({
  producto,
  simbolo,
  deliverySlug,
}: {
  producto: Producto;
  simbolo: string;
  deliverySlug: string | null;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <article
      className="flex gap-3.5 p-3.5 rounded-[1.4rem] transition-all duration-200 cursor-default"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered
          ? "rgba(255,255,255,0.92)"
          : "rgba(255,255,255,0.72)",
        backdropFilter: "blur(16px) saturate(180%)",
        WebkitBackdropFilter: "blur(16px) saturate(180%)",
        border: hovered
          ? "1px solid rgba(245,158,11,0.25)"
          : "1px solid rgba(255,255,255,0.88)",
        boxShadow: hovered
          ? "0 12px 36px rgba(0,0,0,0.11)"
          : "0 2px 16px rgba(0,0,0,0.05)",
        transform: hovered ? "translateY(-2px)" : "translateY(0)",
      }}
    >
      {/* Image */}
      {producto.imagen ? (
        <img
          src={producto.imagen}
          alt={producto.nombre}
          className="w-[78px] h-[78px] rounded-[1rem] object-cover flex-shrink-0"
          style={{ boxShadow: "0 4px 14px rgba(0,0,0,0.1)" }}
        />
      ) : (
        <div
          className="w-[78px] h-[78px] rounded-[1rem] flex-shrink-0 flex flex-col items-center justify-center gap-1"
          style={{
            background: "linear-gradient(135deg, #f3f4f6 0%, #e9ecf0 100%)",
          }}
        >
          <UtensilsCrossed size={18} className="text-gray-300" />
          <span className="text-[8px] font-bold uppercase tracking-widest text-gray-300">
            foto
          </span>
        </div>
      )}

      {/* Info */}
      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
        <div>
          <p className="font-bold text-gray-900 leading-snug text-[14px]">
            {producto.nombre}
          </p>
          {producto.descripcion && (
            <p className="mt-1 text-[12px] text-gray-400 line-clamp-2 leading-relaxed">
              {producto.descripcion}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between mt-2.5">
          {/* Price */}
          <span className="font-black text-gray-900 text-[15px] tracking-tight">
            {fmt(Number(producto.precio), simbolo)}
          </span>

          {/* Add button */}
          {deliverySlug ? (
            <Link
              href={`/pedir/${deliverySlug}`}
              className="w-8 h-8 rounded-full flex items-center justify-center text-white font-black text-lg transition-all duration-200 hover:scale-110 hover:brightness-110 active:scale-95 flex-shrink-0"
              style={{
                background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                boxShadow: "0 4px 14px rgba(245,158,11,0.38)",
              }}
            >
              +
            </Link>
          ) : (
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white font-black text-lg flex-shrink-0 opacity-40"
              style={{ background: "linear-gradient(135deg, #9ca3af, #6b7280)" }}
            >
              +
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
