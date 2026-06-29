---
paths:
  - src/**
  - config/**
---

# Codificación universal — cómo usar las tablas

Las 5 tablas de `config/tablas-universales.json` son la única fuente de verdad para la codificación. **No hardcodear valores de traducción en el código JS.**

## Patrón de uso en codificacion.js

```js
// Correcto: leer desde config
const tablas = await loadJSON('config/tablas-universales.json');
const fijos  = await loadJSON('config/valores-fijos.json');

// Traducción simple (nacionalidad, estadoCivil, provincia, tipoDocumento)
row.Nacionalidad  = aplicarTabla(row.ID_NACIONALIDAD,  tablas.nacionalidad,  'Nacionalidad',  row.ID_EMPLEADO, alertas);
row.EstadoCivil   = aplicarTabla(row.ID_ESTADO_CIVIL,  tablas.estadoCivil,   'EstadoCivil',   row.ID_EMPLEADO, alertas);
row.Provincia     = aplicarTabla(row.Provincia,         tablas.provincia,     'Provincia',     row.ID_EMPLEADO, alertas);
row.TipoDocumento = aplicarTabla(row.ID_TIPO_DOCUMENTO, tablas.tipoDocumento, 'TipoDocumento', row.ID_EMPLEADO, alertas);

// Modalidad SIJP: en build.js se incrusta con cuál campo usar (codigo o nombre)
// Por defecto usar .codigo hasta que el cliente confirme
const mod = tablas.modalidadSIJP[String(row.ID_MOD_CONTRAT).trim()];
row.ModalidadSIJP = mod ? mod.codigo : '';

// Valores fijos: siempre igual para todos
row.AFJP               = fijos.AFJP;
row.LiquidaGanancias   = fijos.LiquidaGanancias;
row.ParametrosGanancias= fijos.ParametrosGanancias;
row.TipoCuenta         = fijos.TipoCuenta;
```

## Obra Social (RNOS) — manejo especial

- El código viene de Meta4 como texto de 6 dígitos (ya correcto).
- **NO pasar por ninguna tabla de traducción**: el RNOS es universal y AXTON usa el mismo código.
- Sí asegurarse de que se escribe como texto en la celda de salida (ver `COLS_TEXTO` en reglas-transformacion.md).
- Si un código RNOS no existe en AXTON, AXTON lo rechazará y hay que crearlo. Eso se documenta en el cartel informativo post-generación.

## Campos empresa-a-empresa — pasar sin traducir

`Cargo`, `CentroCosto`, `PlanObraSocial`, `UnidadNegocio`, `Filial`, `Convenio` se copian **literalmente** desde Meta4 sin transformación. La garantía de que existen en AXTON la da el Paso 2 (catalogo de valores únicos que el usuario crea antes de continuar).

## En el build (dist/migrador.html)

`build.js` incrusta los dos JSON en el HTML como variables JS globales:

```html
<script>
  window.TABLAS_UNIVERSALES = /* contenido de tablas-universales.json */;
  window.VALORES_FIJOS = /* contenido de valores-fijos.json */;
</script>
```

Así el HTML portable funciona sin `fetch()` a archivos externos (que falla en `file://`).
