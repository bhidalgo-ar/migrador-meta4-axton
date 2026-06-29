/**
 * codificacion.js
 * Aplica las 5 tablas universales, los valores fijos y las reglas de limpieza
 * a una fila leída de Meta4.
 *
 * Depende de:
 *   window.TABLAS_UNIVERSALES  (incrustado por build.js desde config/tablas-universales.json)
 *   window.VALORES_FIJOS       (incrustado por build.js desde config/valores-fijos.json)
 */

const NULOS_DOMICILIO = /^[-–\u2013]$|^null$/i;

/**
 * Busca un código en una tabla. Si el código es '0' o vacío, devuelve '' y
 * empuja un aviso a alertas. Si no existe en la tabla, ídem.
 *
 * @param {string} codigo
 * @param {Object} tabla         Sub-objeto de TABLAS_UNIVERSALES
 * @param {string} campoLabel    Nombre del campo para el mensaje de alerta
 * @param {string} legajo
 * @param {Array}  alertas       Array acumulador de alertas (mutable)
 * @returns {string}
 */
function aplicarTabla(codigo, tabla, campoLabel, legajo, alertas) {
  const c = String(codigo ?? '').trim();
  if (!c || c === '0') {
    if (c === '0') {
      alertas.push({
        legajo,
        campo: campoLabel,
        valorMeta4: '0',
        mensaje: `Código '0' sin equivalencia en tabla — campo dejado vacío`
      });
    }
    return '';
  }
  const resultado = tabla[c];
  if (resultado === undefined) {
    alertas.push({
      legajo,
      campo: campoLabel,
      valorMeta4: c,
      mensaje: `Código '${c}' no encontrado en tabla universal — campo dejado vacío`
    });
    return '';
  }
  return resultado;
}

/**
 * Formatea un CUIL de 11 dígitos al formato con guion XX-XXXXXXXX-X.
 * Si el valor ya tiene guiones o no tiene 11 dígitos, lo devuelve sin tocar.
 *
 * @param {string} raw
 * @returns {string}
 */
function formatearCuil(raw) {
  const s = String(raw ?? '').replace(/\D/g, '');
  if (s.length !== 11) return String(raw ?? '');
  return `${s.slice(0, 2)}-${s.slice(2, 10)}-${s[10]}`;
}

/**
 * Limpia un campo de domicilio: '-', '–' o 'NULL' → vacío.
 *
 * @param {string} val
 * @returns {string}
 */
function limpiarDomicilio(val) {
  const s = String(val ?? '').trim();
  return NULOS_DOMICILIO.test(s) ? '' : s;
}

/**
 * Transforma una fila cruda de Meta4 al formato AXTON.
 *
 * @param {Object} fila     Fila tal como viene de leerMeta4()
 * @param {Array}  alertas  Array acumulador de alertas (mutable)
 * @returns {Object}        Objeto con claves = columnas AXTON
 */
function transformarFila(fila, alertas) {
  const T = window.TABLAS_UNIVERSALES;
  const F = window.VALORES_FIJOS;
  const legajo = String(fila.ID_EMPLEADO ?? '').trim();

  return {
    // ── Identificadores ───────────────────────────────────────────────
    Legajo:               legajo,
    CUIL:                 formatearCuil(fila.CUIL),

    // ── Datos personales ──────────────────────────────────────────────
    Apellido:             String(fila.APELLIDO_1 ?? '').trim(),
    Nombres:              String(fila.NOMBRE ?? '').trim(),
    ApellidoCasada:       String(fila.APELLIDO_2 ?? '').trim(),
    Sexo:                 String(fila.ID_SEXO ?? '').trim(),
    TipoDocumento:        aplicarTabla(fila.ID_TIPO_DOCUMENTO, T.tipoDocumento, 'TipoDocumento', legajo, alertas),
    Documento:            String(fila.NUM_DOCUMENTO ?? '').trim(),
    Nacimiento:           String(fila.FEC_NACIMIENTO ?? '').trim(),
    Nacionalidad:         aplicarTabla(fila.ID_NACIONALIDAD,   T.nacionalidad,  'Nacionalidad',  legajo, alertas),
    EstadoCivil:          aplicarTabla(fila.ID_ESTADO_CIVIL,   T.estadoCivil,   'EstadoCivil',   legajo, alertas),

    // ── Valor fijo ────────────────────────────────────────────────────
    AFJP:                 F.AFJP,

    // ── Domicilio (limpiar nulos) ─────────────────────────────────────
    Calle:                limpiarDomicilio(fila.VIA_PUBLICA),
    Numero:               limpiarDomicilio(fila.NUM_VIA),
    Piso:                 limpiarDomicilio(fila.PISO),
    Departamento:         limpiarDomicilio(fila.DEPARTAMENTO),
    CodigoPostal:         String(fila.DISTRITO_POSTAL ?? '').trim(),
    Localidad:            String(fila.POBLACION ?? '').trim(),
    Provincia:            aplicarTabla(fila.Provincia,          T.provincia,     'Provincia',     legajo, alertas),
    EntreCalles:          String(fila.Entrecalles ?? '').trim(),  // pendiente revisar 'CL'

    // ── Contacto ──────────────────────────────────────────────────────
    Telefono:             String(fila.TELEFONO ?? '').trim(),
    Email:                '',  // siempre vacío (Meta4 no trae emails reales)

    // ── Fechas laborales ─────────────────────────────────────────────
    Ingreso:              String(fila.FEC_ALTA_EMPLEADO ?? '').trim(),
    AntiguedadReconocida: String(fila.FEC_ANTIGUEDAD ?? '').trim(),

    // ── Obra social y sindicato ───────────────────────────────────────
    ObraSocial:           String(fila.ID_OBRA_SOCIAL ?? '').trim(),  // RNOS texto, sin traducción
    PlanObraSocial:       String(fila.N_PLAN_SALUD ?? '').trim(),

    // ── Campos empresa-a-empresa (pasan literal) ──────────────────────
    Convenio:             String(fila.N_CONVENIO ?? '').trim(),
    Cargo:                String(fila.N_PUESTO ?? '').trim(),
    CentroCosto:          String(fila.N_CENTRO_COSTO ?? '').trim(),
    UnidadNegocio:        String(fila.N_DEPARTAMENTO ?? '').trim(),
    Filial:               String(fila.N_CENTRO_TRABAJO ?? '').trim(),

    // ── Modalidad SIJP (tabla universal → código) ─────────────────────
    ModalidadSIJP: (() => {
      const key = String(fila.ID_MOD_CONTRAT ?? '').trim();
      const mod  = T.modalidadSIJP[key];
      if (!mod) {
        if (key) alertas.push({ legajo, campo: 'ModalidadSIJP', valorMeta4: key, mensaje: 'Código no encontrado en tabla' });
        return '';
      }
      return mod.codigo; // ← usar mod.nombre si el cliente confirma nombre en vez de código
    })(),

    // ── Banco y cuenta ────────────────────────────────────────────────
    Banco:                String(fila.N_BANCO ?? '').trim(),
    TipoCuenta:           F.TipoCuenta,
    NumeroCuenta:         String(fila.NUM_CUENTA ?? '').trim(),
    CBU:                  String(fila.CBU ?? '').trim(),

    // ── Impuestos (valores fijos) ─────────────────────────────────────
    LiquidaGanancias:     F.LiquidaGanancias,
    ParametrosGanancias:  F.ParametrosGanancias,
  };
}
