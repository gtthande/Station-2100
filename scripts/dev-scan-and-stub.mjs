#!/usr/bin/env node

// Scan src/**/*.{ts,tsx,js,jsx} for imports from "@/..." and create stub modules
// for any missing targets. Heuristics:
// - paths containing /ui/ or /components/ → export React component(s) that return null
// - paths containing /hooks/ → export hooks that return a minimal object
// - otherwise → export generic functions/values
// We never overwrite existing modules.

import { promises as fs } from "node:fs";
import path from "node:path";
import url from "node:url";

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..", "");
const srcRoot = path.join(projectRoot, "src");

/**
 * Recursively list files under a directory matching extensions.
 */
async function listSourceFiles(dir) {
  const results = [];
  async function walk(current) {
    let entries;
    try {
      entries = await fs.readdir(current, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        // Skip node_modules and dist
        if (entry.name === "node_modules" || entry.name === "dist") continue;
        await walk(full);
      } else if (entry.isFile()) {
        if (/[.](ts|tsx|js|jsx)$/.test(entry.name)) {
          results.push(full);
        }
      }
    }
  }
  await walk(dir);
  return results;
}

/**
 * Parse import statements that reference "@/...".
 * Returns array of { source: string, hasDefault: boolean, named: string[], namespace: string|null, sideEffectOnly: boolean }
 */
function findAliasImports(fileContent) {
  const imports = [];
  const importRegex = /import\s+([^;]*?)\s*from\s*["'](@\/[^"']+)["'];?/g;
  const sideEffectRegex = /import\s*["'](@\/[^"']+)["'];?/g;

  // Named/default/namespace imports
  for (const match of fileContent.matchAll(importRegex)) {
    const bindings = match[1].trim();
    const source = match[2];
    let hasDefault = false;
    let named = [];
    let namespace = null;

    if (bindings.startsWith("* as ")) {
      namespace = bindings.replace(/^\* as\s+/, "").trim();
    } else {
      // Split default and the rest
      // Patterns like: default, { a, b as c } or just { a } or just default
      const parts = bindings.split(",").map((s) => s.trim()).filter(Boolean);
      for (const part of parts) {
        if (part.startsWith("{")) {
          const inner = part
            .replace(/^\{/, "")
            .replace(/\}$/, "")
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
          for (const i of inner) {
            // support aliases: x as y → export y
            const alias = i.split(/\s+as\s+/i).pop();
            if (alias) named.push(alias.trim());
          }
        } else if (part !== "") {
          hasDefault = true;
        }
      }
    }

    imports.push({ source, hasDefault, named, namespace, sideEffectOnly: false });
  }

  // Side-effect only imports
  for (const match of fileContent.matchAll(sideEffectRegex)) {
    const source = match[1];
    // Avoid duplicating entries from the first regex
    if (!imports.some((i) => i.source === source)) {
      imports.push({ source, hasDefault: false, named: [], namespace: null, sideEffectOnly: true });
    }
  }

  return imports.filter((i) => i.source.startsWith("@/"));
}

