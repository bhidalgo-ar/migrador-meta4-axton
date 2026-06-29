/**
 * transformar.js
 * Orquesta los 3 pasos de la conversión Meta4 → AXTON.
 * Depende de: xlsx-io.js, codificacion.js, catalogos.js
 */

/** Estado compartido del workflow */
const estado = {
  paso:           1,
  filasMeta4:     null,   // filas crudas leídas del Excel
  catalogos:      null,   // resultado del Paso 2
  cuitEmpresa:    '',
  alertas:        [],     // avisos acumulados durante la transformación
};

// ─────────────────────────────────────────────
// PASO 1: Cargar archivo y CUIT
// ─────────────────────────────────────────────

/**
 * Lee el archivo Meta4 del input y avanza al Paso 2.
 * Llama a mostrarCatalogos() en la UI.
 *
 * @param {File}   archivo
 * @param {string} cuit
 */
async function ejecutarPaso1(archivo, cuit) {
  if (!archivo) throw new Error('Seleccionar un archivo de nómina.');
  if (!cuit || !/^\d{11}$/.test(cuit.replace(/-/g, ''))) {
    throw new Error('El CUIT de la empresa debe tener 11 dígitos.');
  }
  estado.cuitEmpresa = cuit.replace(/-/g, '');
  const buffer       = await archivo.arrayBuffer();
  estado.filasMeta4  = leerMeta4(buffer);
  estado.catalogos   = extraerCatalogos(estado.filasMeta4);
  estado.paso        = 2;
  return estado.catalogos;
}

// ─────────────────────────────────────────────
// PASO 2: Mostrar catálogos (no transforma datos)
// ─────────────────────────────────────────────

/** Habilita avanzar al Paso 3 una vez que el usuario confirma haber creado los catálogos. */
function confirmarCatalogos() {
  estado.paso = 3;
}

// ─────────────────────────────────────────────
// PASO 3: Generar Excel de importación
// ─────────────────────────────────────────────

/**
 * Transforma todas las filas y genera el .xlsx de importación AXTON.
 * Devuelve un objeto con el blob descargable y el array de alertas.
 *
 * @returns {{ blob: Blob, alertas: Object[], totalFilas: number }}
 */
function ejecutarPaso3() {
  if (!estado.filasMeta4) throw new Error('No hay datos cargados. Volvé al Paso 1.');

  estado.alertas = [];
  const legajos  = estado.filasMeta4.map(fila =>
    transformarFila(fila, estado.alertas)
  );

  const blob = generarExcelAxton(legajos, estado.cuitEmpresa);

  return {
    blob,
    alertas:    estado.alertas,
    totalFilas: legajos.length,
  };
}

/**
 * Agrupa las alertas por tipo para la UI.
 *
 * @param {Object[]} alertas
 * @returns {{ codigoCero: Object[], codigoDesconocido: Object[] }}
 */
function clasificarAlertas(alertas) {
  return {
    codigoCero:        alertas.filter(a => a.valorMeta4 === '0'),
    codigoDesconocido: alertas.filter(a => a.valorMeta4 !== '0'),
  };
}
