#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const ts = require("typescript");

const ROOT = process.cwd();
const AUDIT_PATH = path.join(ROOT, "scripts", "audit-interactives-output.json");

if (!fs.existsSync(AUDIT_PATH)) {
  console.error("Missing scripts/audit-interactives-output.json. Run audit first.");
  process.exit(1);
}

const audit = JSON.parse(fs.readFileSync(AUDIT_PATH, "utf8"));
const targetRows = (audit.records || []).filter((r) => r.issue === "Icon button sin aria-label");
const targetFiles = [...new Set(targetRows.map((r) => r.file))];

const ICON_LABEL_MAP = [
  [/trash/i, "Eliminar"],
  [/pencil|edit|pen/i, "Editar"],
  [/eyeoff/i, "Ocultar"],
  [/eye/i, "Ver"],
  [/plus/i, "Agregar"],
  [/minus/i, "Quitar"],
  [/xcircle|circlex|x$/i, "Cerrar"],
  [/chevronleft|arrowleft/i, "Anterior"],
  [/chevronright|arrowright/i, "Siguiente"],
  [/chevrondown/i, "Expandir"],
  [/chevronup/i, "Contraer"],
  [/search/i, "Buscar"],
  [/filter/i, "Filtrar"],
  [/settings|cog/i, "Configuración"],
  [/share/i, "Compartir"],
  [/heart/i, "Favorito"],
  [/star/i, "Calificar"],
  [/calendar/i, "Seleccionar fecha"],
  [/upload/i, "Subir"],
  [/download/i, "Descargar"],
  [/menu|hamburger/i, "Abrir menú"],
  [/morehorizontal|morevertical|ellipsis/i, "Más opciones"],
  [/phone/i, "Llamar"],
  [/mail/i, "Correo"],
  [/message|chat/i, "Mensaje"],
  [/shoppingcart|cart/i, "Agregar al carrito"],
  [/check/i, "Confirmar"],
  [/refresh|reload/i, "Actualizar"],
  [/image|photo/i, "Imagen"],
  [/copy|clipboard/i, "Copiar"],
  [/link/i, "Abrir enlace"],
  [/user/i, "Usuario"],
  [/lock|unlock/i, "Seguridad"],
  [/play/i, "Reproducir"],
  [/pause/i, "Pausar"],
  [/volume/i, "Volumen"],
  [/home/i, "Inicio"],
  [/globe/i, "Sitio web"],
  [/external/i, "Abrir en nueva pestaña"],
  [/clock|time/i, "Horario"],
  [/bell/i, "Notificaciones"],
  [/map|pin|location/i, "Ubicación"],
  [/file|document/i, "Archivo"],
  [/printer/i, "Imprimir"],
  [/sort/i, "Ordenar"],
  [/undo/i, "Deshacer"],
  [/redo/i, "Rehacer"],
  [/zoomin/i, "Acercar"],
  [/zoomout/i, "Alejar"],
];

function toPos(sf, node) {
  const lc = sf.getLineAndCharacterOfPosition(node.getStart(sf));
  return { line: lc.line + 1, col: lc.character + 1 };
}

function extractJsxText(node, sf) {
  if (!node || !node.children) return "";
  const parts = [];
  for (const ch of node.children) {
    if (ts.isJsxText(ch)) {
      const t = ch.getFullText(sf).replace(/\s+/g, " ").trim();
      if (t) parts.push(t);
    } else if (ts.isJsxExpression(ch) && ch.expression && ts.isStringLiteral(ch.expression)) {
      const t = ch.expression.text.trim();
      if (t) parts.push(t);
    } else if (ts.isJsxElement(ch)) {
      const nested = extractJsxText(ch, sf);
      if (nested) parts.push(nested);
    }
  }
  return parts.join(" ").replace(/\s+/g, " ").trim();
}

function getJsxTagName(opening) {
  if (!opening || !opening.tagName) return "";
  if (ts.isIdentifier(opening.tagName)) return opening.tagName.text;
  return opening.tagName.getText();
}

