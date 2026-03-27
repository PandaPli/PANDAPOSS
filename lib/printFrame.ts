/**
 * printFrame — imprime HTML en una ventana popup.
 * Chrome NO aplica @page size a iframes (siempre hereda A4 del parent).
 * Con popup window SÍ respeta @page { size: 80mm Xmm } con alto explícito.
 *
 * SOLUCIÓN AL ESPACIO EN BLANCO:
 * Después del render, medimos body.scrollHeight y lo inyectamos en @page size
 * para que el alto de página sea exactamente el del contenido (sin espacio extra).
 */
export function printFrame(html: string): void {
  // Estilos base: solo ancho, el alto se inyecta dinámicamente tras medir
  const baseStyle = `<meta name="viewport" content="width=302px, initial-scale=1.0"/>
  <style>
    html, body {
      width: 80mm !important;
      margin: 0 !important;
      padding: 0 !important;
      overflow: hidden !important;
      -webkit-text-size-adjust: none !important;
      text-size-adjust: none !important;
    }
  </style>`;

  const htmlWithStyle = html.includes("</head>")
    ? html.replace("</head>", `${baseStyle}</head>`)
    : baseStyle + html;

  const popup = window.open(
    "",
    "_blank",
    "width=302,height=800,scrollbars=no,toolbar=no,menubar=no,location=no,status=no"
  );

  if (!popup) {
    // Fallback al iframe si el popup fue bloqueado
    _printViaIframe(htmlWithStyle);
    return;
  }

  popup.document.open();
  popup.document.write(htmlWithStyle);
  popup.document.close();

  const doPrint = () => {
    try {
      // Medir alto real del contenido (px → mm: 1px = 0.2646mm a 96dpi)
      const body = popup.document.body;
      const scrollH = body ? body.scrollHeight : 400;
      const heightMm = Math.ceil(scrollH * 0.2646) + 8; // +8mm margen inferior mínimo

      // Inyectar @page con alto exacto al contenido
      const pageStyle = popup.document.createElement("style");
      pageStyle.textContent = [
        `@page {`,
        `  size: 80mm ${heightMm}mm !important;`,
        `  margin: 0 !important;`,
        `}`,
        `@media print {`,
        `  @page { size: 80mm ${heightMm}mm !important; margin: 0 !important; }`,
        `  html, body {`,
        `    height: ${heightMm}mm !important;`,
        `    max-height: ${heightMm}mm !important;`,
        `    overflow: hidden !important;`,
        `  }`,
        `}`,
      ].join("\n");
      popup.document.head.appendChild(pageStyle);
    } catch {
      /* si falla la medición igual intentamos imprimir */
    }

    popup.focus();
    popup.print();

    // Cerrar popup después de que el usuario descarte el diálogo
    setTimeout(() => {
      try { popup.close(); } catch { /* ignorar */ }
    }, 4000);
  };

  // Esperar render + imágenes antes de medir y imprimir
  const imgs = popup.document.images;
  if (imgs.length === 0) {
    // Sin imágenes: esperar 500ms para que el browser termine el layout
    setTimeout(doPrint, 500);
  } else {
    let loaded = 0;
    const onLoad = () => {
      loaded++;
      if (loaded >= imgs.length) setTimeout(doPrint, 200);
    };
    Array.from(imgs).forEach((img) => {
      if (img.complete) onLoad();
      else {
        img.onload = onLoad;
        img.onerror = onLoad;
      }
    });
    setTimeout(doPrint, 1500); // fallback máximo
  }
}

/** Fallback iframe (si popups bloqueados) */
function _printViaIframe(html: string): void {
  const iframe = document.createElement("iframe");
  iframe.style.cssText =
    "position:fixed;left:-9999px;top:0;width:302px;height:600px;border:none;opacity:0;pointer-events:none;";
  document.body.appendChild(iframe);
  const doc = iframe.contentDocument!;
  doc.open();
  doc.write(html);
  doc.close();
  setTimeout(() => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    setTimeout(() => {
      if (document.body.contains(iframe)) document.body.removeChild(iframe);
    }, 3000);
  }, 500);
}
