# Migrador Meta4 → AXTON

**Hidalgo & Asociados** · Importador de Legajos · v1.0

Herramienta HTML que convierte la nómina exportada de Meta4 al formato del importador de legajos de AXTON. Funciona para múltiples empresas clientes sin modificar el código.

---

## Uso rápido (para el operador)

1. Abrí `dist/migrador.html` en cualquier navegador moderno (Chrome, Edge, Firefox).
2. **Paso 1**: subí el Excel de Meta4 e ingresá el CUIT de la empresa.
3. **Paso 2**: descargá el listado de catálogos y creá esas entradas en AXTON.
4. **Paso 3**: generá el Excel y descargalo. Importalo directamente en AXTON.

> El archivo `dist/migrador.html` funciona sin conexión a internet y sin instalar nada.

---

## Estructura del proyecto

```
migrador-meta4-axton/
├── CLAUDE.md               Contexto del proyecto para Claude Code
├── README.md               Este archivo
├── build.js                Genera dist/migrador.html (Node.js)
│
├── .claude/
│   └── rules/
│       ├── mapeo-campos.md          Tabla completa AXTON ← Meta4
│       ├── reglas-transformacion.md Reglas de formato, limpieza y alertas
│       └── codificacion.md          Cómo usar las tablas universales
│
├── config/
│   ├── tablas-universales.json  Tablas de codificación (5 tablas universales)
│   └── valores-fijos.json       Campos con valor fijo para todos los empleados
│
├── docs/
│   ├── Instructivo_Migracion_Meta4_AXTON.docx  Especificación técnica
│   └── instructivo.md                           Idem en markdown
│
├── src/
│   ├── index.html      Plantilla HTML base (sin dependencias incrustadas)
│   ├── transformar.js  Orquesta los 3 pasos
│   ├── codificacion.js Aplica tablas universales y valores fijos
│   ├── catalogos.js    Paso 2: extrae valores únicos
│   └── xlsx-io.js      Lectura/escritura de Excel (SheetJS)
│
├── samples/            Archivos de ejemplo (Meta4, Plantilla AXTON, Tablas)
├── tests/              Casos de prueba críticos
├── dist/               Archivo HTML portable generado por build.js
└── output/             Excels generados (en .gitignore)
```

---

## Para desarrolladores

### Requisitos
- Node.js 18+
- No hay dependencias npm obligatorias (SheetJS se descarga del CDN en el build)

### Generar el dist
```bash
node build.js
```

### Con SheetJS local (opcional, para build offline)
```bash
npm install xlsx
node build.js  # detecta node_modules/xlsx automáticamente
```

### Añadir una nueva empresa
No hay nada que tocar en el código. El CUIT y los catálogos se ingresan en la UI.

### Actualizar una tabla universal
Editá `config/tablas-universales.json` y ejecutá `node build.js` de nuevo.

### Cambiar ModalidadSIJP de código a nombre
En `src/codificacion.js`, línea con `mod.codigo`, cambiarlo por `mod.nombre`.
Luego regenerar el build.

---

## Reglas críticas del importador AXTON

- Solo **Legajo (col. A)** y **CUIL (col. B)** son obligatorios.
- La operación es siempre **ALTA**.
- El **CUIT de la empresa** va en la celda B1.
- Las **celdas vacías no se importan** (no borra datos existentes).
- **CBU, Obra Social (RNOS), Legajo y NumeroCuenta**: siempre como texto.
- **CUIL**: siempre con guion `XX-XXXXXXXX-X`.

---

## Pendientes de validar

Ver sección 8 del instructivo en `docs/`.

| Ítem | Estado |
|------|--------|
| ModalidadSIJP: ¿código u008 o nombre? | ⏳ Pendiente |
| CentroCosto: valores numéricos sueltos | ⏳ Pendiente |
| UnidadNegocio / Filial: columna destino en AXTON | ⏳ Pendiente |
| Obra Social y Banco: validar en AXTON con prueba | ⏳ Pendiente |
| EntreCalles: valor `'CL'` en origen | ⏳ Pendiente |
