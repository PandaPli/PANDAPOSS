const XLSX = require('../node_modules/xlsx');
const wb = XLSX.readFile('C:/Users/PANDA/Downloads/planilla_carga_completa_CasaFaroles_2.xlsx');
const data = XLSX.utils.sheet_to_json(wb.Sheets['Carga de Productos']);

const lines = data.map(r => {
  const codigo = String(r['CODIGO DE PRODUCTO']);
  const codigoFinal = 'CF-' + codigo.padStart(4, '0');
  const nombre = r['NOMBRE DEL PRODUCTO'].replace(/"/g, '\\"');
  const costo = r['PRECIO COMPRA'] || 0;
  const precio = r['PRECIO VENTA'];
  const stock = r['EXISTENCIA'] || 0;
  const stockMinimo = r['STOCK MINIMO'] || 0;
  const categoria = r['CATEGORIA'];
  return `  { codigo: "${codigoFinal}", categoria: "${categoria}", nombre: "${nombre}", costo: ${costo}, precio: ${precio}, stock: ${stock}, stockMinimo: ${stockMinimo} }`;
});

process.stdout.write(lines.join(',\n') + '\n');
