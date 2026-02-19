#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const AUDIT_FILE = path.join(ROOT, "scripts", "audit-interactives-output.json");

const CANONICAL = {
  "/productos": "Ver productos",
  "/": "Inicio",
  "/auth/login": "Iniciar sesión",
  "/productos/x": "Ver categoría",
  "/blog": "Ver blog",
  "/blog/x": "Leer artículo",
  "/lista/x": "Ver lista",
  "{() => router.back()}": "Volver",
  "/aliado/leads": "Ver CRM",
  "/productos/x/x": "Ver producto",
  "/aliado/leads/nuevo": "Nuevo lead",
  "{handleReset}": "Nueva importación",
  "/aliado/distributors": "Ver clientes",
  "/distributor/orders/nueva": "Nueva orden",
  "/distributor/orders": "Ver pedidos",
  "/perfil/listas-regalo": "Volver a listas",
  "/productos/mesa": "Mesa",
  "/productos/cocina": "Cocina",
  "/productos/cafe-te-bar": "Café, Té y Bar",
  "/admin/aliados/x/distributors": "Ver clientes",
  "/admin/aliados/nuevo": "Nuevo aliado",
  "/admin/orders": "Ver órdenes",
  "/auth/signup": "Crear cuenta",
  "/bonos/comprar": "Comprar bono",
  "/distributor/invoices": "Facturas",
  "/perfil/listas-regalo/nueva": "Nueva lista",
  "/perfil/ordenes": "Ver órdenes",
  "/perfil/ordenes/x": "Ver detalle",
  "{() => handleRemoveMedia(media.id)}": "Eliminar",
  "{() => setFilters(emptyFilters)}": "Limpiar filtros",
  "{() => downloadTemplate(false)}": "Descargar plantilla vacía",
  "{() => downloadTemplate(true)}": "Descargar plantilla con instrucciones",
  "{handleImport}": "Importar",
  "{handleSubmit}": "Agregar al carrito",
  "{handleStartChat}": "Iniciar chat",
  "{handleAddToCart}": "Agregar al carrito",
  "{() => setSelectedIndex(index)}": "Ver imagen",
  "/nosotros/sobre-mesanova": "Sobre Mesanova",
  "/nosotros/por-que-elegirnos": "¿Por qué elegirnos?",
};

if (!fs.existsSync(AUDIT_FILE)) {
  console.error("Missing audit file.");
  process.exit(1);
}

const audit = JSON.parse(fs.readFileSync(AUDIT_FILE, "utf8"));
const records = (audit.records || []).filter((r) => r.status === "Redundante");

const perFile = new Map();
for (const r of records) {
  const key = r.actionPath || r.actionRaw || "";
  const canonical = CANONICAL[key];
  if (!canonical) continue;
  if (!perFile.has(r.file)) perFile.set(r.file, []);
  perFile.get(r.file).push({ ...r, key, canonical });
}

let changedFiles = 0;
let replacedLabels = 0;
let insertedAria = 0;

function insertAria(lines, lineNo, canonical) {
  const start = Math.max(0, lineNo - 1);
  const end = Math.min(lines.length - 1, lineNo + 8);
  for (let i = start; i <= end; i += 1) {
    const line = lines[i];
    if (!line.includes("<Link") && !line.includes("<Button") && !line.includes("<a ") && !line.includes("<a>")) {
      continue;
    }
    if (line.includes("aria-label=")) return false;

    if (line.includes(">")) {
      const gt = line.lastIndexOf(">");
      lines[i] = `${line.slice(0, gt)} aria-label=\"${canonical}\"${line.slice(gt)}`;
      return true;
    }

    // if opening tag spans multiple lines, append attribute to current line
    lines[i] = `${line} aria-label=\"${canonical}\"`;
    return true;
  }
  return false;
}

for (const [file, items] of perFile.entries()) {
  const full = path.join(ROOT, file);
  if (!fs.existsSync(full)) continue;

  const original = fs.readFileSync(full, "utf8");
  const lines = original.split(/\r?\n/);
  let localChanged = false;

  // stable order for deterministic edits
  items.sort((a, b) => a.line - b.line);

  for (const item of items) {
    const label = (item.label || item.ariaLabel || "").trim();
    const canonical = item.canonical;

    if (label && label !== canonical) {
      const start = Math.max(0, item.line - 2);
      const end = Math.min(lines.length - 1, item.line + 4);
      let replaced = false;
      for (let i = start; i <= end; i += 1) {
        if (lines[i].includes(label)) {
          lines[i] = lines[i].replace(label, canonical);
          replaced = true;
          replacedLabels += 1;
          localChanged = true;
          break;
        }
      }

      if (!replaced) {
        // fallback for text that was flattened from multiple children: ensure accessible canonical label
        const didInsert = insertAria(lines, item.line, canonical);
        if (didInsert) {
          insertedAria += 1;
          localChanged = true;
        }
      }
    } else {
      // empty label or already canonical -> ensure canonical aria-label to avoid ambiguity for icon/complex links
      const didInsert = insertAria(lines, item.line, canonical);
      if (didInsert) {
        insertedAria += 1;
        localChanged = true;
      }
    }
  }

  if (localChanged) {
    const next = lines.join("\n");
    if (next !== original) {
      fs.writeFileSync(full, next);
      changedFiles += 1;
    }
  }
}

console.log(JSON.stringify({ changedFiles, replacedLabels, insertedAria }, null, 2));
