/**
 * printFrame — imprime HTML usando un iframe oculto fuera de pantalla.
 * El iframe tiene tamaño real (320×600px) pero está posicionado fuera del
 * viewport (left: -9999px) para que el contenido se renderice correctamente
 * antes de llamar a print(). Esto evita el popup window que en Chrome/Linux
 * cierra el diálogo sin permitir elegir impresora.
 */
export function printFrame(html: string): void {
  const iframe = document.createElement("iframe");
  // Tamaño real pero fuera del viewport — el contenido se renderiza correctamente
  // 302px = ~80mm a 96dpi — ancho real de papel térmico
  iframe.style.cssText =
    "position:fixed;left:-9999px;top:0;width:302px;height:800px;border:none;visibility:hidden;";
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument!;
  doc.open();
  doc.write(html);
  doc.close();

  // Esperar a que imágenes y estilos carguen antes de imprimir
  const tryPrint = () => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    // Limpiar el iframe 3 segundos después (tiempo suficiente para que el diálogo aparezca)
    setTimeout(() => {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
    }, 3000);
  };

  const imgs = doc.images;
  if (imgs.length === 0) {
    setTimeout(tryPrint, 500);
  } else {
    let loaded = 0;
    const onLoad = () => {
      loaded++;
      if (loaded >= imgs.length) tryPrint();
    };
    Array.from(imgs).forEach((img) => {
      if ((img as HTMLImageElement).complete) onLoad();
      else {
        (img as HTMLImageElement).onload = onLoad;
        (img as HTMLImageElement).onerror = onLoad;
      }
    });
    // Fallback: imprimir igual después de 1.5s si las imágenes no cargan
    setTimeout(tryPrint, 1500);
  }
}
