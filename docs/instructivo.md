# Instructivo de Migración de Nómina — Meta4 → AXTON

**Hidalgo & Asociados** · Especificación Técnica · Migración de Datos  
Versión 1.0 · 26/06/2026 · Estado: En validación  
Alcance: 138 empleados · 46 columnas origen → 75 columnas destino · Operación: **ALTA**

---

## 1. Objetivo y alcance

Convierte el Excel de nómina exportado desde **Meta4** al formato del **importador de legajos de AXTON**, dejando un archivo que AXTON pueda importar sin rebotes.

Archivos de trabajo:
- `samples/Plantilla_Importador_Legajos.xlsx` — formato destino AXTON (hoja "legajos")
- `samples/Nomina_Meta4.xlsx` — datos origen (hoja "Hoja1", 138 empleados)
- `samples/Tablas_de_AXTON_vs_Meta4.xlsx` — tablas de codificación universales (hoja "TABLAS AXTON")

Para un alta de legajo, AXTON exige como mínimo **Legajo, CUIL y Fecha de Ingreso**.

---

## 2. Reglas generales del importador AXTON

Extraídas de la documentación incluida en la propia plantilla (filas 8–91):

- Solo **Legajo (col. A)** y **CUIL (col. B)** son obligatorias. Desde col. C el orden es dinámico.
- El sistema lee encabezados de la fila 2 hasta la **primera columna vacía** — no debe haber columnas vacías intermedias en la fila 2.
- Las **celdas vacías no se importan**. Para borrar un dato existente se usa el valor `0$0`.
- El CUIL se valida siempre y la edad debe ser **mayor a 18 años**.
- La celda **B1** lleva el **CUIT de la empresa**; si tiene dato, AXTON valida que coincida.
- Fechas: formato `AAAAMMDD` o `DD/MM/AAAA`.
- Cuenta bancaria: requiere al menos NúmeroCuenta o CBU, más TipoCuenta y Banco. El **CBU como texto**.

---

## 3. Mapeo de campos (AXTON ← Meta4)

### Campos directos

| Campo AXTON | Origen Meta4 | Tratamiento |
|---|---|---|
| Legajo | ID_EMPLEADO | Texto. Preservar ceros (`0342`) |
| CUIL | CUIL | **Siempre con guion: `XX-XXXXXXXX-X`** |
| Apellido | APELLIDO_1 | Directo |
| Nombres | NOMBRE | Directo |
| ApellidoCasada | APELLIDO_2 | Directo (16/138 con dato) |
| Sexo | ID_SEXO | Ya viene M/F |
| Documento | NUM_DOCUMENTO | Directo |
| Nacimiento | FEC_NACIMIENTO | Fecha |
| Ingreso | FEC_ALTA_EMPLEADO | Fecha — **OBLIGATORIA** |
| AntiguedadReconocida | FEC_ANTIGUEDAD | Fecha |
| Calle | VIA_PUBLICA | Limpiar nulos de domicilio |
| Numero | NUM_VIA | Limpiar nulos de domicilio |
| Piso | PISO | Limpiar nulos de domicilio |
| Departamento | DEPARTAMENTO | Limpiar nulos de domicilio |
| CodigoPostal | DISTRITO_POSTAL | Texto |
| Localidad | POBLACION | Directo |
| EntreCalles | Entrecalles | ⚠ Pendiente: revisar valor `'CL'` |
| Telefono | TELEFONO | Directo |
| ObraSocial | ID_OBRA_SOCIAL | RNOS 6 dígitos **como texto**, sin traducción |
| Banco | N_BANCO | Texto (validar que exista en AXTON) |
| NumeroCuenta | NUM_CUENTA | Texto |
| CBU | CBU | Texto |

### Campos con tabla universal

