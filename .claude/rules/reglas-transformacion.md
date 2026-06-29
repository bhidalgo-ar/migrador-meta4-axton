---
paths:
  - src/**
---

# Reglas de transformación — src/

Estas reglas aplican a todo el código dentro de `src/`. Si algo contradice el `CLAUDE.md` raíz, el CLAUDE.md raíz gana.

## Lectura del archivo Meta4

```js
// SheetJS: siempre leer como texto para no perder ceros
const wb = XLSX.read(data, { type: 'array', raw: false, cellText: true });
const ws = wb.Sheets[wb.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(ws, { defval: '', raw: false });
```

Columnas críticas que DEBEN llegar como string: `ID_EMPLEADO`, `CUIL`, `NUM_DOCUMENTO`, `ID_OBRA_SOCIAL`, `CBU`, `NUM_CUENTA`, `DISTRITO_POSTAL`.

## Formateo del CUIL

```js
function formatCuil(raw) {
  const s = String(raw).replace(/\D/g, ''); // quitar todo no-dígito
  if (s.length !== 11) return raw;           // si no tiene 11, devolver sin tocar
  return `${s.slice(0,2)}-${s.slice(2,10)}-${s[10]}`;
}
```

## Limpieza de campos de domicilio

```js
const NULOS_DOMICILIO = /^[-–]$|^null$/i;
function limpiarDomicilio(val) {
  return NULOS_DOMICILIO.test(String(val).trim()) ? '' : val;
}
// Aplicar a: VIA_PUBLICA, NUM_VIA, PISO, DEPARTAMENTO, Entrecalles
```

## Código '0' sin equivalencia

```js
function aplicarTabla(codigo, tabla, campoLabel, legajo, alertas) {
  if (!codigo || codigo === '0') {
    if (codigo === '0') {
      alertas.push({ legajo, campo: campoLabel, valorMeta4: '0' });
    }
    return '';  // campo vacío, fila se incluye igual
  }
  const resultado = tabla[codigo];
  if (!resultado) {
    alertas.push({ legajo, campo: campoLabel, valorMeta4: codigo, mensaje: 'Código no encontrado en tabla' });
    return '';
  }
  return resultado;
}
```

## Escritura del Excel de salida

```js
// Columnas que DEBEN ser texto en la salida (nunca número)
const COLS_TEXTO = ['Legajo','CUIL','ObraSocial','CBU','NumeroCuenta','CodigoPostal','Documento'];

function setCellText(ws, ref, value) {
  ws[ref] = { t: 's', v: String(value), w: String(value) };
}
```

## Orden de columnas AXTON (primeras 40 más relevantes)

El archivo de salida debe tener los encabezados en la **fila 2**, el CUIT en **B1**, y los datos desde la **fila 3**.

```
A:Legajo  B:CUIL  C:Apellido  D:Nombres  E:ApellidoCasada  F:Sexo
G:TipoDocumento  H:Documento  I:Nacimiento  J:Nacionalidad  K:EstadoCivil
L:AFJP  M:Calle  N:Numero  O:Piso  P:Departamento  Q:CodigoPostal
R:Localidad  S:Provincia  T:EntreCalles  U:Telefono  V:Email
W:Ingreso  X:AntiguedadReconocida  Y:ObraSocial  Z:PlanObraSocial
AA:Convenio  AB:Cargo  AC:CentroCosto  AD:UnidadNegocio  AE:Filial
AF:ModalidadSIJP  AG:Banco  AH:TipoCuenta  AI:NumeroCuenta  AJ:CBU
AK:LiquidaGanancias  AL:ParametrosGanancias
```
