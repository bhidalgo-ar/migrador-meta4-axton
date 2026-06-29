---
paths:
  - src/**
---

# Mapeo de campos AXTON ← Meta4

Referencia completa para `transformar.js`. Columna Meta4 → columna AXTON + tratamiento.

## Campos directos (sin traducción)

| Campo AXTON       | Columna Meta4        | Notas |
|-------------------|----------------------|-------|
| Legajo            | ID_EMPLEADO          | Texto, preservar ceros (`0342`) |
| Apellido          | APELLIDO_1           | Directo |
| Nombres           | NOMBRE               | Directo |
| ApellidoCasada    | APELLIDO_2           | Solo 16/138 con dato; los demás vacío |
| Sexo              | ID_SEXO              | Ya viene M/F — formato correcto AXTON |
| Documento         | NUM_DOCUMENTO        | Directo |
| Nacimiento        | FEC_NACIMIENTO       | Fecha |
| Ingreso           | FEC_ALTA_EMPLEADO    | Fecha — OBLIGATORIA para alta |
| AntiguedadReconocida | FEC_ANTIGUEDAD    | Fecha |
| Calle             | VIA_PUBLICA          | Limpiar nulos de domicilio |
| Numero            | NUM_VIA              | Limpiar nulos de domicilio |
| Piso              | PISO                 | Limpiar nulos de domicilio |
| Departamento      | DEPARTAMENTO         | Limpiar nulos de domicilio |
| CodigoPostal      | DISTRITO_POSTAL      | Texto |
| Localidad         | POBLACION            | Directo |
| EntreCalles       | Entrecalles          | Pendiente: revisar valor 'CL' |
| Telefono          | TELEFONO             | Directo |
| ObraSocial        | ID_OBRA_SOCIAL       | RNOS 6 dígitos, como TEXTO, sin traducción |
| Banco             | N_BANCO              | Texto (validar que exista en AXTON) |
| NumeroCuenta      | NUM_CUENTA           | Texto |
| CBU               | CBU                  | Texto — no convertir a número |

## Campos con tabla universal (via codificacion.js)

| Campo AXTON     | Columna Meta4        | Tabla                  |
|-----------------|----------------------|------------------------|
| TipoDocumento   | ID_TIPO_DOCUMENTO    | `tablas.tipoDocumento` |
| Nacionalidad    | ID_NACIONALIDAD      | `tablas.nacionalidad`  |
| EstadoCivil     | ID_ESTADO_CIVIL      | `tablas.estadoCivil`   |
| Provincia       | Provincia            | `tablas.provincia`     |
| ModalidadSIJP   | ID_MOD_CONTRAT       | `tablas.modalidadSIJP` (usar .codigo) |

## Campos empresa-a-empresa (copiar literal, sin traducción)

| Campo AXTON    | Columna Meta4     | Valores únicos en dataset actual |
|----------------|-------------------|----------------------------------|
| Convenio       | N_CONVENIO        | 3 |
| Cargo          | N_PUESTO          | 59 |
| CentroCosto    | N_CENTRO_COSTO    | 47 (advertencia: mezcla nombres y números) |
| PlanObraSocial | N_PLAN_SALUD      | 27 |
| UnidadNegocio  | N_DEPARTAMENTO    | 10 (destino en AXTON a confirmar) |
| Filial         | N_CENTRO_TRABAJO  | 4  (destino en AXTON a confirmar) |

## Campos con valor fijo (via valores-fijos.json)

| Campo AXTON        | Valor fijo     |
|--------------------|----------------|
| AFJP               | S.I.P.A        |
| LiquidaGanancias   | 1              |
| ParametrosGanancias| 1              |
| TipoCuenta         | Caja de Ahorro |

## Campos que siempre van vacíos

| Campo AXTON | Razón |
|-------------|-------|
| Email       | Meta4 no trae emails reales (contiene nombres de pila) |
| Calificacion| 0/138 en Meta4 |
| SectorInterno| 0/138 en Meta4 |
| LugarPago   | 0/138 en Meta4 |
