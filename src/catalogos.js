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
 * Genera un texto plano con los catálogos, apto para copiar/pegar o descargar.
 *
 * @param {Object} catalogos  Resultado de extraerCatalogos()
 * @returns {string}
 */
function catalogosATexto(catalogos) {
  const lineas = ['CATÁLOGOS A CREAR EN AXTON', '='.repeat(40), ''];
  for (const [campo, datos] of Object.entries(catalogos)) {
    lineas.push(`${datos.label.toUpperCase()} (${datos.count} valores)`);
    lineas.push('-'.repeat(30));
    datos.valores.forEach(v => lineas.push(`  ${v}`));
    lineas.push('');
  }
  return lineas.join('\n');
}

/**
 * Descarga los catálogos como archivo .txt.
 *
 * @param {Object} catalogos
 * @param {string} nombreEmpresa  Para personalizar el nombre del archivo
 */
function descargarCatalogos(catalogos, nombreEmpresa = 'empresa') {
  const texto = catalogosATexto(catalogos);
  const blob  = new Blob([texto], { type: 'text/plain;charset=utf-8' });
  const url   = URL.createObjectURL(blob);
  const a     = document.createElement('a');
  a.href      = url;
  a.download  = `catalogos_axton_${nombreEmpresa.replace(/\s+/g, '_')}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
