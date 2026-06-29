# Casos de prueba críticos

Estos son los casos que **deben pasar** antes de considerar el migrador estable.
Todos tienen datos reales de la nómina de muestra (`samples/Nomina_Meta4.xlsx`).

---

## 1. CUIL con guion

**Input Meta4:** `23332584464`  
**Output AXTON esperado:** `23-33258446-4`  
**Valida:** formatearCuil() — 11 dígitos sin guion → XX-XXXXXXXX-X

---

## 2. Legajo con ceros a la izquierda

**Input Meta4:** `0342`  
**Output AXTON esperado (celda texto):** `0342`  
**Valida:** la celda de Legajo en el xlsx de salida es de tipo `s` (string), no `n` (number)

---

## 3. RNOS con cero adelante — 11 casos

**Ejemplos:** `000406`, `001201`, `003009`, `003207`, `003603`, `003801`  
**Output AXTON esperado:** mismo valor, celda tipo texto  
**Valida:** los 11 códigos que empiezan con 0 no pierden el cero al escribir en Excel

---

## 4. Código '0' — Estado Civil (legajo 0405)

**Input Meta4:** `ID_ESTADO_CIVIL = '0'`  
**Output AXTON esperado:** campo EstadoCivil vacío; empleado SÍ incluido en el Excel  
**Valida:** la fila de Di Bonis, Julieta está en el output con EstadoCivil en blanco

---

## 5. Código '0' — Provincia (legajos 0665 y 0818)

**Input Meta4:** `Provincia = '0'` en ambos  
**Output AXTON esperado:** campo Provincia vacío; empleados SÍ incluidos  
**Valida:** 138 filas en output (no 135); Provincia vacía para esos 2

---

## 6. Domicilio con '-' → vacío

**Input Meta4:** cualquier campo de domicilio con valor `'-'` o `'–'` o `'NULL'`  
**Output AXTON esperado:** celda vacía  
**Valida:** limpiarDomicilio()

---

## 7. Email siempre vacío

**Input Meta4:** campo Email con nombres como `'wanda'`, `'lucas'`, `'sergio'`  
**Output AXTON esperado:** columna Email vacía para todos  
**Valida:** codificacion.js, campo Email = ''

---

## 8. Cartel de alertas presente

**Condición:** ejecutar Paso 3 con la nómina de muestra  
**Output esperado:** panel de alertas mostrando los 3 empleados con código '0'  
**Valida:** renderizarAlertas() + clasificarAlertas()

---

## 9. CUIT en B1 del Excel

**Input:** CUIT `30-12345678-9`  
**Output esperado:** celda B1 del xlsx de salida = `3012345678-9` (sin guiones)  
**Valida:** generarExcelAxton() — posición correcta del CUIT en la hoja

---

## 10. Tabla de modalidad — todos los 4 códigos del dataset

| Código Meta4 | Código AXTON esperado |
|---|---|
| 8 | 008 |
| 22 | 022 |
| 14 | 014 |
| 27 | 027 |
