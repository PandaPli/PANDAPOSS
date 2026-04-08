// auth-server.js — Mini servidor local para autenticación directa con DB
'use strict';

const http = require('http');
const path = require('path');
const bcrypt = require('bcryptjs');

let db = null;
function getDb() {
  if (!db) {
    const { PrismaClient } = require(path.resolve(__dirname, '..', 'node_modules', '.prisma', 'client', 'default.js'));
    db = new PrismaClient({
      datasourceUrl: 'mysql://root:hyRNxCOooNgXiVSmtFUEfcUpXTzevXCb@metro.proxy.rlwy.net:24513/railway'
    });
  }
  return db;
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method === 'POST' && req.url === '/login') {
    let body = '';
    req.on('data', d => body += d);
    req.on('end', async () => {
      try {
        const { email, password } = JSON.parse(body);
        const prisma = getDb();

        const user = await prisma.usuario.findFirst({
          where: { email: email.trim().toLowerCase(), status: 'ACTIVO' },
          include: {
            sucursal: { select: { id: true, nombre: true, plan: true, agente: { select: { id: true } } } }
          }
        });

        if (!user) { res.writeHead(401); res.end(JSON.stringify({ error: 'Credenciales incorrectas' })); return; }

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) { res.writeHead(401); res.end(JSON.stringify({ error: 'Credenciales incorrectas' })); return; }

        if (!user.sucursal) { res.writeHead(403); res.end(JSON.stringify({ error: 'Sin sucursal asignada' })); return; }

        let agenteId = user.sucursal.agente?.id ?? null;
        if (!agenteId) {
          const nuevo = await prisma.agenteWsp.create({
            data: { sucursalId: user.sucursal.id, activo: false, estado: 'DESCONECTADO' },
            select: { id: true }
          });
          agenteId = nuevo.id;
        }

        res.writeHead(200);
        res.end(JSON.stringify({
          agentId: agenteId,
          sucursalId: user.sucursal.id,
          restaurantName: user.sucursal.nombre,
          plan: user.sucursal.plan,
        }));
      } catch (e) {
        console.error('[auth-server]', e.message);
        res.writeHead(500);
        res.end(JSON.stringify({ error: 'Error interno: ' + e.message }));
      }
    });
  } else {
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});

const PORT = 19876;
server.listen(PORT, '127.0.0.1', () => {
  console.log('[auth-server] corriendo en puerto', PORT);
});

module.exports = { server, PORT };