function getJsxAttr(opening, name) {
  if (!opening || !opening.attributes) return undefined;
  for (const p of opening.attributes.properties) {
    if (ts.isJsxAttribute(p) && p.name && p.name.text === name) return p;
  }
  return undefined;
}

function attrRawText(attr, sf) {
  if (!attr || !attr.initializer) return "";
  if (ts.isStringLiteral(attr.initializer)) return attr.initializer.text;
  if (ts.isJsxExpression(attr.initializer) && attr.initializer.expression) {
    return attr.initializer.expression.getText(sf);
  }
  return attr.initializer.getText(sf);
}

function collectDescendantTagNames(node, out = []) {
  function walk(n) {
    if (ts.isJsxElement(n) || ts.isJsxSelfClosingElement(n)) {
      const opening = ts.isJsxElement(n) ? n.openingElement : n;
      out.push(getJsxTagName(opening));
    }
    ts.forEachChild(n, walk);
  }
  if (ts.isJsxElement(node)) {
    for (const ch of node.children) walk(ch);
  }
  return out;
}

function inferAriaLabel(node, sf, opening) {
  const classAttr = getJsxAttr(opening, "className");
  const classRaw = attrRawText(classAttr, sf);

  if (classRaw.toLowerCase().includes("destructive")) {
    return "Eliminar";
  }

  const tagNames = collectDescendantTagNames(node).filter(Boolean);
  for (const tag of tagNames) {
    for (const [re, label] of ICON_LABEL_MAP) {
      if (re.test(tag)) return label;
    }
  }

  const typeAttr = getJsxAttr(opening, "type");
  const typeRaw = attrRawText(typeAttr, sf).replace(/["'`]/g, "").trim().toLowerCase();
  if (typeRaw === "submit") return "Enviar";

  return "Acción";
}

let changedFiles = 0;
let changedButtons = 0;

for (const file of targetFiles) {
  const full = path.join(ROOT, file);
  if (!fs.existsSync(full)) continue;

  const source = fs.readFileSync(full, "utf8");
  const sf = ts.createSourceFile(
    file,
    source,
    ts.ScriptTarget.Latest,
    true,
    file.endsWith(".tsx") || file.endsWith(".jsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );

  const buttonNames = new Set(["button"]);
  sf.forEachChild((n) => {
    if (!ts.isImportDeclaration(n) || !n.importClause || !n.moduleSpecifier) return;
    const moduleName = n.moduleSpecifier.text;
    const named = n.importClause.namedBindings;
    if (!moduleName.includes("/ui/button")) return;

    if (n.importClause.name) buttonNames.add(n.importClause.name.text);
    if (named && ts.isNamedImports(named)) {
      for (const el of named.elements) {
        const nm = el.name.text;
        if (nm.toLowerCase().includes("button")) buttonNames.add(nm);
      }
    }
  });

  const edits = [];

  function walk(node) {
    if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) {
      const opening = ts.isJsxElement(node) ? node.openingElement : node;
      const tag = getJsxTagName(opening);
      if (buttonNames.has(tag) || tag === "button") {
        const aria = getJsxAttr(opening, "aria-label");
        if (!aria) {
          const label = ts.isJsxElement(node) ? extractJsxText(node, sf) : "";
          const iconOnly = !label.trim();
          if (iconOnly) {
            const inferred = inferAriaLabel(node, sf, opening).replace(/"/g, "&quot;");
            const end = opening.getEnd();
            const before = source[end - 2] === "/" ? end - 2 : end - 1;
            edits.push({ pos: before, text: ` aria-label=\"${inferred}\"` });
            changedButtons += 1;
          }
        }
      }
    }
    ts.forEachChild(node, walk);
  }

  walk(sf);

  if (edits.length === 0) continue;

  edits.sort((a, b) => b.pos - a.pos);
  let next = source;
  for (const edit of edits) {
    next = next.slice(0, edit.pos) + edit.text + next.slice(edit.pos);
  }

  if (next !== source) {
    fs.writeFileSync(full, next);
    changedFiles += 1;
  }
}

console.log(`Updated files: ${changedFiles}`);
console.log(`Updated icon-only buttons: ${changedButtons}`);
