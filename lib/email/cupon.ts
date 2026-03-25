import { Resend } from "resend";

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY no configurada");
  return new Resend(key);
}

interface EnviarCuponOpts {
  to: string;
  nombre: string;
  codigoCumple: string;
  sucursalNombre: string;
  sucursalId: number;
}

export async function enviarCuponCumpleanos({
  to,
  nombre,
  codigoCumple,
  sucursalNombre,
  sucursalId,
}: EnviarCuponOpts) {
  const primerNombre = nombre.split(" ")[0];
  const cuponUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://pandaposs.com"}/registro/${sucursalId}`;

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Tu cupón de cumpleaños 🎂</title>
</head>
<body style="margin:0;padding:0;background:#fef3c7;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:480px;margin:0 auto;padding:24px 16px;">

    <!-- Header -->
    <div style="text-align:center;padding:32px 0 16px;">
      <div style="font-size:56px;line-height:1;">🎂</div>
      <h1 style="margin:12px 0 4px;font-size:28px;font-weight:900;color:#1f2937;">
        ¡Feliz Cumpleaños,<br />${primerNombre}!
      </h1>
      <p style="margin:0;color:#6b7280;font-size:15px;">
        Un regalo especial de <strong>${sucursalNombre}</strong>
      </p>
    </div>

    <!-- Cupón -->
    <div style="background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.08);margin:16px 0;">
      <!-- Franja superior -->
      <div style="background:linear-gradient(135deg,#f59e0b,#ea580c);padding:20px;text-align:center;">
        <p style="margin:0;color:rgba(255,255,255,0.9);font-size:13px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;">
          🎁 Cupón de Regalo
        </p>
        <div style="color:#fff;font-size:52px;font-weight:900;line-height:1;margin:8px 0 4px;">30%</div>
        <p style="margin:0;color:rgba(255,255,255,0.95);font-size:18px;font-weight:700;">DE DESCUENTO</p>
        <p style="margin:6px 0 0;color:rgba(255,255,255,0.8);font-size:12px;">Válido el día de tu cumpleaños</p>
        <p style="margin:4px 0 0;color:rgba(255,255,255,0.7);font-size:11px;">Tope máximo $15.000</p>
      </div>

      <!-- Código -->
      <div style="padding:24px;text-align:center;">
        <p style="margin:0 0 10px;font-size:12px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.1em;font-weight:600;">
          Tu código personal
        </p>
        <div style="background:#111827;color:#fff;border-radius:12px;padding:16px 24px;display:inline-block;letter-spacing:0.2em;font-family:monospace;font-size:22px;font-weight:700;">
          ${codigoCumple}
        </div>
        <p style="margin:12px 0 0;font-size:12px;color:#9ca3af;">
          ✓ Código de uso único · Solo válido el día de tu cumpleaños
        </p>
      </div>

      <!-- Divisor perforado -->
      <div style="border-top:2px dashed #e5e7eb;margin:0 16px;"></div>

      <!-- Instrucciones -->
      <div style="padding:16px 24px 24px;text-align:center;">
        <p style="margin:0;font-size:13px;color:#6b7280;">
          🍽️ Preséntalo al momento de pagar en <strong>${sucursalNombre}</strong>
        </p>
      </div>
    </div>

    <!-- Footer -->
    <div style="text-align:center;padding:16px 0 24px;">
      <p style="margin:0;font-size:12px;color:#9ca3af;">
        Este cupón fue generado automáticamente por
        <a href="${cuponUrl}" style="color:#f59e0b;text-decoration:none;font-weight:600;">PandaPoss</a>
        para ${sucursalNombre}.
      </p>
      <p style="margin:6px 0 0;font-size:11px;color:#d1d5db;">
        Si no solicitaste este cupón, simplemente ignora este mensaje.
      </p>
    </div>
  </div>
</body>
</html>`;

  return getResend().emails.send({
    from: `${sucursalNombre} <cupones@pandaposs.com>`,
    to,
    subject: `🎂 ¡Tu regalo de cumpleaños en ${sucursalNombre}! Cupón 30% dct (máx. $15.000)`,
    html,
  });
}