function resolveImportToCandidates(importSource) {
  // Remove '@/'
  const rel = importSource.replace(/^@\//, "");
  const base = path.join(srcRoot, rel);
  const exts = [".ts", ".tsx", ".js", ".jsx"];
  const candidates = [];
  if (path.extname(base)) {
    candidates.push(base);
  } else {
    for (const ext of exts) candidates.push(base + ext);
    for (const ext of exts) candidates.push(path.join(base, "index" + ext));
  }
  return candidates;
}

async function pathExists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

function chooseExtensionByHeuristics(importSource) {
  const lower = importSource.toLowerCase();
  if (lower.includes("/ui/") || lower.includes("/components/")) return ".tsx";
  if (lower.includes("/hooks/")) return ".ts";
  return ".ts";
}

function isComponentPath(importSource) {
  const lower = importSource.toLowerCase();
  return lower.includes("/ui/") || lower.includes("/components/");
}

function isHookPath(importSource) {
  return importSource.toLowerCase().includes("/hooks/");
}

function toValidIdentifier(name) {
  return name.replace(/[^a-zA-Z0-9_$]/g, "_");
}

function createStubContent(importDesc, importSource) {
  const { hasDefault, named, namespace, sideEffectOnly } = importDesc;
  const isComponent = isComponentPath(importSource);
  const isHook = isHookPath(importSource);

  const lines = [];

  // Side-effect only import → export nothing
  if (sideEffectOnly && !hasDefault && named.length === 0 && !namespace) {
    lines.push("// Auto-generated stub module");
    return lines.join("\n") + "\n";
  }

  const makeComponent = (name) => {
    const id = toValidIdentifier(name);
    return `export function ${id}(){\n  return null;\n}`;
  };

  const makeHook = (name) => {
    const id = toValidIdentifier(name);
    return `export function ${id}(){\n  return {};\n}`;
  };

  const makeGeneric = (name) => {
    const id = toValidIdentifier(name);
    return `export function ${id}(){\n  return undefined;\n}`;
  };

  // Named exports
  for (const name of named) {
    if (isComponent) lines.push(makeComponent(name));
    else if (isHook) lines.push(makeHook(name));
    else lines.push(makeGeneric(name));
  }

  // Namespace import: provide at least one named export to bind to
  if (namespace) {
    const name = "stub";
    if (isComponent) lines.push(makeComponent(name));
    else if (isHook) lines.push(makeHook(name));
    else lines.push(makeGeneric(name));
  }

  // Default export
  if (hasDefault) {
    const defaultName = isComponent ? "Component" : isHook ? "useHook" : "defaultExport";
    if (isComponent) {
      lines.push(`export default function ${defaultName}(){\n  return null;\n}`);
    } else if (isHook) {
      lines.push(`export default function ${defaultName}(){\n  return {};\n}`);
    } else {
      lines.push(`export default function ${defaultName}(){\n  return undefined;\n}`);
    }
  }

  if (lines.length === 0) {
    lines.push("// Auto-generated stub module");
  }
  return lines.join("\n\n") + "\n";
}

async function ensureDirectory(filePath) {
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });
}

async function main() {
  const files = await listSourceFiles(srcRoot);
  const missingModules = new Map(); // key: module import string, value: Set of import descriptors

  for (const file of files) {
    let content;
    try {
      content = await fs.readFile(file, "utf8");
    } catch {
      continue;
    }
    const imports = findAliasImports(content);
    for (const imp of imports) {
      const candidates = resolveImportToCandidates(imp.source);
      let exists = false;
      for (const c of candidates) {
        // stop early if any candidate exists
        if (await pathExists(c)) {
          exists = true;
          break;
        }
      }
      if (!exists) {
        if (!missingModules.has(imp.source)) missingModules.set(imp.source, []);
        missingModules.get(imp.source).push(imp);
      }
    }
  }

  let createdCount = 0;
  for (const [importSource, importDescs] of missingModules.entries()) {
    // Merge descriptors: if any require default/named, union them
    const merged = {
      source: importSource,
      hasDefault: importDescs.some((d) => d.hasDefault),
      named: Array.from(new Set(importDescs.flatMap((d) => d.named))),
      namespace: importDescs.some((d) => d.namespace) ? "ns" : null,
      sideEffectOnly: importDescs.every((d) => d.sideEffectOnly),
    };

    const chosenExt = chooseExtensionByHeuristics(importSource);
    const rel = importSource.replace(/^@\//, "");
    const base = path.join(srcRoot, rel);
    let targetPath = base + chosenExt;

    // If import looks like a directory import, place index file
    const looksLikeDir = !path.extname(rel) && (rel.endsWith("/") || !(await pathExists(base + chosenExt)));
    if (looksLikeDir) {
      targetPath = path.join(base, "index" + chosenExt);
    }

    if (await pathExists(targetPath)) {
      // Respect existing files; skip
      continue;
    }

    const content = createStubContent(merged, importSource);
    await ensureDirectory(targetPath);
    await fs.writeFile(targetPath, content, "utf8");
    createdCount += 1;
    // eslint-disable-next-line no-console
    console.log(`Created stub: ${path.relative(projectRoot, targetPath)} for ${importSource}`);
  }

  // eslint-disable-next-line no-console
  console.log(`Scan complete. Created ${createdCount} stub module(s).`);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exitCode = 1;
});


