"use client";

import { useState } from "react";
import { Plus, Minus, ShoppingCart, Loader2, Info } from "lucide-react";

const clp = (n: number) =>
  `$${new Intl.NumberFormat("es-CL", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Math.round(n))}`;

interface ProductoBase {
  id: number;
  nombre: string;
  precio: number | string;
  descripcion: string | null;
  imagen: string | null;
}

interface Categoria {
  id: number;
  nombre: string;
  productos: ProductoBase[];
}

interface CartItem extends ProductoBase {
  cantidad: number;
  notas: string;
}

interface Props {
  sucursalId: number;
  sucursalNombre: string;
  mesaId?: number;
  mesaNombre?: string;
  categorias: Categoria[];
}

export function MenuClient({ sucursalId, sucursalNombre, mesaId, mesaNombre, categorias }: Props) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isOrdering, setIsOrdering] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [clienteNombre, setClienteNombre] = useState("");
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [errorObj, setErrorObj] = useState<string | null>(null);

  const cartTotal = cart.reduce((acc, item) => acc + (Number(item.precio) * item.cantidad), 0);
  const cartCount = cart.reduce((acc, item) => acc + item.cantidad, 0);

  function addItem(prod: ProductoBase) {
    setCart((prev) => {
      const exist = prev.find((p) => p.id === prod.id);
      if (exist) {
        return prev.map((p) => p.id === prod.id ? { ...p, cantidad: p.cantidad + 1 } : p);
      }
      return [...prev, { ...prod, cantidad: 1, notas: "" }];
    });
  }

  function removeItem(prodId: number) {
    setCart((prev) => {
      const exist = prev.find((p) => p.id === prodId);
      if (!exist) return prev;
      if (exist.cantidad === 1) return prev.filter((p) => p.id !== prodId);
      return prev.map((p) => p.id === prodId ? { ...p, cantidad: p.cantidad - 1 } : p);
    });
  }

  function updateNotes(prodId: number, notas: string) {
    setCart((prev) => prev.map((p) => p.id === prodId ? { ...p, notas } : p));
  }

  async function submitOrder() {
    if (cart.length === 0 || !mesaId) return;

    setIsOrdering(true);
    setErrorObj(null);

    try {
      const r = await fetch("/api/public/pedidos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sucursalId,
          mesaId,
          items: cart.map(item => ({
             productoId: item.id,
             cantidad: item.cantidad,
             precio: Number(item.precio),
             notas: item.notas
          })),
          clienteInfo: { nombre: clienteNombre }
        }),
      });

      if (!r.ok) {
        const d = await r.json();
        throw new Error(d.error || "Ocurrió un error al enviar el pedido");
      }

      setCart([]);
      setShowCart(false);
      setOrderSuccess(true);
    } catch (error) {
      setErrorObj(error instanceof Error ? error.message : "Error desconocido");
    } finally {
      setIsOrdering(false);
    }
  }

  if (orderSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full text-center space-y-4">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-2">
            <svg className="w-8 h-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900">¡Pedido Enviado!</h2>
          <p className="text-gray-500 text-sm">
            La cocina ya está preparando tu orden. Pronto será llevada a tu mesa.
          </p>
          <button 
            onClick={() => setOrderSuccess(false)}
            className="w-full mt-4 bg-indigo-600 text-white font-bold rounded-xl py-3 hover:bg-indigo-700 transition"
          >
            Hacer otro pedido
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50 pb-24">
        {/* Header */}
        <header className="bg-white shadow-sm sticky top-0 z-10">
          <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-gray-900">{sucursalNombre}</h1>
              {mesaNombre ? (
                <p className="text-sm text-gray-500">Mesa: <span className="font-semibold">{mesaNombre}</span></p>
              ) : (
                <p className="text-sm text-amber-500 flex items-center gap-1 mt-0.5 font-medium"><Info size={14}/> Solo lectura (Falta QR de mesa)</p>
              )}
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-md">
              <span className="text-white font-bold text-sm tracking-widest">{sucursalNombre.substring(0,2).toUpperCase()}</span>
            </div>
          </div>
        </header>

        {/* Categories */}
        <main className="max-w-2xl mx-auto px-4 py-6 space-y-8">
          {categorias.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p className="text-lg font-medium">El menú está en actualización</p>
            </div>
          ) : (
            categorias.map((cat) => (
              <section key={cat.id}>
                <h2 className="text-base font-bold text-gray-800 mb-3 pb-2 border-b border-gray-200">
                  {cat.nombre}
                </h2>
                <div className="space-y-3">
                  {cat.productos.map((prod) => {
                    const cartItem = cart.find(p => p.id === prod.id);
                    const qty = cartItem?.cantidad || 0;
                    
                    return (
                      <div key={prod.id} className="bg-white rounded-xl shadow-sm overflow-hidden flex flex-col sm:flex-row gap-4 p-4 border border-transparent hover:border-indigo-100 transition-colors">
                        {/* Img/Text Wrapper */}
                        <div className="flex gap-4 flex-1">
                          {prod.imagen ? (
                            <img src={prod.imagen} alt={prod.nombre} className="w-20 h-20 rounded-lg object-cover bg-gray-100 shrink-0" />
                          ) : (
                            <div className="w-20 h-20 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                               <span className="text-gray-300 text-xs text-center font-medium leading-tight">Sin<br/>Foto</span>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-gray-900 leading-tight">{prod.nombre}</p>
                            {prod.descripcion && (
                              <p className="text-xs text-gray-500 mt-1 line-clamp-2">{prod.descripcion}</p>
                            )}
                            <p className="text-indigo-600 font-bold mt-2">
                              {clp(Number(prod.precio))}
                            </p>
                          </div>
                        </div>
                        
                        {/* Action Buttons (Only enabled if Mesa exists) */}
                        <div className="flex items-center sm:justify-end gap-3 mt-2 sm:mt-0 opacity-100">
                           {mesaId ? (
                              <>
                                {qty > 0 ? (
                                  <div className="flex items-center gap-3 bg-indigo-50 px-2 py-1.5 rounded-xl border border-indigo-100">
                                    <button onClick={() => removeItem(prod.id)} className="w-8 h-8 flex items-center justify-center text-indigo-700 bg-white rounded-lg shadow-sm font-bold active:scale-95 transition-transform"><Minus size={16}/></button>
                                    <span className="w-4 text-center font-bold text-indigo-900">{qty}</span>
                                    <button onClick={() => addItem(prod)} className="w-8 h-8 flex items-center justify-center text-indigo-700 bg-white rounded-lg shadow-sm font-bold active:scale-95 transition-transform"><Plus size={16}/></button>
                                  </div>
                                ) : (
                                  <button 
                                    onClick={() => addItem(prod)}
                                    className="px-4 py-2 bg-gray-100/80 hover:bg-indigo-50 text-gray-700 hover:text-indigo-700 font-bold rounded-xl text-sm transition-colors"
                                  >
                                    Agregar
                                  </button>
                                )}
                              </>
                           ) : (
                              <div className="text-xs text-gray-400 font-medium px-2">—</div>
                           )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))
          )}
        </main>

        <footer className="text-center py-6 pb-20 text-xs text-gray-400">
          Carta digital — {sucursalNombre}
        </footer>
      </div>

      {/* Sticky Bottom Cart Bar */}
      {cartCount > 0 && mesaId && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.1)] z-40 animate-in slide-in-from-bottom-full pb-safe">
          <div className="max-w-2xl mx-auto px-4 py-3 pb-8 sm:pb-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium">Total Pedido</p>
              <p className="font-bold text-gray-900 text-lg">{clp(cartTotal)}</p>
            </div>
            <button 
              onClick={() => setShowCart(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-sm transition-transform active:scale-95"
            >
              <ShoppingCart size={18} />
              Revisar ({cartCount})
            </button>
          </div>
        </div>
      )}

      {/* Cart Checkout Modal / Tray */}
      {showCart && (
        <div className="fixed inset-0 z-50 flex justify-end flex-col animate-in fade-in duration-200">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCart(false)}></div>
          
          {/* Drawer */}
          <div className="relative bg-white w-full h-[85vh] sm:h-[90vh] sm:max-w-md sm:mx-auto sm:rounded-t-3xl rounded-t-3xl shadow-2xl flex flex-col pt-2 animate-in slide-in-from-bottom-full duration-300">
            {/* Handle/Notch */}
            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto my-2 shrink-0"></div>
            
            {/* Header */}
            <div className="px-5 pb-3 pt-2 flex items-center justify-between border-b border-gray-100 shrink-0">
               <div>
                  <h2 className="font-bold text-gray-900 text-xl">Tu Orden</h2>
                  <p className="text-xs text-indigo-600 font-medium">Mesa {mesaNombre}</p>
               </div>
               <button onClick={() => setShowCart(false)} className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full text-gray-600 hover:bg-gray-200">
                 <XIcon />
               </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
               <div className="space-y-4">
                 {cart.map((item) => (
                   <div key={item.id} className="flex gap-3">
                     <span className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold bg-indigo-100 text-indigo-700 shrink-0">
                       {item.cantidad}x
                     </span>
                     <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm">{item.nombre}</p>
                        <p className="text-gray-500 text-sm font-semibold">{clp(Number(item.precio))}</p>
                        <div className="mt-2">
                           <input 
                             type="text" 
                             placeholder="¿Alguna instrucción extra? (Ej: Sin cebolla)"
                             value={item.notas}
                             onChange={(e) => updateNotes(item.id, e.target.value)}
                             className="w-full text-xs bg-gray-50 border-gray-200 rounded-md focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 p-1.5"
                           />
                        </div>
                     </div>
                     <div className="flex flex-col gap-1 items-end shrink-0 pt-0.5">
                       <button onClick={() => addItem(item)} className="p-1 text-gray-400 hover:text-indigo-600 bg-gray-50 rounded"><Plus size={14}/></button>
                       <button onClick={() => removeItem(item.id)} className="p-1 text-gray-400 hover:text-red-600 bg-gray-50 rounded"><Minus size={14}/></button>
                     </div>
                   </div>
                 ))}
               </div>

               <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                 <label className="block text-xs font-bold text-amber-900 mb-1">Nombre (Opcional)</label>
                 <input 
                   type="text" 
                   placeholder="¿Cómo te llamas?" 
                   value={clienteNombre}
                   onChange={e => setClienteNombre(e.target.value)}
                   className="w-full bg-white border-amber-200 text-sm rounded-lg p-2 focus:ring-amber-500 focus:border-amber-500 placeholder-amber-300"
                 />
                 <p className="text-[10px] text-amber-700 mt-1">Para que el mesero sepa a quién entregarle.</p>
               </div>

               {errorObj && (
                 <div className="p-3 bg-red-50 text-red-600 text-xs font-bold rounded-lg border border-red-100">
                   {errorObj}
                 </div>
               )}
            </div>

            {/* Footer Checkout */}
            <div className="shrink-0 p-5 bg-white border-t border-gray-100 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)] pb-safe">
               <div className="flex justify-between items-end mb-4 px-1">
                 <span className="text-gray-500 font-medium">Total a pagar:</span>
                 <span className="text-2xl font-black text-gray-900">{clp(cartTotal)}</span>
               </div>
               <button 
                 onClick={submitOrder}
                 disabled={isOrdering}
                 className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-lg py-4 rounded-xl shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 disabled:opacity-75 relative overflow-hidden transition-all"
               >
                 {isOrdering ? (
                   <Loader2 size={24} className="animate-spin" />
                 ) : (
                   <>Enviar Pedido a Cocina</>
                 )}
               </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function XIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6L6 18M6 6l12 12"/>
    </svg>
  );
}
