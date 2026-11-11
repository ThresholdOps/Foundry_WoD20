import BonusHelper from "./bonus-helpers.js";
import { calculateTotals } from "./totals.js";

const ATTRIBUTES = ["strength", "dexterity", "stamina"];
const queues = new Map();
const pendingTotals = new Set();
const validValue = value => typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
const markerOf = item => item?.flags?.worldofdarkness?.bloodBuff;

export class BloodBuffError extends Error {
    constructor(code, message, { conflicts = [], warnings = [], cause } = {}) {
        super(message);
        this.name = "BloodBuffError";
        this.code = code;
        this.conflicts = conflicts;
        this.warnings = warnings;
        if (cause) this.cause = cause;
    }
}

function requireActor(actor) {
    if (!actor || typeof actor.uuid !== "string" || actor.uuid === "" || !actor.items) {
        throw new BloodBuffError("INVALID_ACTOR", "A persisted actor with a UUID and items is required");
    }
}

function requireMutationAccess(actor) {
    if (actor.type !== "PC") {
        throw new BloodBuffError("NOT_PC", "Blood Buff requires a PC actor");
    }
    if (actor.isOwner !== true) {
        throw new BloodBuffError("NOT_OWNER", "Actor owner permission is required");
    }
    if (actor.system?.settings?.variant === "earthbound") {
        throw new BloodBuffError("VARIANT_EXCLUDED", "Earthbound actors cannot use Blood Buff");
    }
    const bloodPools = [...actor.items].filter(item =>
        item.type === "Advantage" && item.system?.id === "bloodpool"
    );
    if (bloodPools.length === 0) {
        throw new BloodBuffError("NO_BLOODPOOL", "A Blood Pool Advantage is required");
    }
    if (!bloodPools.some(item => item.system?.settings?.isvisible === true)) {
        throw new BloodBuffError("BLOODPOOL_HIDDEN", "A visible Blood Pool Advantage is required");
    }
}

function requireAttribute(attribute) {
    if (!ATTRIBUTES.includes(attribute)) {
        throw new BloodBuffError("INVALID_ATTRIBUTE", "Blood Buff supports strength, dexterity, and stamina");
    }
}

function requireNumber(value, absolute) {
    if (typeof value !== "number" || !Number.isSafeInteger(value) || (absolute && value < 0)) {
        throw new BloodBuffError("INVALID_VALUE", "Blood Buff value must be a valid integer");
    }
}

function enqueue(actor, task) {
    requireActor(actor);
    const previous = queues.get(actor.uuid) ?? Promise.resolve();
    const operation = previous.then(task);
    const settled = operation.then(() => undefined, () => undefined);
    queues.set(actor.uuid, settled);
    void settled.then(() => {
        if (queues.get(actor.uuid) === settled) queues.delete(actor.uuid);
    });
    return operation;
}

function inspect(actor) {
    const groups = Object.fromEntries(ATTRIBUTES.map(attribute => [attribute, []]));
    for (const item of actor.items) {
        const marker = markerOf(item);
        if (Object.hasOwn(groups, marker)) groups[marker].push(item);
    }

    const canonical = {};
    const missing = [];
    const conflicts = [];
    const warnings = [];
    const updates = new Map();
    const duplicateIds = [];

    for (const attribute of ATTRIBUTES) {
        const group = groups[attribute].sort((a, b) => {
            const left = String(a._id);
            const right = String(b._id);
            return left < right ? -1 : left > right ? 1 : 0;
        });
        if (!group.length) {
            missing.push(attribute);
            continue;
        }
        canonical[attribute] = group[0];

        for (const item of group) {
            if (item.type !== "Bonus") {
                conflicts.push({ code: "WRONG_DOCUMENT_TYPE", attribute, itemId: item._id });
            }
        }
        for (const item of group.slice(1)) {
            if (item.type === "Bonus" && item.system?.value === 0) {
                duplicateIds.push(item._id);
                warnings.push({ code: "DUPLICATE_ZERO", attribute, itemId: item._id });
            } else {
                conflicts.push({ code: "BLOCKING_DUPLICATE", attribute, itemId: item._id });
            }
        }

        const item = group[0];
        if (item.type !== "Bonus") continue;
        const system = item.system ?? {};
        if (typeof system.isactive !== "boolean") {
            conflicts.push({ code: "INVALID_ACTIVE_STATE", attribute, itemId: item._id });
            continue;
        }
        const update = { _id: item._id };
        const repair = (field, actual, expected) => {
            if (actual === expected) return;
            update["system." + field] = expected;
            warnings.push({ code: "REPAIR_REQUIRED", attribute, itemId: item._id, field });
        };
        repair("type", system.type, "attribute_buff");
        repair("settingtype", system.settingtype, attribute);
        repair("parentid", system.parentid, "");
        repair("version", system.version, game.system.version);
        repair("isremovable", system.isremovable, false);
        if (!validValue(system.value)) {
            repair("value", system.value, 0);
            repair("isactive", system.isactive, false);
        }
        if (Object.keys(update).length > 1) updates.set(item._id, update);
    }

    const attributes = {};
    for (const attribute of ATTRIBUTES) {
        const item = canonical[attribute];
        const storedValue = item ? item.system?.value : 0;
        const active = item?.system?.isactive === true;
        attributes[attribute] = {
            storedValue,
            effectiveValue: active && validValue(storedValue) ? storedValue : 0,
            isactive: active
        };
    }
    return { canonical, missing, conflicts, warnings, updates, duplicateIds, attributes };
}

