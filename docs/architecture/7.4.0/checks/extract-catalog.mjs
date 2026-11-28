import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";
const root = resolve(process.argv[2] ?? fileURLToPath(new URL("../../../../", import.meta.url)));
const read = p => JSON.parse(readFileSync(resolve(root, p), "utf8"));
const { wod } = await import(pathToFileURL(resolve(root, "module/config.js")).href);
class Model {}
globalThis.foundry = {
  abstract: { DataModel: Model, TypeDataModel: Model },
  data: { fields: new Proxy({}, { get: (_, kind) => class {
    constructor(...args) { this.kind = kind; this.args = args; }
  } }) }
};
const paths = {
  ActorPC: "module/actor/datamodel/pc-actor-datamodel.js",
  Ability: "module/items/datamodel/ability-item-datamodel.js",
  Advantage: "module/items/datamodel/advantage-item-datamodel.js",
  Sphere: "module/items/datamodel/sphere-item-datamodel.js",
  Realm: "module/items/datamodel/realm-item-datamodel.js",
  Splat: "module/items/datamodel/spalt-item-datamodel.js"
};
function describe(v) {
  if (v?.kind) {
    if (v.kind === "SchemaField") return { kind: v.kind, fields: describe(v.args[0]), options: v.args[1] };
    if (v.kind === "ArrayField") return { kind: v.kind, element: describe(v.args[0]), options: v.args[1] };
    return { kind: v.kind, options: v.args[0] };
  }
  return Object.fromEntries(Object.entries(v).map(([k, value]) => [k, describe(value)]));
}
const models = {};
for (const [name, path] of Object.entries(paths)) {
  const { default: C } = await import(pathToFileURL(resolve(root, path)).href);
  models[name] = { path, schema: describe(C.defineSchema()) };
}
const template = read("template.json");
console.log(JSON.stringify({
  schema_version: 1,
  source_version: read("system.json").version,
  method: "Execute defineSchema with descriptor-only field stubs; NOT Foundry validation or document preparation. Run only against trusted source.",
  config: { sheettype: wod.sheettype, splat: wod.splat, era: wod.era, variant: wod.variant, bonus: wod.bonus },
  actor_types: template.Actor.types,
  item_types: template.Item.types,
  models
}, null, 2));
