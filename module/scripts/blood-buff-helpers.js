import BonusHelper from "./bonus-helpers.js";
import { calculateTotals } from "./totals.js";

const ATTRIBUTES = ["strength", "dexterity", "stamina"];
const queues = new Map();
const validValue = value => typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
const validExistingVersion = value => typeof value === "string" &&
    /^\d+(?:\.\d+){0,2}(?:[-+ ]?[A-Za-z][A-Za-z0-9.-]*)?$/.test(value);
const markerOf = item => item?.flags?.worldofdarkness?.bloodBuff;
const isStandaloneManaged = (item, attribute) => {
    const system = item.system;
    return markerOf(item) === attribute && item.type === "Bonus" &&
        system?.type === "attribute_buff" && system.settingtype === attribute &&
        system.parentid === "" && Array.isArray(system.bonuslist) && system.bonuslist.length === 0 &&
        validValue(system.value) && typeof system.isactive === "boolean";
};
const isCleanDuplicate = (item, attribute) =>
    isStandaloneManaged(item, attribute) && item.system.value === 0 && item.system.isactive === false;

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

function repairRequirements(item, attribute) {
    const system = item.system ?? {};
    const fields = {};
    const warnings = [];
    const repair = (field, expected) => {
        if (system[field] === expected) return;
        fields["system." + field] = expected;
        warnings.push({ code: "REPAIR_REQUIRED", attribute, itemId: item._id, field });
    };
    repair("type", "attribute_buff");
    repair("settingtype", attribute);
    repair("parentid", "");
    repair("isremovable", false);
    if (!validValue(system.value)) {
        warnings.push({ code: "REPAIR_REQUIRED", attribute, itemId: item._id, field: "value" });
        if (system.isactive !== false) {
            warnings.push({ code: "REPAIR_REQUIRED", attribute, itemId: item._id, field: "isactive" });
        }
    }
    if (!validExistingVersion(system.version)) {
        warnings.push({ code: "INVALID_VERSION", attribute, itemId: item._id, field: "version" });
    }
    return { fields, warnings };
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
    const repairs = new Map();
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
            if (isCleanDuplicate(item, attribute)) {
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
        const requirements = repairRequirements(item, attribute);
        if (Object.keys(requirements.fields).length) repairs.set(item._id, requirements.fields);
        warnings.push(...requirements.warnings);
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
    return { groups, canonical, missing, conflicts, warnings, repairs, duplicateIds, attributes };
}

function targetValues(scan, request) {
    const desired = {};
    if (request.kind === "set") desired[request.attribute] = request.value;
    if (request.kind === "change") {
        desired[request.attribute] = Math.max(0, scan.attributes[request.attribute].effectiveValue + request.value);
        requireNumber(desired[request.attribute], true);
    }
    if (request.kind === "reset") {
        for (const attribute of ATTRIBUTES) desired[attribute] = 0;
    }
    return desired;
}

function buildUpdates(scan, desired, reset) {
    const updates = new Map();
    for (const attribute of ATTRIBUTES) {
        const items = reset ? scan.groups[attribute] : [scan.canonical[attribute]];
        for (const item of items) {
            if (!item) continue;
            const system = item.system ?? {};
            const update = { _id: item._id, ...(scan.repairs.get(item._id) ?? {}) };
            const requested = Object.hasOwn(desired, attribute);
            const value = requested ? desired[attribute] : validValue(system.value) ? system.value : 0;
            const active = requested ? value > 0 : validValue(system.value) ? system.isactive : false;
            if (system.value !== value) update["system.value"] = value;
            if (system.isactive !== active) update["system.isactive"] = active;
            if (Object.keys(update).length > 1) updates.set(item._id, update);
        }
    }
    return updates;
}

function resetDuplicatePlan(scan) {
    const recoverable = new Set();
    const unsafe = [];
    const duplicateIds = [...scan.duplicateIds];
    const warnings = [];
    for (const attribute of ATTRIBUTES) {
        const group = scan.groups[attribute];
        if (group.length < 2) continue;
        if (!group.every(item => isStandaloneManaged(item, attribute))) {
            unsafe.push({ code: "UNSAFE_RESET_DUPLICATE", attribute });
            continue;
        }
        recoverable.add(attribute);
        for (const item of group.slice(1)) {
            if (duplicateIds.includes(item._id)) continue;
            duplicateIds.push(item._id);
            warnings.push({ code: "RESET_DUPLICATE", attribute, itemId: item._id });
        }
    }
    const conflicts = scan.conflicts.filter(conflict =>
        conflict.code !== "BLOCKING_DUPLICATE" || !recoverable.has(conflict.attribute));
    return { conflicts: [...conflicts, ...unsafe], duplicateIds, warnings };
}

function addIfChanged(updates, path, before, after) {
    if (after !== undefined && before !== after) updates[path] = after;
}

async function persistTotals(actor) {
    try {
        const snapshot = foundry.utils.duplicate(actor);
        const calculated = await calculateTotals(snapshot);
        const changes = {};

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

        if (Object.keys(changes).length) {
            addIfChanged(changes, "system.settings.isupdated", actor.system.settings.isupdated, false);
            await actor.update(changes);
        }
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
    const resetPlan = request.kind === "reset" ? resetDuplicatePlan(scan) : null;
    const conflicts = resetPlan?.conflicts ?? scan.conflicts;
    if (conflicts.length) {
        throw new BloodBuffError("CONFLICT", "Blood Buff items contain a blocking conflict", {
            conflicts, warnings: scan.warnings
        });
    }

    const desired = targetValues(scan, request);
    const updates = buildUpdates(scan, desired, request.kind === "reset");
    const duplicateIds = resetPlan?.duplicateIds ?? scan.duplicateIds;
    const warnings = [...scan.warnings, ...(resetPlan?.warnings ?? [])];

    const missingItems = await Promise.all(scan.missing.map(attribute =>
        createItemData(attribute, desired[attribute] ?? 0)
    ));
    try {
        if (missingItems.length) await actor.createEmbeddedDocuments("Item", missingItems);
        if (updates.size) await actor.updateEmbeddedDocuments("Item", [...updates.values()]);
        if (duplicateIds.length) {
            const originalAttributes = new Map(ATTRIBUTES.flatMap(attribute =>
                scan.groups[attribute].slice(1).map(item => [item._id, attribute])
            ));
            for (const id of duplicateIds) {
                const item = [...actor.items].find(candidate => candidate._id === id);
                if (!item || !isCleanDuplicate(item, originalAttributes.get(id))) {
                    throw new Error("A redundant Blood Buff item is no longer safe to delete");
                }
            }
            await actor.deleteEmbeddedDocuments("Item", duplicateIds);
        }
    } catch (cause) {
        throw new BloodBuffError("PERSISTENCE_FAILED", "Blood Buff item changes could not be persisted", {
            warnings, cause
        });
    }
    await persistTotals(actor);

    const appliedWarnings = warnings.filter(warning => warning.code !== "REPAIR_REQUIRED" ||
        Object.hasOwn(updates.get(warning.itemId) ?? {}, "system." + warning.field)).map(warning => ({
        ...warning,
        code: warning.code === "DUPLICATE_ZERO" || warning.code === "RESET_DUPLICATE" ? "DUPLICATE_REMOVED"
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
