#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const INTERACTIVES_PATH = path.join(ROOT, "scripts", "audit-interactives-output.json");
const HTTP_PATH = path.join(ROOT, "scripts", "audit-http-status.json");
const HTTP_FOLLOW_PATH = path.join(ROOT, "scripts", "audit-http-follow.json");
const OUT_PATH = path.join(ROOT, "reports", "qa-ux-nextjs-audit-2026-02-19.md");

const data = JSON.parse(fs.readFileSync(INTERACTIVES_PATH, "utf8"));
const http = fs.existsSync(HTTP_PATH) ? JSON.parse(fs.readFileSync(HTTP_PATH, "utf8")) : [];
const httpFollow = fs.existsSync(HTTP_FOLLOW_PATH) ? JSON.parse(fs.readFileSync(HTTP_FOLLOW_PATH, "utf8")) : [];
const httpMap = new Map(http.map((x) => [x.path, x.status]));
const httpFollowMap = new Map(httpFollow.map((x) => [x.path, x]));

const SEV_RANK = { Alta: 3, Media: 2, Baja: 1 };
const STATUS_RANK = { Roto: 5, Confuso: 4, Mejora: 3, Redundante: 2, OK: 1 };

function esc(v) {
  if (v === null || v === undefined) return "";
  return String(v)
    .replace(/\|/g, "\\|")
    .replace(/\n/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function fileToRoute(file) {
  if (!file.startsWith("app/")) return null;
  let rel = file.replace(/^app\//, "");
  if (rel === "not-found.tsx") return "/_not-found";
  if (rel === "layout.tsx") return "/";
  if (rel.endsWith("/page.tsx")) {
    rel = rel.replace(/\/page\.tsx$/, "");
  } else if (rel === "page.tsx") {
    rel = "";
  } else {
    return null;
  }

  const segs = rel
    .split("/")
    .filter(Boolean)
    .filter((s) => !(s.startsWith("(") && s.endsWith(")")))
    .filter((s) => !s.startsWith("@"));

  return "/" + segs.join("/");
}

function locationForRecord(r) {
  const f = r.file;
  const line = r.line;
  if (f.includes("site-header")) return `header > branding (${f}:${line})`;
  if (f.includes("site-nav")) return `header > navbar/menu (${f}:${line})`;
  if (f.includes("site-footer")) return `footer (${f}:${line})`;
  if (f.includes("layout.tsx")) return `layout > nav/sidebar (${f}:${line})`;
  if (f.includes("dropdown") || f.includes("menu")) return `dropdown/menu (${f}:${line})`;
  if (f.includes("dialog") || f.includes("modal") || f.includes("drawer") || f.includes("sheet")) return `modal/dialog/drawer (${f}:${line})`;
  if (f.includes("form")) return `formulario (${f}:${line})`;
  if (f.includes("card") || f.includes("carousel")) return `card/lista/carousel CTA (${f}:${line})`;
  if (f.startsWith("app/")) return `página (${f}:${line})`;
  return `componente compartido (${f}:${line})`;
}

function actionExpected(r) {
  if (r.kind === "Router.push" || r.kind === "Router.replace") {
    if (r.actionPath) return `Navegar programáticamente a ${r.actionPath}`;
    return "Navegación programática";
  }

  if (r.kind === "Link" || r.kind === "Anchor") {
    if (!r.actionPath && !r.actionRaw) return "Navegar a destino del enlace";
    const target = r.actionPath || r.actionRaw;
    if (target.startsWith("#")) return `Scroll al ancla ${target}`;
    if (target.startsWith("http://") || target.startsWith("https://") || target.startsWith("mailto:") || target.startsWith("tel:")) {
      return `Abrir recurso externo (${target})`;
    }
    return `Navegar a ${target}`;
  }

  if (r.kind === "Button") {
    if (r.type === "submit" || (r.inForm && !r.type)) return "Enviar formulario";
    if (r.hasOnClick) return "Ejecutar handler onClick";
    if (r.isAsChild || r.contextualAsChild) return "Delegar acción al componente hijo/contenedor";
    if (r.label) return `Ejecutar acción "${r.label}"`;
    return "Ejecutar acción asociada al botón";
  }

  return "Acción interactiva";
}

function staticHttpNote(pathname) {
  if (!pathname || !pathname.startsWith("/")) return "";
  if (/\bx\b/.test(pathname)) return "";
  const followed = httpFollowMap.get(pathname);
  if (followed && followed.finalStatus) {
    if (followed.redirects > 0) {
      return `HTTP ${followed.finalStatus} final en local tras ${followed.redirects} redirección(es) (${followed.finalUrl}).`;
    }
    return `HTTP ${followed.finalStatus} en local.`;
  }

  const status = httpMap.get(pathname);
  if (!status) return "";
  if (status >= 200 && status < 300) return `HTTP ${status} en local.`;
  if (status >= 300 && status < 400) return `HTTP ${status} en local (redirección).`;
  if (status >= 400) return `HTTP ${status} en local.`;
  return "";
}

function actionObserved(r) {
  const path = r.actionPath || r.actionRaw || "";
  const httpNote = staticHttpNote(r.actionPath || "");

  if (r.status === "Roto") {
    if (r.issue === "Ruta interna no encontrada") {
      return `No hay match de ruta para ${path || "(vacía)"} en App Router. ${httpNote}`.trim();
    }
    if (r.issue === "Botón sin acción explícita") {
      return "No se detecta onClick/type/asChild; el botón no ejecuta acción directa.";
    }
    if (r.issue === "Uso inválido de javascript: en navegación") {
      return "Uso de href con javascript:, patrón inválido para navegación de Next.js.";
    }
    if (r.issue === "Anchor a id inexistente en la página") {
      return "El hash no tiene un id correspondiente en la página.";
    }
  }

  if (r.status === "Confuso") {
    return "Funciona por composición, pero con anidación interactiva inválida (impacta semántica/accesibilidad).";
  }

  if (r.status === "Mejora") {
    if (r.issue === "Icon button sin aria-label") return "La acción existe, pero el botón no tiene nombre accesible para lector de pantalla.";
    if (r.issue === "target=_blank sin rel seguro") return "Abre nueva pestaña sin rel seguro completo (noopener noreferrer).";
    if (r.issue === "Enlace interno con <a> en lugar de <Link>") return "Navega, pero pierde optimizaciones de Next.js (prefetch/routing).";
  }

  if (r.status === "Redundante") {
    return `Acción válida, pero duplicada/competida para ${path || "misma acción"} con microcopies diferentes.`;
  }

  if (httpNote) return `Acción válida. ${httpNote}`;
  return "Acción válida según revisión estática.";
}

function recommendation(r) {
  if (r.status === "OK") return "Sin cambios obligatorios; mantener comportamiento actual.";

  switch (r.issue) {
    case "Ruta interna no encontrada":
      return "Corregir href/route push a una ruta existente o crear la ruta dinámica faltante con su página de detalle.";
    case "Botón sin acción explícita":
      return "Agregar onClick, type=submit dentro de form, o convertir a `asChild` + `Link` según el flujo esperado.";
    case "Uso inválido de javascript: en navegación":
      return "Reemplazar `Link href=\"javascript:...\"` por `Button` con `router.back()` o enlace seguro.";
    case "Icon button sin aria-label":
      return "Agregar `aria-label` descriptivo y validar orden/foco con teclado.";
    case "target=_blank sin rel seguro":
      return "Agregar `rel=\"noopener noreferrer\"` en enlaces con `target=\"_blank\"`.";
    case "Enlace interno con <a> en lugar de <Link>":
      return "Cambiar `<a href=\"/ruta\">` por `<Link href=\"/ruta\">` para consistencia de App Router.";
    case "Anidación interactiva (Link/Anchor contiene Button)":
      return "Evitar anidar interactivos; usar `Button asChild` con `Link` o estilizar `Link` directamente como botón.";
    default:
      if (r.status === "Redundante") return "Unificar microcopy y jerarquía de CTA para que cada acción tenga un único primario por contexto.";
      return "Ajustar implementación para alinear expectativa del CTA con resultado real.";
  }
}

function codeChange(r) {
  const loc = `\`${r.file}:${r.line}\``;

  if (r.status === "OK") return `${loc}: sin cambios.`;

  switch (r.issue) {
    case "Ruta interna no encontrada": {
      const path = r.actionPath || r.actionRaw || "[ruta]";
      return `${loc}: actualizar destino \`${esc(path)}\` por ruta existente o crear ` +
        "`app/.../[id]/page.tsx` correspondiente.";
    }
    case "Botón sin acción explícita":
      return `${loc}: definir ` + "`onClick`/`type=\"submit\"` o usar `Button asChild` + `Link`.";
    case "Uso inválido de javascript: en navegación":
      return `${loc}: reemplazar por ` + "`const router = useRouter(); <Button onClick={() => router.back()}>...`";
    case "Icon button sin aria-label":
      return `${loc}: agregar ` + "`aria-label=\"...\"`";
    case "target=_blank sin rel seguro":
      return `${loc}: añadir ` + "`rel=\"noopener noreferrer\"`";
    case "Enlace interno con <a> en lugar de <Link>":
      return `${loc}: importar ` + "`Link` de `next/link` y sustituir `<a>` interno.";
    case "Anidación interactiva (Link/Anchor contiene Button)":
      return `${loc}: refactor a ` + "`<Button asChild><Link .../></Button>` (o `Link` estilizado).";
    default:
      return `${loc}: unificar copy/jerarquía del CTA y evitar duplicidad de acción.`;
  }
}

function pageComponent(r) {
  const route = fileToRoute(r.file);
  if (route) return `\`${route}\` · \`${r.file}\``;
  return `shared · \`${r.file}\``;
}

function typeLabel(r) {
  if (r.kind === "Button") {
    if (!r.label && r.ariaLabel) return "IconButton";
    if (!r.label && !r.ariaLabel) return "IconButton";
    return "Button";
  }
  if (r.kind === "Link" || r.kind === "Anchor") return "Link";
  if (r.kind.startsWith("Router.")) return "CTA (router.push/replace)";
  return r.kind;
}

function labelFor(r) {
  if (r.label && r.ariaLabel) return `${r.label} / ${r.ariaLabel}`;
  if (r.label) return r.label;
  if (r.ariaLabel) return `[aria] ${r.ariaLabel}`;
  return "[sin label]";
}

function summarizeCounts(records) {
  const out = { total: records.length };
  for (const r of records) out[r.status] = (out[r.status] || 0) + 1;
  return out;
}

function topIssues(records, n = 10) {
  const filtered = records.filter((r) => r.status !== "OK");
  filtered.sort((a, b) => {
    const s1 = SEV_RANK[b.severity] - SEV_RANK[a.severity];
    if (s1 !== 0) return s1;
    const s2 = STATUS_RANK[b.status] - STATUS_RANK[a.status];
    if (s2 !== 0) return s2;
    return (a.file + a.line).localeCompare(b.file + b.line);
  });
  return filtered.slice(0, n);
}

function redundantGroups(records) {
  const byAction = new Map();
  for (const r of records) {
    if (r.status !== "Redundante") continue;
    const action = r.actionPath || r.actionRaw || "[sin acción]";
    if (!byAction.has(action)) byAction.set(action, []);
    byAction.get(action).push(r);
  }
  const groups = [];
  for (const [action, recs] of byAction.entries()) {
    const labels = [...new Set(recs.map((r) => labelFor(r)).filter(Boolean))];
    if (labels.length < 2) continue;
    groups.push({ action, count: recs.length, labels, files: [...new Set(recs.map((r) => `${r.file}:${r.line}`))] });
  }
  groups.sort((a, b) => b.count - a.count);
  return groups;
}

function routeMap(routes) {
  const groups = {
    public: [],
    auth: [],
    admin: [],
    aliado: [],
    distributor: [],
    perfil: [],
    api: [],
    other: [],
  };

  for (const r of routes) {
    if (r.startsWith("/api/")) groups.api.push(r);
    else if (r.startsWith("/admin")) groups.admin.push(r);
    else if (r.startsWith("/auth")) groups.auth.push(r);
    else if (r.startsWith("/aliado")) groups.aliado.push(r);
    else if (r.startsWith("/distributor") || r.startsWith("/distribuidor")) groups.distributor.push(r);
    else if (r.startsWith("/perfil")) groups.perfil.push(r);
    else if (r.startsWith("/")) groups.public.push(r);
    else groups.other.push(r);
  }

  return groups;
}

const records = [...data.records].sort((a, b) => {
  const sev = (SEV_RANK[b.severity] || 0) - (SEV_RANK[a.severity] || 0);
  if (sev !== 0) return sev;
  const st = (STATUS_RANK[b.status] || 0) - (STATUS_RANK[a.status] || 0);
  if (st !== 0) return st;
  if (a.file !== b.file) return a.file.localeCompare(b.file);
  return a.line - b.line;
});

const counts = summarizeCounts(records);
const top10 = topIssues(records, 10);
const redundants = redundantGroups(records);
const map = routeMap(data.routes);
const followLoops = httpFollow.filter((x) => x.finalStatus === 0 || x.redirects >= 8).length;
const followNotFound = httpFollow.filter((x) => x.finalStatus === 404 || x.finalStatus === 500).length;
const followRedirected = httpFollow.filter((x) => x.redirects > 0).length;
const routeNoMatchCount = records.filter((r) => r.issue === "Ruta interna no encontrada").length;
const jsHrefCount = records.filter((r) => r.issue === "Uso inválido de javascript: en navegación").length;
const blankRelCount = records.filter((r) => r.issue === "target=_blank sin rel seguro").length;
const internalAnchorCount = records.filter((r) => r.issue === "Enlace interno con <a> en lugar de <Link>").length;
const inertButtonCount = records.filter((r) => r.issue === "Botón sin acción explícita").length;

const md = [];
md.push(`# Auditoría QA + UX de Interacciones (Next.js)`);
md.push(``);
md.push(`Fecha de auditoría: **2026-02-19**`);
md.push(``);
md.push(`## Metodología`);
md.push(`- Router detectado: **${data.routerType}** (estructura basada en \`app/\`).`);
md.push(`- Mapa real de rutas desde archivos de enrutamiento: **${data.routes.length} rutas**.`);
md.push(`- Inventario estático de interacciones: \`Link\`, \`Anchor\`, \`Button\`, \`router.push/replace\`.`);
md.push(`- Validación runtime local de destinos internos estáticos por HTTP (200/3xx/4xx) y seguimiento de redirects para detectar loops.`);
md.push(``);
md.push(`## Mapa de Navegación (Sitemap real)`);
md.push(`- Public: **${map.public.length}**`);
md.push(`- Auth: **${map.auth.length}**`);
md.push(`- Admin: **${map.admin.length}**`);
md.push(`- Aliado: **${map.aliado.length}**`);
md.push(`- Distributor/Distribuidor: **${map.distributor.length}**`);
md.push(`- Perfil: **${map.perfil.length}**`);
md.push(`- API: **${map.api.length}**`);
md.push(``);
md.push(`Rutas public principales detectadas:`);
md.push(`- ${map.public.slice(0, 20).map((x) => `\`${x}\``).join(", ")}`);
md.push(``);
md.push(`## Resumen Ejecutivo`);
md.push(`- Elementos interactivos auditados: **${counts.total}**.`);
md.push(`- Estado: **OK ${counts.OK || 0}**, **Roto ${counts.Roto || 0}**, **Confuso ${counts.Confuso || 0}**, **Mejora ${counts.Mejora || 0}**, **Redundante ${counts.Redundante || 0}**.`);
if (routeNoMatchCount || jsHrefCount) {
  md.push(`- Hallazgos críticos de navegación: **${routeNoMatchCount} rutas internas sin match** + **${jsHrefCount} uso(s) inválido(s) de javascript:**.`);
} else {
  md.push(`- Hallazgos críticos de navegación: **sin rutas internas rotas críticas** en el barrido actual.`);
}
md.push(`- Riesgo UX dominante: **microcopy duplicada para la misma acción** y **icon buttons sin aria-label**.`);
if (httpFollow.length) {
  md.push(`- Verificación de redirects/loops (${httpFollow.length} rutas estáticas): **${followRedirected} redirecciones**, **${followNotFound} not found**, **${followLoops} loops detectados**.`);
}
md.push(``);
md.push(`### Top 10 Issues por severidad`);
let idx = 1;
for (const r of top10) {
  md.push(`${idx}. **[${r.severity}/${r.status}]** ${r.issue} — \`${r.file}:${r.line}\` (${labelFor(r)} → ${r.actionPath || r.actionRaw || "sin acción"})`);
  idx += 1;
}
md.push(``);
md.push(`### CTAs redundantes agrupados (grupo → recomendación → CTA que queda)`);
for (const g of redundants.slice(0, 12)) {
  const primary = g.labels[0];
  const action = g.action;
  md.push(`- **${action}** (${g.count} CTAs): ${g.labels.slice(0, 6).join(" | ")} → unificar a un solo copy primario por contexto → dejar **${primary}** como principal.`);
}
md.push(``);
md.push(`### Quick Wins (rápidos)`);
if (routeNoMatchCount === 0 && jsHrefCount === 0) {
  md.push(`- Navegación crítica saneada: no se detectan rutas rotas de alta severidad en esta iteración.`);
}
if (blankRelCount > 0) {
  md.push(`- Añadir \`rel=\"noopener noreferrer\"\` en enlaces con \`target=\"_blank\"\` (**${blankRelCount} pendiente(s)**).`);
}
if (internalAnchorCount > 0) {
  md.push(`- Sustituir \`<a href=\"/ruta-interna\">\` por \`<Link href=\"/ruta-interna\">\` (**${internalAnchorCount} pendiente(s)**).`);
}
if (inertButtonCount > 0) {
  md.push(`- Conectar botones sin acción explícita (**${inertButtonCount} detectados**) con handler real o \`asChild\` + \`Link\`.`);
}
if (blankRelCount === 0 && internalAnchorCount === 0 && inertButtonCount === 0) {
  md.push(`- No quedan quick wins de validación automática pendientes.`);
}
md.push(``);
md.push(`### Cambios estructurales`);
md.push(`- Unificar nomenclatura y jerarquía de CTA primaria/secundaria para destinos repetidos (home, blog, auth, admin).`);
md.push(`- Cerrar flujos incompletos donde hay botones placeholder (settings, contactos, share, acciones rápidas) con API/handler real.`);
md.push(`- Mantener composición semántica: preferir \`<Button asChild><Link/></Button>\` y evitar anidación interactiva incorrecta.`);
md.push(``);
md.push(`### Recomendaciones de consistencia`);
md.push(`- Naming CTA:`);
md.push(`  usar verbo + resultado (ej: "Ver productos", "Crear lead", "Volver a CRM").`);
md.push(`- Jerarquía:`);
md.push(`  un CTA primario por bloque, resto secundarios/ghost.`);
md.push(`- Ubicación:`);
md.push(`  CTA primaria al final de card/form; links informativos en nivel visual inferior.`);
md.push(`- Next.js routing:`);
md.push(`  evitar mezclar rutas \`/distribuidor/*\` y \`/distributor/*\` para el mismo rol; definir canónica + redirect.`);
md.push(``);
md.push(`### Analytics/Tracking (extra)`);
md.push(`- Se detecta tracking en checkout, add/remove cart, búsqueda y widgets de Clientify.`);
md.push(`- No hay una capa homogénea de tracking de click para CTAs principales de navegación (home/header/cards).`);
md.push(`- Recomendación: centralizar helper \`trackCtaClick({cta_id, location, destination})\` y aplicarlo en CTAs de alto valor.`);
md.push(``);
md.push(`### PR-style fixes mínimas sugeridas (rutas inválidas claras)`);
if (routeNoMatchCount > 0 || jsHrefCount > 0) {
  const pendingCritical = records
    .filter((r) => r.issue === "Ruta interna no encontrada" || r.issue === "Uso inválido de javascript: en navegación")
    .slice(0, 4);
  pendingCritical.forEach((r, i) => {
    md.push(`${i + 1}. \`${r.file}:${r.line}\`: ${r.issue} (${r.actionPath || r.actionRaw || "sin destino"}).`);
  });
} else {
  md.push(`1. \`app/auth/forgot-password/page.tsx\` + \`app/auth/reset-password/page.tsx\`: flujo de recuperación implementado.`);
  md.push(`2. \`app/admin/cupones/[id]/page.tsx\`: detalle de cupón implementado.`);
  md.push(`3. \`app/aliado/leads/[id]/page.tsx\`: detalle de lead implementado.`);
  md.push(`4. \`app/perfil/listas-regalo/[id]/page.tsx\`, \`app/perfil/ordenes/[id]/page.tsx\`, \`app/perfil/wishlists/[id]/page.tsx\`: rutas de detalle implementadas.`);
}
md.push(``);
md.push(`## Tabla Completa de Elementos Interactivos`);
md.push(`| Página/Componente | Selector / ubicación | Label visible / aria-label | Tipo | Acción esperada | Acción real observada | Estado | Severidad | Recomendación concreta | Propuesta de cambio en código |`);
md.push(`|---|---|---|---|---|---|---|---|---|---|`);

for (const r of records) {
  const row = [
    pageComponent(r),
    locationForRecord(r),
    labelFor(r),
    typeLabel(r),
    actionExpected(r),
    actionObserved(r),
    r.status,
    r.severity,
    recommendation(r),
    codeChange(r),
  ].map(esc);

  md.push(`| ${row.join(" | ")} |`);
}

md.push(``);
md.push(`## Cobertura e2e mínima recomendada (Playwright)`);
md.push(`- \`navigation.spec.ts\`: validar header/footer/nav/sidebar y que no haya 404 en clicks principales.`);
md.push(`- \`critical-ctas.spec.ts\`: home CTA primario, producto->carrito->checkout, auth login/signup.`);
md.push(`- \`a11y-ctas.spec.ts\`: foco con teclado, icon buttons con \`aria-label\`, ausencia de buttons mudos.`);
md.push(`- \`links-health.spec.ts\`: crawl de \`a[href^=\"/\"]\` y assert de HTTP/route client-side.`);

fs.writeFileSync(OUT_PATH, md.join("\n"));
console.log(`Report written: ${OUT_PATH}`);
console.log(`Rows: ${records.length}`);
