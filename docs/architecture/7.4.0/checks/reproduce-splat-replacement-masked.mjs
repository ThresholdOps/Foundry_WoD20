// PROBE-002: what happens in DropSplatToActor once the PROBE-001 ReferenceError is removed?
// Copies the source tree to a temp dir, declares idsToDelete in the replacement branch (line 569),
// and runs the same fixture as PROBE-001. Read-only for the repository. Node fixture, NOT Foundry runtime.
import { cpSync, mkdtempSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
const root = resolve(process.argv[2] ?? fileURLToPath(new URL("../../../../", import.meta.url)));
const work = mkdtempSync(join(tmpdir(), "wod20-probe002-"));
for (const d of ["module", "tests"]) cpSync(join(root, d), join(work, d), { recursive: true });
const file = join(work, "module/scripts/drop-helpers.js");
const src = readFileSync(file, "utf8");
const patched = src.replace("            idsToDelete = itemsToDelete.map(i => i.id);", "            const idsToDelete = itemsToDelete.map(i => i.id);");
if (patched === src) { console.log(JSON.stringify({ probe: "PROBE-002", error: "patch anchor not found; source changed" })); process.exit(2); }
writeFileSync(file, patched);
const { installFoundryEnv } = await import(pathToFileURL(join(work, "tests/helpers/foundry-env.mjs")).href);
installFoundryEnv();
globalThis.Dialog = { confirm: o => o.yes() };
const { default: DropHelper } = await import(pathToFileURL(file).href);
let deletes = 0;
const actor = { items: [{ id: "splat-old", type: "Splat" }], deleteEmbeddedDocuments: async () => { deletes++; } };
try {
  await DropHelper.DropSplatToActor(actor, { type: "Splat" });
  console.log(JSON.stringify({ probe: "PROBE-002", error: null, deletes, reproduced: false }));
  process.exitCode = 1;
} catch (e) {
  const reproduced = e.name === "TypeError" && /deleteEmbeddedDocuments/.test(e.message) && deletes === 0;
  console.log(JSON.stringify({ probe: "PROBE-002", error: e.name, message: e.message, deletes, reproduced, scope: "Node fixture on patched temp copy; NOT Foundry runtime" }));
  if (!reproduced) process.exitCode = 1;
} finally { rmSync(work, { recursive: true, force: true }); }
