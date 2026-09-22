/**
 * xlsx-io.js
 * Lectura de la nómina Meta4 y escritura del Excel de importación AXTON.
 * Usa SheetJS (XLSX) que el build.js incrusta en el HTML final.
 *
 * REGLA CRÍTICA: todos los IDs, códigos y campos numérico-textuales se leen y
 * escriben como STRING para preservar ceros a la izquierda (Legajo, CUIL, RNOS,
 * CBU, NumeroCuenta, CodigoPostal, Documento).
 */

// Encabezados de la fila 2 de la plantilla oficial AXTON (hoja "legajos").
// 75 columnas en su orden exacto A→BW. Las columnas que la herramienta NO
// completa (Barrio, CAT, Categoria, Presupuesto, etc.) quedan con título y
// celda vacía: NO se eliminan ni se reordenan.
const ENCABEZADOS_AXTON = [
  'Legajo','CUIL','Apellido','Nombres','ApellidoCasada','Sexo',          // A–F
  'TipoDocumento','Documento','Nacimiento','Nacionalidad','EstadoCivil', // G–K
  'AFJP','Calle','Numero','Piso','Departamento','CodigoPostal',          // L–Q
  'Localidad','Provincia','Barrio','EntreCalles','Telefono','Email',     // R–W
  'CAT','Ingreso','AntiguedadReconocida','ObraSocial','Categoria',       // X–AB
  'Calificacion','Convenio','SectorInterno','LugarPago','ModalidadSIJP', // AC–AG
  'Cargo','UnidadNegocio','Presupuesto','Observaciones','TipoSueldo',    // AH–AL
  'SueldoBasico','Adicional1','Adicional2','SueldoFactura','Jornada',    // AM–AQ
  'HorasMensuales','CoeficienteSF','CentroCosto','Rama','Filial',        // AR–AV
  'Celular','BaseObraSocial','NivelEstudios','ZonaGeografica',           // AW–AZ
  'PosibleBanco','PosibleSucursal','PlanObraSocial','LiquidaGanancias',  // BA–BD
  'ParametrosGanancias','Area','Seccion','Banco','SucursalBanco',        // BE–BI
  'TipoCuenta','NumeroCuenta','CBU','Principal','Prioridad','Comentario', // BJ–BO
  'Porcentaje','FormaCobro','CondicionSIJP','Siniestrado','Actividad',   // BP–BT
  'Usuario','Clave','MailSeguridad'                                      // BU–BW
];

// Columnas que DEBEN ser texto en el Excel de salida (nunca número)
const COLS_TEXTO = [
  'Legajo', 'CUIL', 'ObraSocial', 'CBU', 'NumeroCuenta',
  'CodigoPostal', 'Documento', 'Telefono'
];

// Columnas de fecha de origen (Meta4). Siempre se normalizan a DD/MM/AAAA
// sin importar el formato con el que vengan formateadas en el Excel de origen.
const CAMPOS_FECHA_META4 = ['FEC_NACIMIENTO', 'FEC_ALTA_EMPLEADO', 'FEC_ANTIGUEDAD'];

function pad2(n) {
  return String(n).padStart(2, '0');
}

/**
 * Normaliza cualquier valor de fecha (Date de SheetJS, serial de Excel o
 * texto en distintos formatos) al formato DD/MM/AAAA (día y mes con 2
 * dígitos, año con 4).
 *
 * @param {Date|number|string} valor
 * @returns {string}
 */
function formatearFecha(valor) {
  if (valor === null || valor === undefined || valor === '') return '';

  // Date (SheetJS con cellDates:true) — usar UTC para no correr un día
  // por el desfasaje de zona horaria del navegador.
  if (valor instanceof Date && !isNaN(valor.getTime())) {
    return `${pad2(valor.getUTCDate())}/${pad2(valor.getUTCMonth() + 1)}/${valor.getUTCFullYear()}`;
  }

  // Número: serial de fecha de Excel (días desde 1899-12-30)
  if (typeof valor === 'number' && !isNaN(valor)) {
    const base = Date.UTC(1899, 11, 30);
    const d = new Date(base + Math.round(valor) * 86400000);
    return `${pad2(d.getUTCDate())}/${pad2(d.getUTCMonth() + 1)}/${d.getUTCFullYear()}`;
  }

  const s = String(valor).trim();
  if (!s) return '';

  // AAAAMMDD (8 dígitos sin separador)
  let m = s.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (m) return `${m[3]}/${m[2]}/${m[1]}`;

  // AAAA-MM-DD o AAAA/MM/DD (ISO)
  m = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (m) return `${pad2(m[3])}/${pad2(m[2])}/${m[1]}`;

  // DD/MM/AAAA o DD-MM-AAAA (ya viene en orden día-mes-año: solo normalizar)
  m = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (m) return `${pad2(m[1])}/${pad2(m[2])}/${m[3]}`;

  // No se pudo interpretar el formato: devolver tal cual
  return s;
}

