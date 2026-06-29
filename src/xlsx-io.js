/**
 * xlsx-io.js
 * Lectura de la nómina Meta4 y escritura del Excel de importación AXTON.
 * Usa SheetJS (XLSX) que el build.js incrusta en el HTML final.
 *
 * REGLA CRÍTICA: todos los IDs, códigos y campos numérico-textuales se leen y
 * escriben como STRING para preservar ceros a la izquierda (Legajo, CUIL, RNOS,
 * CBU, NumeroCuenta, CodigoPostal, Documento).
 */

// Columnas que DEBEN ser texto en el Excel de salida (nunca número)
const COLS_TEXTO = [
  'Legajo', 'CUIL', 'ObraSocial', 'CBU', 'NumeroCuenta',
  'CodigoPostal', 'Documento', 'Telefono'
];

/**
 * Lee el archivo Meta4 desde un ArrayBuffer y devuelve array de objetos.
 * Todas las celdas se leen como texto (raw: false) para no perder ceros.
 *
 * @param {ArrayBuffer} buffer
 * @returns {Object[]} filas como objetos { columna: valor }
 */
function leerMeta4(buffer) {
  const wb = XLSX.read(new Uint8Array(buffer), {
    type:     'array',
    raw:      false,   // nunca convertir a número
    cellText: true,
    cellDates: true,
  });
  const ws = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json(ws, {
    defval: '',
    raw:    false,
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
  const wb = XLSX.utils.book_new();

  // Encabezados en fila 2 (la fila 1 es para el CUIT de empresa)
  const encabezados = [
    'Legajo','CUIL','Apellido','Nombres','ApellidoCasada','Sexo',
    'TipoDocumento','Documento','Nacimiento','Nacionalidad','EstadoCivil',
    'AFJP','Calle','Numero','Piso','Departamento','CodigoPostal',
    'Localidad','Provincia','EntreCalles','Telefono','Email',
    'Ingreso','AntiguedadReconocida','ObraSocial','PlanObraSocial',
    'Convenio','Cargo','CentroCosto','UnidadNegocio','Filial',
    'ModalidadSIJP','Banco','TipoCuenta','NumeroCuenta','CBU',
    'LiquidaGanancias','ParametrosGanancias'
  ];

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