| Campo AXTON | Origen Meta4 | Tabla |
|---|---|---|
| TipoDocumento | ID_TIPO_DOCUMENTO | `tipoDocumento` |
| Nacionalidad | ID_NACIONALIDAD | `nacionalidad` |
| EstadoCivil | ID_ESTADO_CIVIL | `estadoCivil` |
| Provincia | Provincia | `provincia` |
| ModalidadSIJP | ID_MOD_CONTRAT | `modalidadSIJP` (usar `.codigo`) |

### Campos empresa-a-empresa (sin traducción)

| Campo AXTON | Origen Meta4 | Valores únicos |
|---|---|---|
| Convenio | N_CONVENIO | 3 |
| Cargo | N_PUESTO | 59 |
| CentroCosto | N_CENTRO_COSTO | 47 (valores sucios) |
| PlanObraSocial | N_PLAN_SALUD | 27 |
| UnidadNegocio | N_DEPARTAMENTO | 10 |
| Filial | N_CENTRO_TRABAJO | 4 |

### Valores fijos

| Campo AXTON | Valor |
|---|---|
| AFJP | S.I.P.A |
| LiquidaGanancias | 1 |
| ParametrosGanancias | 1 |
| TipoCuenta | Caja de Ahorro |

### Siempre vacíos

`Email`, `Calificacion`, `SectorInterno`, `LugarPago`

---

## 4. Tablas de codificación universales

Cobertura verificada sobre los 138 empleados:

| Tabla | Cobertura |
|---|---|
| Nacionalidad | 138/138 ✅ |
| Tipo Documento | 138/138 ✅ |
| Modalidad (→ ModalidadSIJP) | 138/138 ✅ |
| Estado Civil | 137/138 (1 con código '0') |
| Provincia | 136/138 (2 con código '0') |

Detalle de mapeos en `config/tablas-universales.json`.

---

## 5. Reglas de formato y limpieza

### Identificadores

- **CUIL**: siempre con guion `XX-XXXXXXXX-X` (el origen trae 11 dígitos sin guion).
- **Legajo**: texto, preservar ceros a la izquierda.
- **Obra Social (RNOS)**: 6 dígitos como texto (11 códigos empiezan con cero).
- **CBU**: texto.
- **Leer Meta4**: con `dtype=str` / SheetJS `raw: false`.

### Domicilio y valores nulos

Cualquier valor `'-'`, `'–'` o `'NULL'` (case-insensitive) en campos de domicilio → **celda vacía**.

**Email**: siempre vacío (la columna de Meta4 contiene nombres de pila, no emails reales).

### Códigos '0' (nulos de Meta4 sin equivalencia)

No se borra la fila. Se deja el **campo vacío**, se incluye al empleado y se emite un **cartel informativo**:

| Legajo | Empleado | CUIL | Campo en '0' |
|---|---|---|---|
| 0405 | Di Bonis, Julieta | 23332584464 | Estado Civil |
| 0665 | Surda, Lucas Ariel | 20354036046 | Provincia |
| 0818 | Gonzalez, Cristian Daniel | 20392441566 | Provincia |

---

## 6. Flujo de trabajo — 3 pasos

**Paso 1 — Cargar**  
Subir la nómina de Meta4 e ingresar el **CUIT** de la empresa (obligatorio).

**Paso 2 — Catálogos a crear en AXTON**  
La herramienta extrae y muestra los valores únicos de los campos empresa-a-empresa. El usuario los crea en AXTON antes de continuar.

**Paso 3 — Generar**  
Se genera el Excel de legajos. Los valores de los campos empresa-a-empresa pasan tal cual, coincidiendo por construcción con los que se acaban de crear en AXTON.

---

## 7. Pendientes de validar

| Ítem | Estado |
|---|---|
| ModalidadSIJP: ¿código `008` o nombre de modalidad? | ⏳ Pendiente |
| CentroCosto: valores numéricos sueltos (`680`, `702`) | ⏳ Pendiente |
| UnidadNegocio / Filial: columna destino exacta en AXTON | ⏳ Pendiente |
| Obra Social y Banco: validar con importación de prueba | ⏳ Pendiente |
| EntreCalles: revisar valor `'CL'` en origen | ⏳ Pendiente |