/**
 * Lee el archivo Meta4 desde un ArrayBuffer y devuelve array de objetos.
 * Todas las celdas se leen como texto (raw: false) para no perder ceros,
 * excepto las columnas de fecha, que se leen en crudo (raw: true, con
 * cellDates:true ya quedan como Date) para poder normalizarlas siempre a
 * DD/MM/AAAA sin depender del formato de la celda de origen.
 *
 * @param {ArrayBuffer} buffer
 * @returns {Object[]} filas como objetos { columna: valor }
 */
function leerMeta4(buffer) {
  const XLSX = window.XLSX;
  const wb = XLSX.read(new Uint8Array(buffer), {
    type:      'array',
    cellDates: true,
  });
  const ws = wb.Sheets[wb.SheetNames[0]];

  const filasTexto = XLSX.utils.sheet_to_json(ws, { defval: '', raw: false });
  const filasCrudas = XLSX.utils.sheet_to_json(ws, { defval: '', raw: true });

  return filasTexto.map((fila, i) => {
    const crudos = filasCrudas[i] || {};
    for (const campo of CAMPOS_FECHA_META4) {
      if (campo in fila) fila[campo] = formatearFecha(crudos[campo]);
    }
    return fila;
  });
}

/**
 * Genera el Excel de importación AXTON en formato Blob descargable.
 *
 * @param {Object[]} legajos   Array de filas ya transformadas
 * @param {string}   cuitEmpresa  CUIT a escribir en B1
 * @returns {Blob}
 */
function generarExcelAxton(legajos, cuitEmpresa) {
  const XLSX = window.XLSX;
  const wb = XLSX.utils.book_new();

  // Encabezados en fila 2 (la fila 1 es para el CUIT de empresa).
  // ORDEN Y COLUMNAS EXACTOS de la plantilla oficial del importador AXTON
  // (hoja "legajos", 75 columnas A→BW). NO alterar, agregar ni quitar columnas:
  // las que la herramienta no completa van con su título y celda vacía.
  const encabezados = ENCABEZADOS_AXTON;

  // Construir array de arrays: fila 1 vacía excepto B1, fila 2 encabezados, fila 3+ datos
  const filas = [];
  // Fila 1: solo el CUIT en la posición del segundo elemento (col B)
  const fila1 = new Array(encabezados.length).fill('');
  fila1[1] = cuitEmpresa;
  filas.push(fila1);
  // Fila 2: encabezados
  filas.push(encabezados);
  // Filas 3+: datos
  for (const leg of legajos) {
    filas.push(encabezados.map(col => leg[col] ?? ''));
  }

  const ws = XLSX.utils.aoa_to_sheet(filas);

  // Forzar texto en columnas críticas (a partir de fila 3, índice 2)
  const colIdx = {};
  encabezados.forEach((h, i) => { colIdx[h] = i; });

  for (const col of COLS_TEXTO) {
    const ci = colIdx[col];
    if (ci === undefined) continue;
    for (let ri = 2; ri < filas.length; ri++) {  // ri=2 → fila 3 (datos)
      const cellRef = XLSX.utils.encode_cell({ r: ri, c: ci });
      const val = filas[ri][ci];
      if (val !== '' && val != null) {
        ws[cellRef] = { t: 's', v: String(val), w: String(val) };
      }
    }
  }

  XLSX.utils.book_append_sheet(wb, ws, 'legajos');

  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([wbout], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
}

/**
 * Dispara la descarga del blob en el navegador.
 *
 * @param {Blob}   blob
 * @param {string} nombre  Nombre del archivo sin extensión
 */
function descargarBlob(blob, nombre) {
  const url = URL.createObjectURL(blob);
  const a   = document.createElement('a');
  a.href     = url;
  a.download = `${nombre}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
