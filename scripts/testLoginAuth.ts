async function loginAndFetch() {
  try {
    const loginRes = await fetch("http://localhost:3000/api/auth/callback/credentials", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        usuario: "ADMIN",
        password: "12345",
        redirect: "false"
      })
    });
    
    const setCookie = loginRes.headers.get("set-cookie");
    if (!setCookie) {
      console.error("Login failed! No set-cookie header.", await loginRes.text());
      return;
    }
    
    // Parse cookies simply
    const cookies = setCookie.split(', ').map(c => c.split(';')[0]).join('; ');
    
    console.log("Logged in. Fetching QR API...");
    
    const qrRes = await fetch("http://localhost:3000/api/qr/mesa?sucursal=1&mesa=1&nombre=Mesa+1", {
      headers: {
        "Cookie": cookies
      }
    });
    
    console.log("Status:", qrRes.status);
    const text = await qrRes.text();
    console.log("Body:", text.length > 500 ? text.slice(0, 500) + '...' : text);
    
  } catch(e) {
    console.error("Script error:", e);
  }
}

loginAndFetch();
