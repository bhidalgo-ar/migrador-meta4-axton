/**
 * catalogos.js
 * Paso 2: extrae los valores únicos de los campos que cambian empresa a empresa.
 * El usuario debe crear estas entradas en AXTON antes de generar el Excel final.
 *
 * Campos cubiertos: Cargo, CentroCosto, PlanObraSocial, UnidadNegocio, Filial, Convenio
 */

const CAMPOS_EMPRESA = [
  { label: 'Convenio',       colMeta4: 'N_CONVENIO',       campoAxton: 'Convenio'       },
  { label: 'Cargo',          colMeta4: 'N_PUESTO',          campoAxton: 'Cargo'          },
  { label: 'Centro de Costo',colMeta4: 'N_CENTRO_COSTO',   campoAxton: 'CentroCosto'    },
  { label: 'Plan Obra Social',colMeta4:'N_PLAN_SALUD',      campoAxton: 'PlanObraSocial' },
  { label: 'Unidad de Negocio',colMeta4:'N_DEPARTAMENTO',   campoAxton: 'UnidadNegocio'  },
  { label: 'Filial',         colMeta4: 'N_CENTRO_TRABAJO',  campoAxton: 'Filial'         },
];

/**
 * Extrae los valores únicos de cada campo empresa-a-empresa.
 *
 * @param {Object[]} filasMeta4  Filas crudas de Meta4
 * @returns {Object}  { campoAxton: { label, valores: string[], count: number } }
 */
function extraerCatalogos(filasMeta4) {
  const resultado = {};
  for (const campo of CAMPOS_EMPRESA) {
    const set = new Set();
    for (const fila of filasMeta4) {
      const val = String(fila[campo.colMeta4] ?? '').trim();
      if (val) set.add(val);
    }
    resultado[campo.campoAxton] = {
      label:   campo.label,
      valores: [...set].sort(),
      count:   set.size,
    };
  }
  return resultado;
}

/**
 * Genera un Excel (.xlsx) con los catálogos, un catálogo por columna.
 * Fila 1: encabezado "Label (N)". Filas 2+: valores únicos, todos como texto
 * (para preservar códigos como Convenio "74/1975" o ceros a la izquierda).
 *
 * @param {Object} catalogos  Resultado de extraerCatalogos()
 * @returns {Blob}
 */
function generarExcelCatalogos(catalogos) {
  const XLSX = window.XLSX;
  const entradas = Object.values(catalogos);
  const maxFilas = Math.max(0, ...entradas.map(d => d.valores.length));

  // Array de arrays: fila 0 = encabezados, filas 1+ = valores apilados por columna
  const aoa = [];
  aoa.push(entradas.map(d => `${d.label} (${d.count})`));
  for (let r = 0; r < maxFilas; r++) {
    aoa.push(entradas.map(d => d.valores[r] ?? ''));
  }

  const ws = XLSX.utils.aoa_to_sheet(aoa);

  // Forzar texto en todas las celdas de datos (nunca número)
  for (let c = 0; c < entradas.length; c++) {
    for (let r = 1; r <= maxFilas; r++) {
      const ref = XLSX.utils.encode_cell({ r, c });
      const val = aoa[r] && aoa[r][c];
      if (val !== '' && val != null) {
        ws[ref] = { t: 's', v: String(val), w: String(val) };
      }
    }
  }

  // Ancho de columna cómodo
  ws['!cols'] = entradas.map(() => ({ wch: 28 }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Catálogos AXTON');

  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([wbout], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
}

/**
 * Descarga los catálogos como archivo .xlsx.
 *
 * @param {Object} catalogos
 * @param {string} nombreEmpresa  Para personalizar el nombre del archivo
 */
function descargarCatalogos(catalogos, nombreEmpresa = 'empresa') {
  const blob = generarExcelCatalogos(catalogos);
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `catalogos_axton_${nombreEmpresa.replace(/\s+/g, '_')}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
