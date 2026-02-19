#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const ts = require("typescript");
const { execSync } = require("child_process");

const ROOT = process.cwd();
const TARGET_DIRS = ["app", "components", "contexts", "hooks", "lib"];

function sh(cmd) {
  return execSync(cmd, { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

function getFiles() {
  const chunks = TARGET_DIRS.map((d) => `rg --files ${d} -g '*.{ts,tsx,js,jsx}' || true`);
  const out = sh(chunks.join("; "))
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((f) => !f.includes("node_modules"));
  return [...new Set(out)].sort();
}

function toPos(sf, node) {
  const lc = sf.getLineAndCharacterOfPosition(node.getStart(sf));
  return { line: lc.line + 1, col: lc.character + 1 };
}

function textOf(node, sf) {
  if (!node) return "";
  return node.getText(sf);
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

function hasAncestorTag(node, tagName) {
  let cur = node.parent;
  while (cur) {
    if (ts.isJsxElement(cur)) {
      const t = getJsxTagName(cur.openingElement);
      if (t === tagName) return true;
    } else if (ts.isJsxSelfClosingElement(cur)) {
      const t = getJsxTagName(cur);
      if (t === tagName) return true;
    }
    cur = cur.parent;
  }
  return false;
}

function hasAncestorAsChildWrapper(node) {
  let cur = node.parent;
  while (cur) {
    if (ts.isJsxElement(cur)) {
      if (getJsxAttr(cur.openingElement, "asChild")) return true;
    } else if (ts.isJsxSelfClosingElement(cur)) {
      if (getJsxAttr(cur, "asChild")) return true;
    }
    cur = cur.parent;
  }
  return false;
}

function jsxContainsInteractiveChild(node, nextLinkNames) {
  let found = false;
  function scan(n) {
    if (found) return;
    if (ts.isJsxElement(n) || ts.isJsxSelfClosingElement(n)) {
      const opening = ts.isJsxElement(n) ? n.openingElement : n;
      const tag = getJsxTagName(opening);
      if (tag === "a" || tag === "button" || tag === "Link" || nextLinkNames.has(tag)) {
        found = true;
        return;
      }
    }
    ts.forEachChild(n, scan);
  }
  if (ts.isJsxElement(node)) {
    for (const ch of node.children) {
      scan(ch);
      if (found) break;
    }
  }
  return found;
}

function hasInteractiveAncestor(node, nextLinkNames) {
  let cur = node.parent;
  let skippedOwnElement = false;
  while (cur) {
    if (ts.isJsxElement(cur)) {
      if (!skippedOwnElement) {
        skippedOwnElement = true;
        cur = cur.parent;
        continue;
      }
      const t = getJsxTagName(cur.openingElement);
      if (t === "a" || t === "button" || t === "Link" || nextLinkNames.has(t)) return true;
    } else if (ts.isJsxSelfClosingElement(cur)) {
      const t = getJsxTagName(cur);
      if (t === "a" || t === "button" || t === "Link" || nextLinkNames.has(t)) return true;
    }
    cur = cur.parent;
  }
  return false;
}

function attrValueInfo(attr, sf) {
  if (!attr) return { raw: "", normalizedPath: "", kind: "none", dynamic: false };
  if (!attr.initializer) return { raw: "true", normalizedPath: "", kind: "boolean", dynamic: false };

  const init = attr.initializer;
  if (ts.isStringLiteral(init)) {
    return { raw: init.text, normalizedPath: init.text, kind: "string", dynamic: false };
  }

  if (ts.isJsxExpression(init) && init.expression) {
    const e = init.expression;
    if (ts.isStringLiteral(e) || ts.isNoSubstitutionTemplateLiteral(e)) {
      return { raw: e.text, normalizedPath: e.text, kind: "string", dynamic: false };
    }
    if (ts.isTemplateExpression(e)) {
      const raw = e.getText(sf);
      const normalized = raw
        .replace(/^`|`$/g, "")
        .replace(/\$\{[^}]+\}/g, "x")
        .replace(/\s+/g, "");
      return { raw, normalizedPath: normalized, kind: "template", dynamic: true };
    }
    if (ts.isObjectLiteralExpression(e)) {
      // Handle href={{ pathname: "/foo" }}
      let pathname = "";
      for (const prop of e.properties) {
        if (ts.isPropertyAssignment(prop) && ts.isIdentifier(prop.name) && prop.name.text === "pathname") {
          const v = prop.initializer;
          if (ts.isStringLiteral(v) || ts.isNoSubstitutionTemplateLiteral(v)) pathname = v.text;
        }
      }
      return {
        raw: e.getText(sf),
        normalizedPath: pathname,
        kind: "object",
        dynamic: pathname.includes("${"),
      };
    }
    return {
      raw: e.getText(sf),
      normalizedPath: e.getText(sf).replace(/\$\{[^}]+\}/g, "x"),
      kind: "expr",
      dynamic: true,
    };
  }

  return { raw: init.getText(sf), normalizedPath: init.getText(sf), kind: "unknown", dynamic: true };
}

function normalizeRoutePath(p) {
  if (!p) return "";
  let v = p.trim();
  if (!v) return "";
  if (v.startsWith("http://") || v.startsWith("https://") || v.startsWith("mailto:") || v.startsWith("tel:")) return v;
  if (v.startsWith("javascript:")) return v;
  if (v.startsWith("#")) return v;
  const hashIdx = v.indexOf("#");
  if (hashIdx >= 0) v = v.slice(0, hashIdx);
  const qIdx = v.indexOf("?");
  if (qIdx >= 0) v = v.slice(0, qIdx);
  if (!v.startsWith("/")) return v;
  if (v.length > 1 && v.endsWith("/")) v = v.slice(0, -1);
  return v;
}

function routeFromAppFile(file) {
  const rel = file.replace(/^app\//, "");

  if (rel === "robots.ts") return "/robots.txt";
  if (rel === "sitemap.ts") return "/sitemap.xml";
  if (rel === "not-found.tsx") return "/_not-found";

  const isPage = rel.endsWith("/page.tsx") || rel === "page.tsx";
  const isRoute = rel.endsWith("/route.ts") || rel === "route.ts";
  if (!isPage && !isRoute) return null;

  let p = rel
    .replace(/\/page\.tsx$/, "")
    .replace(/\/route\.ts$/, "")
    .replace(/^page\.tsx$/, "")
    .replace(/^route\.ts$/, "");

  const segs = p
    .split("/")
    .filter(Boolean)
    .filter((s) => !(s.startsWith("(") && s.endsWith(")")))
    .filter((s) => !s.startsWith("@"));

  const route = "/" + segs.join("/");
  return route === "/" ? "/" : route.replace(/\/$/, "");
}

function routePattern(route) {
  if (!route) return null;
  const segs = route.split("/").filter(Boolean);
  const parts = segs.map((seg) => {
    if (/^\[\.\.\.[^\]]+\]$/.test(seg)) return "(.+)";
    if (/^\[\[\.\.\.[^\]]+\]\]$/.test(seg)) return "(.*)";
    if (/^\[[^\]]+\]$/.test(seg)) return "([^/]+)";
    return seg.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  });
  return new RegExp("^/" + parts.join("/") + "$");
}

