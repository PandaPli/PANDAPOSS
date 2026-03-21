"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, MapPin, ShoppingCart, Package, UtensilsCrossed, Share2, ChevronRight } from "lucide-react";

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
  cartaBg: string | null;
  cartaTagline: string | null;
  cartaSaludo: string | null;
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

/* ─── Global styles ──────────────────────────────────────────────────── */
const GLOBAL_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

  .vercarta-root * { box-sizing: border-box; }
  .vercarta-root { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; }

  /* hide scrollbar on tabs */
  .tabs-scroll { scrollbar-width: none; -ms-overflow-style: none; }
  .tabs-scroll::-webkit-scrollbar { display: none; }

  /* card entrance */
  @keyframes slideUp {
    from { opacity:0; transform: translateY(18px); }
    to   { opacity:1; transform: translateY(0); }
  }
  .card-enter { animation: slideUp 0.38s cubic-bezier(.22,1,.36,1) both; }

  /* hero parallax shimmer */
  @keyframes shimmer {
    0%   { opacity: 0.55; }
    50%  { opacity: 0.75; }
    100% { opacity: 0.55; }
  }
  .hero-overlay { animation: shimmer 4s ease-in-out infinite; }

  /* product image zoom */
  .prod-img { transition: transform 0.4s cubic-bezier(.22,1,.36,1); }
  .prod-card:hover .prod-img { transform: scale(1.06); }
  .prod-card:active { transform: scale(0.99); }

  /* price badge pulse on hover */
  .price-badge { transition: color 0.2s; }
  .prod-card:hover .price-badge { color: #d97706; }
`;

/* ─── Main Component ─────────────────────────────────────────────────── */
export default function VerCartaClient({ branch, categorias, slug }: Props) {
  const [activeCat, setActiveCat] = useState<number>(categorias[0]?.id ?? -1);
  const [heroVisible, setHeroVisible] = useState(true);
  const sectionRefs = useRef<Map<number, HTMLElement>>(new Map());
  const tabsRef = useRef<HTMLDivElement>(null);
  const tabItemRefs = useRef<Map<number, HTMLButtonElement>>(new Map());
  const scrollingRef = useRef(false);
  const heroRef = useRef<HTMLDivElement>(null);

  /* Hero visibility observer (for compact header) */
  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => setHeroVisible(entry.isIntersecting),
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

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
      { rootMargin: "-20% 0px -65% 0px", threshold: 0 }
    );
    sectionRefs.current.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [categorias]);

  /* Auto-scroll the active tab into view */
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
    const OFFSET = 80;
    const y = el.getBoundingClientRect().top + window.scrollY - OFFSET;
    window.scrollTo({ top: y, behavior: "smooth" });
    setTimeout(() => { scrollingRef.current = false; }, 900);
  }, []);

  const simbolo = branch.simbolo ?? "$";

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: GLOBAL_STYLES }} />

      <div className="vercarta-root min-h-screen bg-gray-50">

        {/* ── HERO BANNER ───────────────────────────────────────────── */}
        <div ref={heroRef} className="relative overflow-hidden" style={{ height: 230 }}>

          {/* Background layer */}
          {branch.cartaBg ? (
            <div
              className="absolute inset-0 bg-center bg-cover"
              style={{ backgroundImage: `url(${branch.cartaBg})` }}
            />
          ) : (
            <div
              className="absolute inset-0"
              style={{
                background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 40%, #0f3460 100%)",
              }}
            />
          )}

          {/* Dark overlay */}
          <div
            className="hero-overlay absolute inset-0"
            style={{
              background: "linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.55) 60%, rgba(0,0,0,0.75) 100%)",
            }}
          />

          {/* Decorative amber orb */}
          <div
            className="absolute -bottom-12 -right-12 w-40 h-40 rounded-full blur-3xl opacity-30"
            style={{ background: "radial-gradient(circle, #f59e0b, transparent)" }}
          />

          {/* Back button */}
          <Link
            href="/vercarta"
            className="absolute top-5 left-4 z-20 flex items-center justify-center w-9 h-9 rounded-full transition-all duration-200 active:scale-90"
            style={{
              background: "rgba(255,255,255,0.15)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(255,255,255,0.2)",
            }}
          >
            <ArrowLeft size={16} className="text-white" />
          </Link>

          {/* Center content */}
          <div className="relative z-10 flex flex-col items-center justify-center h-full text-white px-6 pt-2">

            {/* Logo */}
            {branch.logoUrl ? (
              <div
                className="mb-3"
                style={{
                  width: 68, height: 68, borderRadius: 20,
                  overflow: "hidden",
                  border: "2.5px solid rgba(255,255,255,0.35)",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.35)",
                }}
              >
                <img src={branch.logoUrl} alt={branch.nombre} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div
                className="mb-3 flex items-center justify-center text-2xl font-black text-white"
                style={{
                  width: 68, height: 68, borderRadius: 20,
                  background: "linear-gradient(135deg, #f59e0b, #d97706)",
                  border: "2.5px solid rgba(255,255,255,0.3)",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
                }}
              >
                {branch.nombre.charAt(0).toUpperCase()}
              </div>
            )}

            {/* Name */}
            <h1
              className="text-2xl font-black text-center leading-tight"
              style={{ textShadow: "0 2px 12px rgba(0,0,0,0.5)" }}
            >
              {branch.nombre}
            </h1>

            {/* Tagline or address */}
            {branch.cartaTagline ? (
              <p className="mt-1.5 text-sm text-white/75 text-center font-medium max-w-xs">
                {branch.cartaTagline}
              </p>
            ) : branch.direccion ? (
              <p className="mt-1.5 text-xs text-white/65 flex items-center gap-1">
                <MapPin size={10} />
                {branch.direccion}
              </p>
            ) : null}

            {/* Delivery badge */}
            {branch.delivery && (
              <div
                className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
                style={{
                  background: "rgba(245,158,11,0.9)",
                  backdropFilter: "blur(8px)",
                  boxShadow: "0 4px 14px rgba(245,158,11,0.45)",
                }}
              >
                <span>🛵</span>
                <span>Delivery disponible</span>
              </div>
            )}
          </div>
        </div>

        {/* ── STICKY TAB BAR ─────────────────────────────────────────── */}
        <div
          className="sticky top-0 z-50"
          style={{
            background: "rgba(255,255,255,0.95)",
            backdropFilter: "blur(20px) saturate(180%)",
            WebkitBackdropFilter: "blur(20px) saturate(180%)",
            borderBottom: "1px solid rgba(0,0,0,0.06)",
            boxShadow: heroVisible ? "none" : "0 2px 20px rgba(0,0,0,0.08)",
            transition: "box-shadow 0.3s ease",
          }}
        >
          {/* Compact title (only when hero is out of view) */}
          {!heroVisible && (
            <div
              className="mx-auto max-w-2xl px-4 pt-2.5 pb-1 flex items-center gap-2.5"
              style={{ animation: "slideUp 0.25s ease both" }}
            >
              {branch.logoUrl ? (
                <img
                  src={branch.logoUrl}
                  alt={branch.nombre}
                  className="w-7 h-7 rounded-lg object-cover flex-shrink-0"
                  style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.12)" }}
                />
              ) : (
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black text-white flex-shrink-0"
                  style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)" }}
                >
                  {branch.nombre.charAt(0)}
                </div>
              )}
              <span className="font-bold text-gray-900 text-sm truncate">{branch.nombre}</span>
              {branch.delivery && (
                <Link
                  href={`/pedir/${slug}`}
                  className="ml-auto flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold text-white"
                  style={{
                    background: "linear-gradient(135deg, #f59e0b, #d97706)",
                    boxShadow: "0 3px 10px rgba(245,158,11,0.4)",
                  }}
                >
                  <ShoppingCart size={11} />
                  Pedir
                </Link>
              )}
            </div>
          )}

          {/* Category pills */}
          {categorias.length > 1 && (
            <div
              ref={tabsRef}
              className="tabs-scroll mx-auto max-w-2xl px-4 py-2.5 flex gap-2 overflow-x-auto"
            >
              {categorias.map((cat) => {
                const isActive = activeCat === cat.id;
                return (
                  <button
                    key={cat.id}
                    ref={(el) => { if (el) tabItemRefs.current.set(cat.id, el); }}
                    onClick={() => scrollToCategory(cat.id)}
                    className="flex-shrink-0 px-4 py-1.5 rounded-full text-[12px] font-semibold whitespace-nowrap transition-all duration-200 active:scale-95"
                    style={
                      isActive
                        ? {
                            background: "linear-gradient(135deg, #f59e0b, #d97706)",
                            color: "white",
                            boxShadow: "0 4px 12px rgba(245,158,11,0.35)",
                          }
                        : {
                            background: "rgba(0,0,0,0.05)",
                            color: "#6b7280",
                          }
                    }
                  >
                    {cat.nombre}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ── MAIN CONTENT ───────────────────────────────────────────── */}
        <main className="mx-auto max-w-2xl px-4 pt-5 pb-28 space-y-8">

          {/* Saludo banner (if configured) */}
          {branch.cartaSaludo && (
            <div
              className="rounded-2xl px-4 py-3 text-sm text-amber-800 font-medium"
              style={{
                background: "linear-gradient(135deg, #fef3c7, #fde68a)",
                border: "1px solid rgba(245,158,11,0.2)",
              }}
            >
              ✨ {branch.cartaSaludo}
            </div>
          )}

          {categorias.length === 0 ? (
            /* Empty state */
            <div
              className="mt-10 flex flex-col items-center justify-center gap-4 rounded-3xl py-16 px-8 text-center"
              style={{
                background: "white",
                boxShadow: "0 2px 20px rgba(0,0,0,0.06)",
              }}
            >
              <div className="w-16 h-16 rounded-3xl bg-gray-100 flex items-center justify-center">
                <Package size={28} className="text-gray-300" />
              </div>
              <div>
                <p className="font-bold text-gray-700 text-lg">Sin productos disponibles</p>
                <p className="text-sm text-gray-400 mt-1">No hay ítems en el menú en este momento.</p>
              </div>
            </div>
          ) : (
            categorias.map((categoria, catIdx) => (
              <section
                key={categoria.id}
                ref={(el) => { if (el) sectionRefs.current.set(categoria.id, el); }}
                data-cat-id={categoria.id}
                className="scroll-mt-20"
              >
                {/* Category header */}
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="text-[13px] font-black uppercase tracking-[0.14em] text-gray-800">
                    {categoria.nombre}
                  </h2>
                  <div className="flex-1 h-px bg-gray-200" />
                  <span
                    className="text-[11px] font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full"
                  >
                    {categoria.productos.length}
                  </span>
                </div>

                {/* Product cards */}
                <div className="space-y-3">
                  {categoria.productos.map((producto, i) => (
                    <ProductCard
                      key={producto.id}
                      producto={producto}
                      simbolo={simbolo}
                      deliverySlug={branch.delivery ? slug : null}
                      animDelay={catIdx === 0 ? i * 0.05 : 0}
                    />
                  ))}
                </div>
              </section>
            ))
          )}
        </main>

        {/* ── Floating delivery CTA ──────────────────────────────────── */}
        {branch.delivery && (
          <div className="fixed bottom-6 inset-x-0 flex justify-center z-40 pointer-events-none">
            <Link
              href={`/pedir/${slug}`}
              className="pointer-events-auto inline-flex items-center gap-2.5 px-7 py-4 rounded-full font-bold text-white text-sm transition-all duration-200 active:scale-95"
              style={{
                background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                boxShadow: "0 8px 32px rgba(245,158,11,0.5), 0 2px 8px rgba(0,0,0,0.15)",
              }}
            >
              <ShoppingCart size={16} />
              Hacer un pedido
              <ChevronRight size={14} className="opacity-70" />
            </Link>
          </div>
        )}

        {/* ── Radial Social Menu ────────────────────────────────────── */}
        <SocialRadialMenu branch={branch} />
      </div>
    </>
  );
}

/* ─── Product Card ───────────────────────────────────────────────────── */
function ProductCard({
  producto,
  simbolo,
  deliverySlug,
  animDelay,
}: {
  producto: Producto;
  simbolo: string;
  deliverySlug: string | null;
  animDelay: number;
}) {
  return (
    <article
      className="prod-card card-enter flex gap-0 rounded-2xl overflow-hidden transition-all duration-200 cursor-default"
      style={{
        background: "white",
        boxShadow: "0 1px 12px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)",
        animationDelay: `${animDelay}s`,
      }}
    >
      {/* Left: info */}
      <div className="flex-1 min-w-0 flex flex-col justify-between p-4">
        <div>
          <p className="font-bold text-gray-900 leading-snug text-[14.5px]">
            {producto.nombre}
          </p>
          {producto.descripcion && (
            <p className="mt-1.5 text-[12.5px] text-gray-400 line-clamp-2 leading-relaxed">
              {producto.descripcion}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between mt-3">
          {/* Price */}
          <span className="price-badge font-black text-amber-500 text-[16px] tracking-tight">
            {fmt(Number(producto.precio), simbolo)}
          </span>

          {/* Add button */}
          {deliverySlug ? (
            <Link
              href={`/pedir/${deliverySlug}`}
              className="flex items-center justify-center w-8 h-8 rounded-full text-white font-black text-lg transition-all duration-200 active:scale-90 flex-shrink-0"
              style={{
                background: "linear-gradient(135deg, #f59e0b, #d97706)",
                boxShadow: "0 4px 12px rgba(245,158,11,0.4)",
              }}
            >
              +
            </Link>
          ) : (
            <div
              className="flex items-center justify-center w-8 h-8 rounded-full text-white font-black text-lg flex-shrink-0 opacity-30"
              style={{ background: "#d1d5db" }}
            >
              +
            </div>
          )}
        </div>
      </div>

      {/* Right: image */}
      <div
        className="flex-shrink-0 overflow-hidden"
        style={{ width: 110, background: "#f9fafb" }}
      >
        {producto.imagen ? (
          <img
            src={producto.imagen}
            alt={producto.nombre}
            className="prod-img w-full h-full object-cover"
            style={{ minHeight: 110 }}
          />
        ) : (
          <div
            className="w-full flex flex-col items-center justify-center gap-1.5 text-gray-300"
            style={{ minHeight: 110 }}
          >
            <UtensilsCrossed size={22} />
            <span className="text-[9px] font-bold uppercase tracking-widest">foto</span>
          </div>
        )}
      </div>
    </article>
  );
}

/* ─── Social Radial Menu ─────────────────────────────────────────────── */
const SOCIAL_STYLES = `
  @keyframes socialFanOut {
    0%   { opacity:0; transform: scale(0.3) translate(0,0); }
    100% { opacity:1; }
  }
  .social-item-fan {
    animation: socialFanOut 0.3s cubic-bezier(.34,1.56,.64,1) both;
  }
  @keyframes rotateIn {
    from { transform: rotate(0deg) scale(0.8); }
    to   { transform: rotate(405deg) scale(1); }
  }
  @keyframes rotateOut {
    from { transform: rotate(405deg) scale(1); }
    to   { transform: rotate(0deg) scale(1); }
  }
`;

function SocialRadialMenu({ branch }: { branch: Branch }) {
  const [open, setOpen] = useState(false);

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

  const RADIUS = 72;
  const TOTAL  = links.length;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: SOCIAL_STYLES }} />
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" />

      {open && (
        <div className="fixed inset-0 z-[45]" onClick={() => setOpen(false)} />
      )}

      <div
        className="fixed z-50"
        style={{ bottom: branch.delivery ? "92px" : "28px", right: "20px" }}
      >
        {open && links.map((link, i) => {
          const angle = (360 / TOTAL) * i - 90;
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
              className="social-item-fan absolute flex items-center justify-center rounded-full text-white transition-transform duration-150 active:scale-90"
              style={{
                width: 44, height: 44,
                bottom: -22 + y * -1,
                right:  -22 + x * -1,
                background: link.color,
                boxShadow: `0 4px 18px ${link.color}66`,
                animationDelay: `${i * 0.04}s`,
              } as React.CSSProperties}
            >
              <i className={`fab fa-${link.icon} text-[18px]`} />
            </a>
          );
        })}

        <button
          onClick={() => setOpen((v) => !v)}
          className="relative z-10 flex items-center justify-center rounded-full text-white shadow-xl transition-all duration-300 active:scale-90"
          style={{
            width: 50, height: 50,
            background: open
              ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
              : "linear-gradient(135deg, #f59e0b, #d97706)",
            boxShadow: open
              ? "0 8px 28px rgba(99,102,241,0.55)"
              : "0 8px 28px rgba(245,158,11,0.5)",
            transform: open ? "rotate(405deg)" : "rotate(0deg)",
          }}
          aria-label={open ? "Cerrar redes sociales" : "Ver redes sociales"}
        >
          <Share2 size={19} />
        </button>
      </div>
    </>
  );
}
