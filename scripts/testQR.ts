import QRCode from "qrcode";

async function test() {
  try {
    const qrDataUrl = await QRCode.toDataURL("http://localhost:3000/menu?sucursal=1&mesa=1", {
      width: 400,
      margin: 2,
      color: { dark: "#1e1b4b", light: "#ffffff" },
      errorCorrectionLevel: "H",
    });
    console.log("Success! Length:", qrDataUrl.length);
  } catch (err: any) {
    console.error("Failed to generate QR:");
    console.error(err);
  }
}

test();