function isIconOnly(label, opening) {
  if (label && label.trim()) return false;
  // heuristic: no text label
  return true;
}

function loadFileLines(file) {
  return fs.readFileSync(path.join(ROOT, file), "utf8").split(/\r?\n/);
}

const idCache = new Map();
function pageHasId(file, id) {
  if (!id) return false;
  if (!idCache.has(file)) {
    try {
      idCache.set(file, fs.readFileSync(path.join(ROOT, file), "utf8"));
    } catch {
      idCache.set(file, "");
    }
  }
  const src = idCache.get(file);
  const re = new RegExp(`id\\s*=\\s*["']${id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["']`);
  return re.test(src);
}

const files = getFiles();
const pageAndRouteFiles = sh("find app -type f \\( -name 'page.tsx' -o -name 'route.ts' -o -name 'robots.ts' -o -name 'sitemap.ts' -o -name 'not-found.tsx' \\) | sort")
  .split("\n")
  .map((s) => s.trim())
  .filter(Boolean);

const routes = [...new Set(pageAndRouteFiles.map(routeFromAppFile).filter(Boolean))].sort();
const routeMatchers = routes.map((r) => ({ route: r, re: routePattern(r) })).filter((x) => x.re);

const records = [];

for (const file of files) {
  const full = path.join(ROOT, file);
  let content;
  try {
    content = fs.readFileSync(full, "utf8");
  } catch {
    continue;
  }

  const sf = ts.createSourceFile(file, content, ts.ScriptTarget.Latest, true, file.endsWith(".tsx") || file.endsWith(".jsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);

  const nextLinkNames = new Set();
  const buttonNames = new Set(["button"]);
  const useRouterNames = new Set();
  const routerVars = new Set();

  sf.forEachChild((n) => {
    if (!ts.isImportDeclaration(n) || !n.importClause || !n.moduleSpecifier) return;
    const moduleName = n.moduleSpecifier.text;
    const named = n.importClause.namedBindings;
    if (moduleName === "next/link") {
      if (n.importClause.name) nextLinkNames.add(n.importClause.name.text);
      if (named && ts.isNamedImports(named)) {
        for (const el of named.elements) nextLinkNames.add((el.name || el.propertyName).text);
      }
    }
    if (moduleName === "next/navigation") {
      if (named && ts.isNamedImports(named)) {
        for (const el of named.elements) {
          const orig = el.propertyName ? el.propertyName.text : el.name.text;
          if (orig === "useRouter") useRouterNames.add(el.name.text);
        }
      }
    }
    if (moduleName.includes("/ui/button")) {
      if (n.importClause.name) buttonNames.add(n.importClause.name.text);
      if (named && ts.isNamedImports(named)) {
        for (const el of named.elements) {
          const nm = el.name.text;
          if (nm.toLowerCase().includes("button")) buttonNames.add(nm);
        }
      }
    }
  });

  function walk(node) {
    if (ts.isVariableDeclaration(node) && node.initializer && ts.isCallExpression(node.initializer)) {
      const callee = node.initializer.expression;
      if (ts.isIdentifier(callee) && useRouterNames.has(callee.text) && ts.isIdentifier(node.name)) {
        routerVars.add(node.name.text);
      }
    }

    if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) {
      const opening = ts.isJsxElement(node) ? node.openingElement : node;
      const tag = getJsxTagName(opening);
      const pos = toPos(sf, opening);
      const label = ts.isJsxElement(node) ? extractJsxText(node, sf) : "";

      if (tag === "a" || nextLinkNames.has(tag) || tag === "Link") {
        const hrefAttr = getJsxAttr(opening, "href");
        const targetAttr = getJsxAttr(opening, "target");
        const relAttr = getJsxAttr(opening, "rel");
        const downloadAttr = getJsxAttr(opening, "download");
        const href = attrValueInfo(hrefAttr, sf);

        records.push({
          file,
          line: pos.line,
          col: pos.col,
          kind: tag === "a" ? "Anchor" : "Link",
          label,
          ariaLabel: attrValueInfo(getJsxAttr(opening, "aria-label"), sf).raw,
          actionRaw: href.raw,
          actionPath: normalizeRoutePath(href.normalizedPath || href.raw),
          dynamic: href.dynamic,
          target: attrValueInfo(targetAttr, sf).raw,
          rel: attrValueInfo(relAttr, sf).raw,
          download: !!downloadAttr,
          hasOnClick: !!getJsxAttr(opening, "onClick"),
          isAsChild: !!getJsxAttr(opening, "asChild"),
          type: "",
          disabled: !!getJsxAttr(opening, "disabled"),
        });
      }

      if (buttonNames.has(tag) || tag === "button") {
        const pos2 = toPos(sf, opening);
        const typeInfo = attrValueInfo(getJsxAttr(opening, "type"), sf);
        const aria = attrValueInfo(getJsxAttr(opening, "aria-label"), sf).raw;
        const onClick = getJsxAttr(opening, "onClick");
        const asChild = !!getJsxAttr(opening, "asChild");
        const disabled = !!getJsxAttr(opening, "disabled");
        const hasSpreadAttributes =
          !!opening.attributes &&
          opening.attributes.properties.some((p) => ts.isJsxSpreadAttribute(p));
        const inForm = hasAncestorTag(opening, "form");
        const contextualAsChild = hasAncestorAsChildWrapper(opening);
        const containsInteractiveChild = ts.isJsxElement(node) ? jsxContainsInteractiveChild(node, nextLinkNames) : false;
        const insideInteractiveAncestor = hasInteractiveAncestor(opening, nextLinkNames);

        records.push({
          file,
          line: pos2.line,
          col: pos2.col,
          kind: tag === "button" ? "Button" : "Button",
          label,
          ariaLabel: aria,
          actionRaw: onClick ? textOf(onClick.initializer, sf) : "",
          actionPath: "",
          dynamic: false,
          target: "",
          rel: "",
          hasOnClick: !!onClick,
          isAsChild: asChild,
          contextualAsChild,
          inForm,
          containsInteractiveChild,
          insideInteractiveAncestor,
          hasSpreadAttributes,
          type: typeInfo.raw || "",
          disabled,
          iconOnly: isIconOnly(label, opening),
        });
      }
    }

    if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)) {
      const obj = node.expression.expression;
      const prop = node.expression.name.text;
      if ((prop === "push" || prop === "replace") && ts.isIdentifier(obj) && routerVars.has(obj.text)) {
        const arg = node.arguments[0];
        const pos = toPos(sf, node);
        let raw = "";
        let normalized = "";
        let dynamic = false;
        if (arg) {
          raw = arg.getText(sf);
          if (ts.isStringLiteral(arg) || ts.isNoSubstitutionTemplateLiteral(arg)) {
            normalized = arg.text;
          } else if (ts.isTemplateExpression(arg)) {
            normalized = raw.replace(/^`|`$/g, "").replace(/\$\{[^}]+\}/g, "x");
            dynamic = true;
          } else {
            normalized = raw.replace(/\$\{[^}]+\}/g, "x");
            dynamic = true;
          }
        }
        records.push({
          file,
          line: pos.line,
          col: pos.col,
          kind: `Router.${prop}`,
          label: "",
          ariaLabel: "",
          actionRaw: raw,
          actionPath: normalizeRoutePath(normalized),
          dynamic,
          target: "",
          rel: "",
          hasOnClick: true,
          isAsChild: false,
          contextualAsChild: false,
          inForm: false,
          containsInteractiveChild: false,
          insideInteractiveAncestor: false,
          hasSpreadAttributes: false,
          type: "",
          disabled: false,
        });
      }
    }

    ts.forEachChild(node, walk);
  }

  walk(sf);
}

