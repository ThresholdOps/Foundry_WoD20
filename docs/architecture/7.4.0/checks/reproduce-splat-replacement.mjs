import { resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
const root = resolve(process.argv[2] ?? fileURLToPath(new URL("../../../../", import.meta.url)));
const { installFoundryEnv } = await import(pathToFileURL(resolve(root, "tests/helpers/foundry-env.mjs")).href);
installFoundryEnv();
globalThis.Dialog = { confirm: options => options.yes() };
const { default: DropHelper } = await import(pathToFileURL(resolve(root, "module/scripts/drop-helpers.js")).href);
let deletes = 0;
const actor = {
  items: [{ id: "splat-old", type: "Splat" }],
  deleteEmbeddedDocuments: async () => { deletes++; }
};
try {
  await DropHelper.DropSplatToActor(actor, { type: "Splat" });
  console.log(JSON.stringify({ probe: "PROBE-001", error: null, deletes, reproduced: false }));
  process.exitCode = 1;
} catch (error) {
  const reproduced = error.name === "ReferenceError" && /idsToDelete/.test(error.message) && deletes === 0;
  console.log(JSON.stringify({ probe: "PROBE-001", error: error.name, message: error.message, deletes, reproduced, scope: "Node fixture; NOT Foundry runtime" }));
  if (!reproduced) process.exitCode = 1;
}
