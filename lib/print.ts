/**
 * Shared thermal print utilities — 80mm receipt format
 */

export const THERMAL_CSS = `
  *{margin:0;padding:0;box-sizing:border-box;}
  @page{size:80mm auto;margin:0;}
  body{font-family:'Courier New',monospace;font-size:12px;width:80mm;padding:8px 10px 24px;color:#000;background:#fff;}
  .ticket{width:100%;}
  .hdr{text-align:center;margin-bottom:8px;}
  .logo{width:56px;height:56px;object-fit:contain;display:block;margin:0 auto 4px;}
  .type{font-size:13px;font-weight:bold;text-transform:uppercase;letter-spacing:2px;margin-top:2px;}
  .num{font-size:11px;margin-top:1px;}
  .cut{border:none;border-top:1px dashed #000;margin:6px 0;}
  .cut2{border:none;border-top:2px solid #000;margin:6px 0;}
  .meta{font-size:12px;}
  .row{display:flex;justify-content:space-between;gap:8px;padding:1px 0;font-size:12px;}
  .item{padding:3px 0;}
  .iname{font-size:12px;font-weight:bold;}
  .idetail{display:flex;justify-content:space-between;font-size:11px;margin-top:1px;}
  .total{font-size:15px;font-weight:bold;padding:4px 0;}
  .sec-title{text-align:center;font-size:11px;font-weight:bold;text-transform:uppercase;letter-spacing:1px;margin-bottom:3px;}
  .footer{margin-top:14px;text-align:center;font-size:11px;}
  .footer-sub{text-align:center;font-size:10px;margin-top:2px;}
`;

export function openPrintWindow(title: string, bodyHtml: string) {
  const win = window.open("", "_blank", "width=360,height=820");
  if (!win) return;
  win.document.write(
    `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${title}</title><style>${THERMAL_CSS}</style></head><body>${bodyHtml}</body></html>`
  );
  win.document.close();
  win.focus();
  win.print();
  win.close();
}