function validateInternalPath(p) {
  if (!p) return { valid: false, reason: "empty" };
  if (p.startsWith("http://") || p.startsWith("https://") || p.startsWith("mailto:") || p.startsWith("tel:")) {
    return { valid: true, reason: "external" };
  }
  if (p.startsWith("javascript:")) return { valid: false, reason: "javascript-href" };
  if (p.startsWith("#")) return { valid: true, reason: "hash-only" };
  if (!p.startsWith("/")) return { valid: false, reason: "relative-or-expr" };

  for (const { route, re } of routeMatchers) {
    if (re.test(p)) return { valid: true, reason: `matches:${route}` };
  }
  return { valid: false, reason: "no-route-match" };
}

for (const rec of records) {
  const v = validateInternalPath(rec.actionPath || "");
  rec.validation = v;
  rec.status = "OK";
  rec.severity = "Baja";
  rec.issue = "";

  if ((rec.kind === "Link" || rec.kind === "Anchor" || rec.kind.startsWith("Router.")) && rec.actionPath) {
    if (!v.valid && v.reason === "javascript-href") {
      rec.status = "Roto";
      rec.severity = "Alta";
      rec.issue = "Uso inválido de javascript: en navegación";
    } else if (!v.valid && v.reason === "no-route-match") {
      rec.status = "Roto";
      rec.severity = "Alta";
      rec.issue = "Ruta interna no encontrada";
    } else if ((rec.kind === "Link" || rec.kind === "Anchor") && rec.actionPath.startsWith("#")) {
      const hashId = rec.actionPath.replace(/^#/, "");
      if (!pageHasId(rec.file, hashId)) {
        rec.status = "Roto";
        rec.severity = "Media";
        rec.issue = "Anchor a id inexistente en la página";
      }
    }
  }

  if ((rec.kind === "Link" || rec.kind === "Anchor") && rec.target === "_blank") {
    const rel = (rec.rel || "").toLowerCase();
    if (!rel.includes("noopener") || !rel.includes("noreferrer")) {
      rec.status = rec.status === "Roto" ? rec.status : "Mejora";
      rec.severity = rec.status === "Roto" ? rec.severity : "Media";
      rec.issue = rec.issue || "target=_blank sin rel seguro";
    }
  }

  if (rec.kind === "Anchor" && rec.actionPath && rec.actionPath.startsWith("/") && !rec.download && !rec.actionPath.startsWith("/api/")) {
    if (rec.status === "OK") {
      rec.status = "Mejora";
      rec.severity = "Media";
      rec.issue = "Enlace interno con <a> en lugar de <Link>";
    }
  }

  if (rec.kind === "Button") {
    if (rec.iconOnly && !rec.ariaLabel) {
      rec.status = rec.status === "Roto" ? rec.status : "Mejora";
      rec.severity = rec.status === "Roto" ? rec.severity : "Media";
      rec.issue = rec.issue || "Icon button sin aria-label";
    }

    const implicitSubmit = rec.inForm && !rec.type;
    const inert =
      !rec.hasOnClick &&
      !rec.type &&
      !rec.isAsChild &&
      !rec.contextualAsChild &&
      !implicitSubmit &&
      !rec.disabled &&
      !rec.hasSpreadAttributes &&
      !rec.insideInteractiveAncestor &&
      !rec.containsInteractiveChild;
    if (inert) {
      rec.status = "Roto";
      rec.severity = "Media";
      rec.issue = "Botón sin acción explícita";
    }

    if (rec.containsInteractiveChild && !rec.isAsChild && !rec.contextualAsChild) {
      if (rec.status === "OK") {
        rec.status = "Confuso";
        rec.severity = "Media";
        rec.issue = "Anidación interactiva (Button contiene Link/Anchor)";
      }
    }

    if (rec.insideInteractiveAncestor && !rec.isAsChild && !rec.contextualAsChild) {
      if (rec.status === "OK") {
        rec.status = "Confuso";
        rec.severity = "Media";
        rec.issue = "Anidación interactiva (Link/Anchor contiene Button)";
      }
    }
  }
}

// Detect duplicates by destination/action among user-facing links/ctas.
const groups = new Map();
for (const rec of records) {
  if (rec.kind && String(rec.kind).startsWith("Router.")) continue;
  const key = rec.actionPath || rec.actionRaw;
  if (!key) continue;
  if (key.startsWith("http") || key.startsWith("mailto:") || key.startsWith("tel:")) continue;
  if (!groups.has(key)) groups.set(key, []);
  groups.get(key).push(rec);
}

for (const [key, recs] of groups.entries()) {
  if (recs.length < 2) continue;
  const labels = [...new Set(recs.map((r) => (r.ariaLabel || r.label || "").trim()).filter(Boolean))];
  if (labels.length >= 2) {
    for (const r of recs) {
      if (r.status === "OK") {
        r.status = "Redundante";
        r.severity = "Baja";
        r.issue = `Mismo destino con microcopies distintos (${labels.slice(0, 4).join(" | ")})`;
      }
    }
  }
}

const out = {
  generatedAt: new Date().toISOString(),
  routerType: fs.existsSync(path.join(ROOT, "app")) ? "App Router" : "Pages Router",
  routes,
  records,
};

fs.writeFileSync(path.join(ROOT, "scripts", "audit-interactives-output.json"), JSON.stringify(out, null, 2));

const counts = records.reduce(
  (acc, r) => {
    acc.total += 1;
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  },
  { total: 0 }
);

console.log(JSON.stringify({
  routerType: out.routerType,
  routeCount: routes.length,
  records: counts,
}, null, 2));
