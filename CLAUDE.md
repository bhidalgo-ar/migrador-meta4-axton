# Migrador Meta4 → AXTON

Herramienta HTML reusable (Hidalgo & Asociados) que convierte la nómina exportada de **Meta4** al formato del **importador de legajos de AXTON**. Funciona para múltiples empresas clientes. La operación es siempre un **ALTA**.

## Archivos de referencia
- `config/tablas-universales.json` — tablas de codificación (universales, iguales para todas las empresas)
- `config/valores-fijos.json` — campos con valor constante para todos los empleados
- `docs/instructivo.md` — especificación técnica completa (mapeo, reglas, pendientes)
- `samples/` — archivos de ejemplo reales (Meta4, Plantilla AXTON, Tablas)

## Estructura del código
```
src/
  index.html       UI de 3 pasos (subir archivo, catálogos, generar)
  transformar.js   Orquesta la conversión completa
  codificacion.js  Aplica tablas universales y valores fijos
  catalogos.js     Paso 2: extrae valores únicos empresa-a-empresa
  xlsx-io.js       Lectura y escritura de Excel (SheetJS)
build.js           Inyecta config + JS en un único dist/migrador.html
```

## Reglas inviolables — leer antes de cualquier cambio en src/

1. **CUIL siempre con guion**: `XX-XXXXXXXX-X`. El origen trae 11 dígitos sin guion.
2. **Legajo como texto**: preservar ceros a la izquierda (`0342`, no `342`).
3. **Obra Social (RNOS) como texto**: 6 dígitos. 11 códigos empiezan con cero; si se convierten a número se rompen. CBU igual.
4. **Código `'0'` en Meta4 = nulo sin equivalencia**: NO borrar la fila. Dejar ese campo vacío, incluir al empleado, y acumular el caso en el array de alertas para mostrarlo al usuario.
5. **Domicilio nulo**: cualquier valor `'-'`, `'–'` o `'NULL'` (case-insensitive) → celda vacía.
6. **Email**: siempre vacío. El campo de Meta4 no contiene emails reales.
7. **Leer Meta4 con dtype=str** (o SheetJS con `raw: false`): nunca dejar que Excel convierta IDs a número.

## Flujo de 3 pasos (no romper este orden)
- **Paso 1** — Usuario sube `Nómina_Meta4.xlsx` e ingresa el CUIT de la empresa (obligatorio).
- **Paso 2** — La herramienta extrae los valores únicos de los campos empresa-a-empresa (Cargo, CentroCosto, PlanObraSocial, UnidadNegocio, Filial, Convenio) y los muestra para que el usuario los cree en AXTON antes de continuar.
- **Paso 3** — Se genera el Excel de legajos aplicando todas las reglas y tablas. Esos valores pasan tal cual porque ya existen en AXTON (coinciden por construcción).

## Campos empresa-a-empresa (NO hay tabla universal para estos)
`Cargo` (N_PUESTO), `CentroCosto` (N_CENTRO_COSTO), `PlanObraSocial` (N_PLAN_SALUD), `UnidadNegocio` (N_DEPARTAMENTO), `Filial` (N_CENTRO_TRABAJO), `Convenio` (N_CONVENIO).

## Pendientes de confirmar (ver docs/instructivo.md sección 8)
- ModalidadSIJP: ¿código `008` o nombre de modalidad?
- CentroCosto: valores numéricos sueltos (`680`) ¿se cargan igual o se limpian?
- UnidadNegocio / Filial: confirmar columna destino exacta en AXTON
- ObraSocial y Banco: validar con importación de prueba en AXTON
- EntreCalles: revisar valor `'CL'` en origen
