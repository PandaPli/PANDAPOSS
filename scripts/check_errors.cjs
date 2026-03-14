const XLSX = require('./node_modules/xlsx');
const wb = XLSX.readFile('C:/Users/PANDA/Downloads/planilla_carga_completa_CasaFaroles_2.xlsx');
const data = XLSX.utils.sheet_to_json(wb.Sheets['Carga de Productos']);

const PROBLEMAS = ['10522','14521452000','20001','105242'];

data.forEach(r => {
  const codigo = String(r['CODIGO DE PRODUCTO']);
  if (PROBLEMAS.includes(codigo)) {
    console.log(JSON.stringify(r, null, 2));
  }
});