function addIfChanged(updates, path, before, after) {
    if (after !== undefined && before !== after) updates[path] = after;
}

async function persistTotals(actor) {
    try {
        const snapshot = foundry.utils.duplicate(actor);
        const calculated = await calculateTotals(snapshot);
        const changes = { "system.settings.isupdated": false };

        for (const [attribute, value] of Object.entries(calculated.system.attributes)) {
            addIfChanged(changes, "system.attributes." + attribute + ".total",
                actor.system.attributes[attribute]?.total, value.total);
        }
        for (const damage of ["bashing", "lethal", "aggravated"]) {
            addIfChanged(changes, "system.soak." + damage,
                actor.system.soak?.[damage], calculated.system.soak?.[damage]);
            addIfChanged(changes, "system.soak.chimerical." + damage,
                actor.system.soak?.chimerical?.[damage], calculated.system.soak?.chimerical?.[damage]);
        }
        for (const [level, value] of Object.entries(calculated.system.health)) {
            addIfChanged(changes, "system.health." + level + ".total",
                actor.system.health?.[level]?.total, value?.total);
        }
        for (const field of ["base", "total"]) {
            addIfChanged(changes, "system.initiative." + field,
                actor.system.initiative?.[field], calculated.system.initiative?.[field]);
        }

        await actor.update(changes);
        // Future UI callers await the mutation. An already-open actor sheet is refreshed here.
        if (actor.sheet?.rendered) await actor.sheet.render(true);
        pendingTotals.delete(actor.uuid);
    } catch (cause) {
        throw new BloodBuffError("PERSISTENCE_FAILED", "Blood Buff totals could not be persisted", { cause });
    }
}

async function createItemData(attribute, value) {
    const name = game.i18n.localize("wod.attributes.bonus." + attribute);
    const item = await BonusHelper.CreateAttributeBuff("", name, attribute, value, value > 0, game.system.version);
    item.flags = { worldofdarkness: { bloodBuff: attribute } };
    item.system.isremovable = false;
    return item;
}

async function perform(actor, request) {
    requireMutationAccess(actor);
    if (request.attribute !== undefined) requireAttribute(request.attribute);
    if (request.kind === "set") requireNumber(request.value, true);
    if (request.kind === "change") requireNumber(request.value, false);

    const scan = inspect(actor);
    if (scan.conflicts.length) {
        throw new BloodBuffError("CONFLICT", "Blood Buff items contain a blocking conflict", {
            conflicts: scan.conflicts, warnings: scan.warnings
        });
    }

    const desired = {};
    if (request.kind === "set") desired[request.attribute] = request.value;
    if (request.kind === "change") {
        desired[request.attribute] = Math.max(0, scan.attributes[request.attribute].effectiveValue + request.value);
        requireNumber(desired[request.attribute], true);
    }
    if (request.kind === "reset") {
        for (const attribute of ATTRIBUTES) desired[attribute] = 0;
    }

    const updates = scan.updates;
    for (const [attribute, value] of Object.entries(desired)) {
        const item = scan.canonical[attribute];
        if (!item) continue;
        const update = updates.get(item._id) ?? { _id: item._id };
        if (item.system.value !== value) update["system.value"] = value;
        if (item.system.isactive !== (value > 0)) update["system.isactive"] = value > 0;
        if (Object.keys(update).length > 1) updates.set(item._id, update);
    }

    const missingItems = await Promise.all(scan.missing.map(attribute =>
        createItemData(attribute, desired[attribute] ?? 0)
    ));
    const hasWrites = missingItems.length > 0 || updates.size > 0 || scan.duplicateIds.length > 0;
    if (hasWrites) pendingTotals.add(actor.uuid);
    try {
        if (missingItems.length) await actor.createEmbeddedDocuments("Item", missingItems);
        if (updates.size) await actor.updateEmbeddedDocuments("Item", [...updates.values()]);
        if (scan.duplicateIds.length) await actor.deleteEmbeddedDocuments("Item", scan.duplicateIds);
    } catch (cause) {
        throw new BloodBuffError("PERSISTENCE_FAILED", "Blood Buff item changes could not be persisted", {
            warnings: scan.warnings, cause
        });
    }
    if (hasWrites || pendingTotals.has(actor.uuid)) await persistTotals(actor);

    const appliedWarnings = scan.warnings.map(warning => ({
        ...warning,
        code: warning.code === "DUPLICATE_ZERO" ? "DUPLICATE_REMOVED"
            : warning.code === "REPAIR_REQUIRED" ? "CANONICAL_REPAIRED" : warning.code
    }));
    return { ...BloodBuffHelper.read(actor), warnings: appliedWarnings };
}

export default class BloodBuffHelper {
    static read(actor) {
        requireActor(actor);
        const state = inspect(actor);
        return {
            attributes: state.attributes,
            missing: state.missing,
            conflicts: state.conflicts,
            warnings: state.warnings
        };
    }

    static ensure(actor) {
        return enqueue(actor, () => perform(actor, { kind: "ensure" }));
    }

    static setValue(actor, attribute, absoluteValue) {
        return enqueue(actor, () => perform(actor, {
            kind: "set", attribute, value: absoluteValue
        }));
    }

    static changeValue(actor, attribute, delta) {
        return enqueue(actor, () => perform(actor, {
            kind: "change", attribute, value: delta
        }));
    }

    static reset(actor) {
        return enqueue(actor, () => perform(actor, { kind: "reset" }));
    }
}
