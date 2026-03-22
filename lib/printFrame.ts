/**
 * printFrame — imprime HTML usando un iframe invisible en el documento principal.
 * Evita el popup window que en Chrome/Linux cierra el diálogo antes de que
 * el usuario pueda elegir impresora.
 */
export function printFrame(html: string): void {
  const iframe = document.createElement("iframe");
  iframe.style.cssText =
    "position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;border:none;pointer-events:none;";
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument!;
  doc.open();
  doc.write(html);
  doc.close();

  setTimeout(() => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    // Limpiar el iframe después de que el diálogo se cierre
    setTimeout(() => {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
    }, 2000);
  }, 400);
}
