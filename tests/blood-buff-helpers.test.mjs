import test from "node:test";
import assert from "node:assert/strict";

const actors = new Map();
globalThis.FormApplication = class {};
globalThis.CONFIG = {
    worldofdarkness: {
        sheettype: { changingbreed: "Changing Breed", werewolf: "Werewolf" },
        woundLevels: {},
        damageTypes: {}
    }
};
globalThis.game = {
    system: { version: "7.3.2" },
    i18n: { localize: key => key },
    actors: { get: id => actors.get(id) }
};
globalThis.foundry = {
    utils: { duplicate: actor => actor.toObject() }
};

const copy = value => structuredClone(value);
const helper = async () => (await import("../module/scripts/blood-buff-helpers.js")).default;

function assignPath(object, path, value) {
    const keys = path.split(".");
    const last = keys.pop();
    const parent = keys.reduce((target, key) => target[key], object);
    parent[last] = value;
}

function makeItem(marker, value = 0, isactive = false, overrides = {}) {
    return {
        _id: overrides._id ?? "item-" + marker,
        type: overrides.type ?? "Bonus",
        name: overrides.name ?? marker,
        flags: { worldofdarkness: { bloodBuff: marker } },
        system: {
            type: "attribute_buff",
            settingtype: marker,
            parentid: "",
            version: "7.3.2",
            isremovable: false,
            value,
            isactive,
            bonuslist: [],
            ...overrides.system
        }
    };
}

function makeAdvantage(id = "bloodpool", isvisible = true, itemId = "advantage-" + id) {
    return {
        _id: itemId,
        type: "Advantage",
        name: id,
        system: { id, settings: { isvisible }, bonuslist: [] }
    };
}

class FakeActor {
    constructor(options = {}) {
        this._id = options.id ?? "actor-1";
        this.id = this._id;
        this.uuid = options.uuid ?? "Actor." + this.id;
        this.type = options.type ?? "PC";
        this.isOwner = options.isOwner ?? true;
        this.system = {
            settings: {
                variant: options.variant ?? "general",
                splat: options.splat ?? "vampire",
                isupdated: true,
                hasrage: false,
                usechimerical: false,
                soak: {
                    bashing: { isrollable: true },
                    lethal: { isrollable: true },
                    aggravated: { isrollable: false }
                }
            },
            attributes: {
                strength: { value: 3, bonus: 0, total: 3, label: "wod.attributes.strength" },
                dexterity: { value: 5, bonus: 0, total: 5, label: "wod.attributes.dexterity" },
                stamina: { value: 3, bonus: 0, total: 3, label: "wod.attributes.stamina" },
                wits: { value: 2, bonus: 0, total: 2, label: "wod.attributes.wits" }
            },
            soak: { bashing: 3, lethal: 3, aggravated: 0 },
            health: { damage: { woundpenalty: 0 } },
            conditions: { isignoringpain: false },
            initiative: { base: 7, bonus: 0, total: 7 },
            ...copy(options.system ?? {})
        };
        if (Object.hasOwn(options, "hasbloodpool")) {
            this.system.settings.hasbloodpool = options.hasbloodpool;
        }
        this.items = copy([
            ...(options.items ?? []),
            ...(options.bloodpoolItems ?? [makeAdvantage()])
        ]);
        this.calls = { create: 0, updateItems: 0, delete: 0, updateActor: 0, render: 0 };
        this.failActorUpdate = false;
        this.sheet = {
            rendered: false,
            render: () => { this.calls.render++; }
        };
        actors.set(this.id, this);
    }

    toObject() {
        return copy({ _id: this._id, type: this.type, system: this.system, items: this.items });
    }

    async createEmbeddedDocuments(type, documents) {
        assert.equal(type, "Item");
        this.calls.create++;
        const created = documents.map((document, index) => ({
            ...copy(document),
            _id: document._id ?? "created-" + (this.items.length + index + 1),
            system: { bonuslist: [], ...copy(document.system) }
        }));
        this.items.push(...created);
        return created;
    }

    async updateEmbeddedDocuments(type, updates) {
        assert.equal(type, "Item");
        this.calls.updateItems++;
        for (const update of updates) {
            const item = this.items.find(candidate => candidate._id === update._id);
            assert.ok(item);
            for (const [path, value] of Object.entries(update)) {
                if (path !== "_id") assignPath(item, path, value);
            }
        }
    }

    async deleteEmbeddedDocuments(type, ids) {
        assert.equal(type, "Item");
        this.calls.delete++;
        this.items = this.items.filter(item => !ids.includes(item._id));
    }

    async update(updates) {
        this.calls.updateActor++;
        if (this.failActorUpdate) throw new Error("actor persistence failed");
        if (this.concurrentBioChange) this.system.bio.note = "concurrent edit";
        for (const [path, value] of Object.entries(updates)) {
            assignPath(this, path, value);
        }
    }
}

test("ensure creates exactly three marked persistent Bonus items", async () => {
    const BloodBuffHelper = await helper();
    const actor = new FakeActor();
    const result = await BloodBuffHelper.ensure(actor);
    const bonuses = actor.items.filter(item => item.type === "Bonus");
    assert.deepEqual(bonuses.map(item => item.flags.worldofdarkness.bloodBuff).sort(), [
        "dexterity", "stamina", "strength"
    ]);
    for (const item of bonuses) {
        assert.equal(item.type, "Bonus");
        assert.equal(item.system.type, "attribute_buff");
        assert.equal(item.system.settingtype, item.flags.worldofdarkness.bloodBuff);
        assert.equal(item.system.parentid, "");
        assert.equal(item.system.version, "7.3.2");
        assert.equal(item.system.isremovable, false);
        assert.equal(item.system.value, 0);
        assert.equal(item.system.isactive, false);
    }
    assert.equal(actor.calls.create, 1);
    assert.equal(result.missing.length, 0);
});

test("read reports missing items without writing", async () => {
    const BloodBuffHelper = await helper();
    const actor = new FakeActor();
    const state = BloodBuffHelper.read(actor);
    assert.deepEqual(state.missing, ["strength", "dexterity", "stamina"]);
    assert.equal(state.attributes.dexterity.effectiveValue, 0);
    assert.deepEqual(actor.calls, { create: 0, updateItems: 0, delete: 0, updateActor: 0, render: 0 });
});

test("read and mutations reject invalid actors", async () => {
    const BloodBuffHelper = await helper();
    for (const actor of [null, {}, { uuid: "", items: [] }]) {
        assert.throws(() => BloodBuffHelper.read(actor), error => error.code === "INVALID_ACTOR");
        assert.throws(() => BloodBuffHelper.ensure(actor), error => error.code === "INVALID_ACTOR");
    }
});

test("repeated and concurrent ensure creates no duplicate items", async () => {
    const BloodBuffHelper = await helper();
    const actor = new FakeActor();
    await Promise.all([BloodBuffHelper.ensure(actor), BloodBuffHelper.ensure(actor), BloodBuffHelper.ensure(actor)]);
    await BloodBuffHelper.ensure(actor);
    assert.equal(actor.items.filter(item => item.type === "Bonus").length, 3);
    assert.equal(actor.calls.create, 1);
});

test("a PC with a visible Blood Pool is eligible without legacy hasbloodpool", async () => {
    const BloodBuffHelper = await helper();
    const actor = new FakeActor();
    assert.equal(Object.hasOwn(actor.system.settings, "hasbloodpool"), false);
    await BloodBuffHelper.ensure(actor);
    assert.equal(actor.items.filter(item => item.type === "Bonus").length, 3);
});

test("rejection codes are precise and every rejected mutation makes zero writes", async () => {
    const BloodBuffHelper = await helper();
    const cases = [
        { id: "non-pc", type: "Creature", hasbloodpool: true, expected: "NOT_PC" },
        { id: "non-owner", isOwner: false, expected: "NOT_OWNER" },
        { id: "earthbound", variant: "earthbound", expected: "VARIANT_EXCLUDED" },
        { id: "missing", bloodpoolItems: [], expected: "NO_BLOODPOOL" },
        { id: "legacy-only", hasbloodpool: true, bloodpoolItems: [], expected: "NO_BLOODPOOL" },
        { id: "hidden", bloodpoolItems: [makeAdvantage("bloodpool", false)], expected: "BLOODPOOL_HIDDEN" },
        { id: "faith-only", bloodpoolItems: [makeAdvantage("faith")], expected: "NO_BLOODPOOL" },
        { id: "essence-only", bloodpoolItems: [makeAdvantage("essence")], expected: "NO_BLOODPOOL" }
    ];
    for (const entry of cases) {
        const actor = new FakeActor(entry);
        const before = copy(actor.items);
        const operations = [
            () => BloodBuffHelper.ensure(actor),
            () => BloodBuffHelper.setValue(actor, "strength", 1),
            () => BloodBuffHelper.changeValue(actor, "strength", 1),
            () => BloodBuffHelper.reset(actor)
        ];
        for (const operation of operations) {
            await assert.rejects(operation(), error => error.code === entry.expected);
            assert.deepEqual(actor.items, before);
            assert.deepEqual(actor.calls, { create: 0, updateItems: 0, delete: 0, updateActor: 0, render: 0 });
        }
    }
});

test("eligibility rejection priority follows the approved order", async () => {
    const BloodBuffHelper = await helper();
    const cases = [
        { id: "priority-type", type: "Creature", isOwner: false, variant: "earthbound", bloodpoolItems: [], expected: "NOT_PC" },
        { id: "priority-owner", isOwner: false, variant: "earthbound", bloodpoolItems: [], expected: "NOT_OWNER" },
        { id: "priority-variant", variant: "earthbound", bloodpoolItems: [makeAdvantage("bloodpool", false)], expected: "VARIANT_EXCLUDED" },
        { id: "priority-missing", bloodpoolItems: [makeAdvantage("faith", false)], expected: "NO_BLOODPOOL" },
        { id: "priority-hidden", bloodpoolItems: [makeAdvantage("bloodpool", false)], expected: "BLOODPOOL_HIDDEN" }
    ];
    for (const entry of cases) {
        const actor = new FakeActor(entry);
        await assert.rejects(BloodBuffHelper.ensure(actor), error => error.code === entry.expected);
    }
});

test("one visible Blood Pool is sufficient alongside hidden duplicates", async () => {
    const BloodBuffHelper = await helper();
    const actor = new FakeActor({ bloodpoolItems: [
        makeAdvantage("bloodpool", false, "hidden-bloodpool"),
        makeAdvantage("bloodpool", true, "visible-bloodpool")
    ] });
    await BloodBuffHelper.ensure(actor);
    assert.equal(actor.items.filter(item => item.type === "Bonus").length, 3);
});

test("unrelated bonuses and the manual attribute bonus are unchanged", async () => {
    const BloodBuffHelper = await helper();
    const unrelated = makeItem("unknown", 5, true, { _id: "unrelated" });
    const unmarked = makeItem("dexterity", 9, true, { _id: "unmarked" });
    unmarked.flags = {};
    const actor = new FakeActor({ items: [unrelated, unmarked] });
    actor.system.attributes.dexterity.bonus = 4;
    await BloodBuffHelper.setValue(actor, "dexterity", 2);
    assert.deepEqual(actor.items.find(item => item._id === "unrelated"), unrelated);
    assert.deepEqual(actor.items.find(item => item._id === "unmarked"), unmarked);
    assert.equal(actor.system.attributes.dexterity.bonus, 4);
});

test("read reports stored and effective values of an inactive item without writes", async () => {
    const BloodBuffHelper = await helper();
    const actor = new FakeActor({ items: [makeItem("dexterity", 2, false)] });
    const state = BloodBuffHelper.read(actor);
    assert.equal(state.attributes.dexterity.storedValue, 2);
    assert.equal(state.attributes.dexterity.effectiveValue, 0);
    assert.equal(state.attributes.dexterity.isactive, false);
    assert.equal(actor.items[0].system.isactive, false);
    assert.deepEqual(actor.calls, { create: 0, updateItems: 0, delete: 0, updateActor: 0, render: 0 });
});

test("ensure preserves manual deactivation and stored value", async () => {
    const BloodBuffHelper = await helper();
    const actor = new FakeActor({ items: [makeItem("dexterity", 2, false)] });
    await BloodBuffHelper.ensure(actor);
    assert.equal(actor.items[0].system.value, 2);
    assert.equal(actor.items[0].system.isactive, false);
});

test("setValue uses an absolute nonnegative value and activates only positive values", async () => {
    const BloodBuffHelper = await helper();
    const actor = new FakeActor();
    await BloodBuffHelper.setValue(actor, "strength", 3);
    await BloodBuffHelper.setValue(actor, "strength", 3);
    const item = actor.items.find(item => item.flags?.worldofdarkness?.bloodBuff === "strength");
    assert.equal(item.system.value, 3);
    assert.equal(item.system.isactive, true);
    await BloodBuffHelper.setValue(actor, "strength", 0);
    assert.equal(item.system.value, 0);
    assert.equal(item.system.isactive, false);
});

test("changeValue uses the fresh effective value and clamps at zero", async () => {
    const BloodBuffHelper = await helper();
    const actor = new FakeActor({ items: [makeItem("dexterity", 2, false)] });
    await BloodBuffHelper.changeValue(actor, "dexterity", 1);
    let item = actor.items.find(candidate => candidate.flags?.worldofdarkness?.bloodBuff === "dexterity");
    assert.equal(item.system.value, 1);
    assert.equal(item.system.isactive, true);
    await BloodBuffHelper.changeValue(actor, "dexterity", -4);
    assert.equal(item.system.value, 0);
    assert.equal(item.system.isactive, false);
});

test("reset clears all three values without deleting items", async () => {
    const BloodBuffHelper = await helper();
    const actor = new FakeActor({ items: [
        makeItem("strength", 2, true), makeItem("dexterity", 3, true), makeItem("stamina", 4, false)
    ] });
    const ids = actor.items.map(item => item._id);
    await BloodBuffHelper.reset(actor);
    assert.deepEqual(actor.items.map(item => item._id), ids);
    assert.ok(actor.items.filter(item => item.type === "Bonus").every(item =>
        item.system.value === 0 && item.system.isactive === false));
    assert.equal(actor.calls.delete, 0);
});

test("canonical repair restores required fields, zeros invalid value, and warns", async () => {
    const BloodBuffHelper = await helper();
    const actor = new FakeActor({ items: [makeItem("strength", -2, true, {
        system: {
            type: "attribute_diff", settingtype: "dexterity", parentid: "foreign",
            version: "6.0.0", isremovable: true
        }
    })] });
    const result = await BloodBuffHelper.ensure(actor);
    const item = actor.items.find(candidate => candidate.flags?.worldofdarkness?.bloodBuff === "strength");
    assert.equal(item.system.type, "attribute_buff");
    assert.equal(item.system.settingtype, "strength");
    assert.equal(item.system.parentid, "");
    assert.equal(item.system.version, "6.0.0");
    assert.equal(item.system.isremovable, false);
    assert.equal(item.system.value, 0);
    assert.equal(item.system.isactive, false);
    assert.ok(result.warnings.length >= 1);
});

test("setValue overrides an invalid stored value repair and activates its target", async () => {
    const BloodBuffHelper = await helper();
    const actor = new FakeActor({ items: [makeItem("strength", -2, true)] });
    const result = await BloodBuffHelper.setValue(actor, "strength", 3);
    const item = actor.items.find(candidate => candidate.flags?.worldofdarkness?.bloodBuff === "strength");
    assert.equal(item.system.value, 3);
    assert.equal(item.system.isactive, true);
    assert.equal(BloodBuffHelper.read(actor).attributes.strength.effectiveValue, 3);
    assert.equal(actor.system.attributes.strength.total, 6);
    assert.equal(result.warnings.some(warning => warning.code === "CANONICAL_REPAIRED" && warning.field === "isactive"), false);
});

test("system version drift does not rewrite healthy existing bonus items", async () => {
    const BloodBuffHelper = await helper();
    const actor = new FakeActor({ items: [
        makeItem("strength"), makeItem("dexterity"), makeItem("stamina")
    ] });
    const oldVersion = game.system.version;
    game.system.version = "8.0.0";
    try {
        const result = await BloodBuffHelper.ensure(actor);
        assert.equal(actor.calls.updateItems, 0);
        assert.ok(actor.items.filter(item => item.type === "Bonus").every(item => item.system.version === "7.3.2"));
        assert.equal(result.warnings.some(warning => warning.field === "version"), false);
        assert.equal(result.warnings.some(warning => warning.code === "INVALID_VERSION"), false);
    } finally {
        game.system.version = oldVersion;
    }
});

test("an invalid existing version is reported without a silent upgrade", async () => {
    const BloodBuffHelper = await helper();
    const actor = new FakeActor({ items: [makeItem("strength", 0, false, { system: { version: null } })] });
    const result = await BloodBuffHelper.ensure(actor);
    const item = actor.items.find(candidate => candidate.flags?.worldofdarkness?.bloodBuff === "strength");
    assert.equal(item.system.version, null);
    assert.ok(result.warnings.some(warning => warning.code === "INVALID_VERSION" && warning.attribute === "strength"));
    assert.equal(actor.calls.updateItems, 0);
});

test("a non-version string is reported without changing it", async () => {
    const BloodBuffHelper = await helper();
    const actor = new FakeActor({ items: [makeItem("strength", 0, false, { system: { version: "old" } })] });
    const result = await BloodBuffHelper.ensure(actor);
    assert.equal(actor.items.find(item => item.flags?.worldofdarkness?.bloodBuff === "strength").system.version, "old");
    assert.ok(result.warnings.some(warning => warning.code === "INVALID_VERSION" && warning.attribute === "strength"));
    assert.equal(actor.calls.updateItems, 0);
});

test("zero duplicate is removed after deterministic canonical selection", async () => {
    const BloodBuffHelper = await helper();
    const actor = new FakeActor({ items: [
        makeItem("strength", 0, false, { _id: "z" }),
        makeItem("strength", 2, true, { _id: "a" })
    ] });
    const result = await BloodBuffHelper.ensure(actor);
    assert.deepEqual(actor.items.filter(item => item.flags?.worldofdarkness?.bloodBuff === "strength").map(item => item._id), ["a"]);
    assert.equal(actor.items.find(item => item._id === "a").system.value, 2);
    assert.ok(result.warnings.some(warning => warning.code === "DUPLICATE_REMOVED"));
});

test("unsafe zero duplicates block cleanup without discarding other effects", async () => {
    const BloodBuffHelper = await helper();
    const cases = [
        { name: "wrong bonus type", system: { type: "initiative_buff" } },
        { name: "wrong attribute target", system: { settingtype: "dexterity" } },
        { name: "active zero", active: true },
        { name: "foreign nested effect", system: { bonuslist: [
            { type: "soak_buff", settingtype: "all", value: 2, isactive: true }
        ] } },
        { name: "foreign parent", system: { parentid: "foreign" } },
        { name: "missing bonuslist", system: { bonuslist: undefined } }
    ];
    for (const entry of cases) {
        const duplicate = makeItem("strength", 0, entry.active ?? false, {
            _id: "z", system: entry.system
        });
        const actor = new FakeActor({ id: entry.name, items: [
            makeItem("strength", 1, true, { _id: "a" }), duplicate
        ] });
        const before = copy(actor.items);
        await assert.rejects(BloodBuffHelper.ensure(actor), error =>
            error.code === "CONFLICT" && error.conflicts.some(conflict => conflict.code === "BLOCKING_DUPLICATE"), entry.name);
        assert.deepEqual(actor.items, before, entry.name);
        assert.deepEqual(actor.calls, { create: 0, updateItems: 0, delete: 0, updateActor: 0, render: 0 }, entry.name);
    }
});

test("reset recovers both canonical orderings of a zero and nonzero duplicate", async () => {
    const BloodBuffHelper = await helper();
    for (const [canonicalValue, redundantValue] of [[0, 2], [2, 0]]) {
        const actor = new FakeActor({ id: `reset-${canonicalValue}-${redundantValue}`, items: [
            makeItem("strength", canonicalValue, canonicalValue > 0, { _id: "a" }),
            makeItem("strength", redundantValue, redundantValue > 0, { _id: "z" })
        ] });
        actor.system.attributes.strength.total = 5;
        const result = await BloodBuffHelper.reset(actor);
        const strength = actor.items.filter(item => item.flags?.worldofdarkness?.bloodBuff === "strength");
        assert.deepEqual(strength.map(item => item._id), ["a"]);
        assert.equal(strength[0].system.value, 0);
        assert.equal(strength[0].system.isactive, false);
        assert.equal(actor.system.attributes.strength.total, 3);
        assert.equal(actor.calls.delete, 1);
        assert.ok(result.warnings.some(warning => warning.code === "DUPLICATE_REMOVED"));
    }
});

test("nonzero duplicate remains a conflict for ensure, setValue, and changeValue", async () => {
    const BloodBuffHelper = await helper();
    for (const operation of [
        actor => BloodBuffHelper.ensure(actor),
        actor => BloodBuffHelper.setValue(actor, "strength", 3),
        actor => BloodBuffHelper.changeValue(actor, "strength", 1)
    ]) {
        const actor = new FakeActor({ items: [
            makeItem("strength", 0, false, { _id: "a" }),
            makeItem("strength", 2, true, { _id: "z" })
        ] });
        const before = copy(actor.items);
        await assert.rejects(operation(actor), error => error.code === "CONFLICT");
        assert.deepEqual(actor.items, before);
        assert.deepEqual(actor.calls, { create: 0, updateItems: 0, delete: 0, updateActor: 0, render: 0 });
    }
});

test("reset rejects unsafe duplicate groups before any item or actor write", async () => {
    const BloodBuffHelper = await helper();
    const cases = [
        { name: "foreign effect", duplicate: { system: { bonuslist: [
            { type: "soak_buff", settingtype: "all", value: 2, isactive: true }
        ] } } },
        { name: "wrong type", duplicate: { system: { type: "attribute_diff" } } },
        { name: "wrong settingtype", duplicate: { system: { settingtype: "dexterity" } } },
        { name: "foreign parent", duplicate: { system: { parentid: "other" } } },
        { name: "invalid value", value: -1 },
        { name: "invalid active", active: "yes" },
        { name: "wrong document type", duplicate: { type: "Trait" } },
        { name: "unsafe canonical", value: 0, active: false, canonical: { system: { bonuslist: [
            { type: "soak_buff", settingtype: "all", value: 2, isactive: true }
        ] } } }
    ];
    for (const entry of cases) {
        const actor = new FakeActor({ id: entry.name, items: [
            makeItem("strength", 0, false, { _id: "a", ...entry.canonical }),
            makeItem("strength", entry.value ?? 2, entry.active ?? true, { _id: "z", ...entry.duplicate })
        ] });
        const before = copy(actor.items);
        await assert.rejects(BloodBuffHelper.reset(actor), error => error.code === "CONFLICT", entry.name);
        assert.deepEqual(actor.items, before, entry.name);
        assert.deepEqual(actor.calls, { create: 0, updateItems: 0, delete: 0, updateActor: 0, render: 0 }, entry.name);
    }
});

test("a duplicate changed after inspection is not deleted", async () => {
    const BloodBuffHelper = await helper();
    const actor = new FakeActor({ items: [
        makeItem("strength", 1, true, { _id: "a" }),
        makeItem("strength", 0, false, { _id: "z" })
    ] });
    const create = actor.createEmbeddedDocuments.bind(actor);
    actor.createEmbeddedDocuments = async (type, documents) => {
        const result = await create(type, documents);
        const changed = actor.items.find(item => item._id === "z");
        changed.flags.worldofdarkness.bloodBuff = "dexterity";
        changed.system.settingtype = "dexterity";
        return result;
    };
    await assert.rejects(BloodBuffHelper.ensure(actor), error => error.code === "PERSISTENCE_FAILED");
    assert.ok(actor.items.some(item => item._id === "z"));
    assert.equal(actor.calls.delete, 0);
});

test("nonzero or invalid duplicate blocks all writes", async () => {
    const BloodBuffHelper = await helper();
    for (const value of [1, -1, NaN, "0"]) {
        const actor = new FakeActor({ id: "dup-" + String(value), items: [
            makeItem("strength", 0, false, { _id: "a" }),
            makeItem("strength", value, true, { _id: "b" })
        ] });
        await assert.rejects(BloodBuffHelper.ensure(actor), error =>
            error.code === "CONFLICT" && error.conflicts.length > 0);
        assert.equal(actor.items.length, 3);
        assert.equal(actor.calls.create, 0);
        assert.equal(actor.calls.updateItems, 0);
        assert.equal(actor.calls.delete, 0);
    }
});

test("marked non-Bonus item blocks without partial repair", async () => {
    const BloodBuffHelper = await helper();
    const actor = new FakeActor({ items: [makeItem("strength", 0, false, { type: "Trait" })] });
    await assert.rejects(BloodBuffHelper.ensure(actor), error => error.code === "CONFLICT");
    assert.equal(actor.calls.create, 0);
    assert.equal(actor.calls.updateItems, 0);
});

test("unknown marker is not adopted, repaired, or removed", async () => {
    const BloodBuffHelper = await helper();
    const unknown = makeItem("other", 8, true, { _id: "unknown", system: { type: "other" } });
    const actor = new FakeActor({ items: [unknown] });
    await BloodBuffHelper.ensure(actor);
    assert.deepEqual(actor.items.find(item => item._id === "unknown"), unknown);
    assert.equal(actor.items.length, 5);
});

test("no-op set, reset, and ensure avoid extra persistent writes", async () => {
    const BloodBuffHelper = await helper();
    const actor = new FakeActor();
    await BloodBuffHelper.ensure(actor);
    actor.calls = { create: 0, updateItems: 0, delete: 0, updateActor: 0, render: 0 };
    await BloodBuffHelper.setValue(actor, "strength", 0);
    await BloodBuffHelper.reset(actor);
    await BloodBuffHelper.ensure(actor);
    assert.deepEqual(actor.calls, { create: 0, updateItems: 0, delete: 0, updateActor: 0, render: 0 });
});

test("invalid numeric input and attribute are rejected without writes", async () => {
    const BloodBuffHelper = await helper();
    const actor = new FakeActor();
    for (const value of [-1, 1.2, NaN, Infinity, "2"]) {
        await assert.rejects(BloodBuffHelper.setValue(actor, "strength", value), error => error.code === "INVALID_VALUE");
    }
    for (const delta of [1.1, NaN, Infinity, "1"]) {
        await assert.rejects(BloodBuffHelper.changeValue(actor, "strength", delta), error => error.code === "INVALID_VALUE");
    }
    await assert.rejects(BloodBuffHelper.setValue(actor, "wits", 1), error => error.code === "INVALID_ATTRIBUTE");
    assert.equal(actor.items.length, 1);
    assert.deepEqual(actor.calls, { create: 0, updateItems: 0, delete: 0, updateActor: 0, render: 0 });
});

test("parallel increments are serialized by actor UUID", async () => {
    const BloodBuffHelper = await helper();
    const actor = new FakeActor();
    await Promise.all(Array.from({ length: 10 }, () => BloodBuffHelper.changeValue(actor, "strength", 1)));
    assert.equal(BloodBuffHelper.read(actor).attributes.strength.effectiveValue, 10);
});

test("a rejected operation does not poison the actor queue", async () => {
    const BloodBuffHelper = await helper();
    const actor = new FakeActor();
    const rejected = BloodBuffHelper.setValue(actor, "strength", -1);
    const accepted = BloodBuffHelper.setValue(actor, "strength", 2);
    await assert.rejects(rejected);
    await accepted;
    assert.equal(BloodBuffHelper.read(actor).attributes.strength.effectiveValue, 2);
});

test("item mutations recalculate and persist actual attribute and initiative totals", async () => {
    const BloodBuffHelper = await helper();
    const actor = new FakeActor();
    await BloodBuffHelper.setValue(actor, "dexterity", 2);
    assert.equal(actor.system.attributes.dexterity.total, 7);
    assert.equal(actor.system.initiative.total, 9);
    assert.ok(actor.calls.updateActor > 0);
    await BloodBuffHelper.setValue(actor, "dexterity", 3);
    assert.equal(actor.system.attributes.dexterity.total, 8);
    assert.equal(actor.system.initiative.total, 10);
});

test("render failure after actor persistence cannot turn a successful set into a failure", async () => {
    const BloodBuffHelper = await helper();
    const actor = new FakeActor();
    actor.sheet.rendered = true;
    actor.sheet.render = () => { throw new Error("render failed"); };
    await BloodBuffHelper.setValue(actor, "dexterity", 2);
    assert.equal(actor.system.attributes.dexterity.total, 7);
    assert.equal(actor.system.initiative.total, 9);
    await BloodBuffHelper.setValue(actor, "dexterity", 2);
    assert.equal(actor.system.attributes.dexterity.total, 7);
    assert.equal(actor.items.find(item => item.flags?.worldofdarkness?.bloodBuff === "dexterity").system.value, 2);
});

test("actual calculateTotals ignores an inactive stored +2", async () => {
    const { calculateTotals } = await import("../module/scripts/totals.js");
    const actor = new FakeActor({ items: [makeItem("dexterity", 2, false)] });
    const calculated = await calculateTotals(actor.toObject());
    assert.equal(calculated.system.attributes.dexterity.total, 5);
    assert.equal(calculated.system.initiative.total, 7);
});

test("Stamina Blood Buff propagates to persisted soak totals", async () => {
    const BloodBuffHelper = await helper();
    const actor = new FakeActor();
    await BloodBuffHelper.setValue(actor, "stamina", 2);
    assert.equal(actor.system.attributes.stamina.total, 5);
    assert.deepEqual(actor.system.soak, { bashing: 5, lethal: 5, aggravated: 0 });
    const item = actor.items.find(candidate => candidate.flags?.worldofdarkness?.bloodBuff === "stamina");
    item.system.value = 4;
    await BloodBuffHelper.ensure(actor);
    assert.equal(actor.system.attributes.stamina.total, 7);
    assert.deepEqual(actor.system.soak, { bashing: 7, lethal: 7, aggravated: 0 });
});

test("actor persistence failure is surfaced and a later no-op retries totals", async () => {
    const BloodBuffHelper = await helper();
    const actor = new FakeActor();
    await BloodBuffHelper.ensure(actor);
    actor.failActorUpdate = true;
    await assert.rejects(BloodBuffHelper.setValue(actor, "dexterity", 2), error =>
        error.code === "PERSISTENCE_FAILED");
    assert.equal(actor.system.attributes.dexterity.total, 5);
    assert.equal(BloodBuffHelper.read(actor).attributes.dexterity.effectiveValue, 2);
    actor.failActorUpdate = false;
    await BloodBuffHelper.ensure(actor);
    assert.equal(actor.system.attributes.dexterity.total, 7);
    assert.equal(actor.system.initiative.total, 9);
});

test("ensure repairs stale totals after an external bonus edit without an item write", async () => {
    const BloodBuffHelper = await helper();
    const actor = new FakeActor();
    await BloodBuffHelper.setValue(actor, "dexterity", 2);
    const item = actor.items.find(candidate => candidate.flags?.worldofdarkness?.bloodBuff === "dexterity");
    item.system.value = 4;
    actor.calls = { create: 0, updateItems: 0, delete: 0, updateActor: 0, render: 0 };
    await BloodBuffHelper.ensure(actor);
    assert.equal(actor.system.attributes.dexterity.total, 9);
    assert.equal(actor.system.initiative.total, 11);
    assert.equal(actor.calls.updateItems, 0);
    assert.equal(actor.calls.updateActor, 1);
});

test("same-value set repairs stale totals after an external bonus edit", async () => {
    const BloodBuffHelper = await helper();
    const actor = new FakeActor();
    await BloodBuffHelper.setValue(actor, "dexterity", 2);
    const item = actor.items.find(candidate => candidate.flags?.worldofdarkness?.bloodBuff === "dexterity");
    item.system.value = 4;
    actor.calls = { create: 0, updateItems: 0, delete: 0, updateActor: 0, render: 0 };
    await BloodBuffHelper.setValue(actor, "dexterity", 4);
    assert.equal(actor.system.attributes.dexterity.total, 9);
    assert.equal(actor.system.initiative.total, 11);
    assert.equal(actor.calls.updateItems, 0);
    assert.equal(actor.calls.updateActor, 1);
});

test("ensure with current totals performs no persistent writes", async () => {
    const BloodBuffHelper = await helper();
    const actor = new FakeActor();
    await BloodBuffHelper.setValue(actor, "dexterity", 2);
    actor.calls = { create: 0, updateItems: 0, delete: 0, updateActor: 0, render: 0 };
    await BloodBuffHelper.ensure(actor);
    assert.equal(actor.system.attributes.dexterity.total, 7);
    assert.deepEqual(actor.calls, { create: 0, updateItems: 0, delete: 0, updateActor: 0, render: 0 });
});

test("no-item-write changeValue and reset still repair stale actor totals", async () => {
    const BloodBuffHelper = await helper();
    for (const operation of [
        actor => BloodBuffHelper.changeValue(actor, "dexterity", 0),
        actor => BloodBuffHelper.reset(actor)
    ]) {
        const actor = new FakeActor();
        await BloodBuffHelper.ensure(actor);
        actor.system.attributes.dexterity.total = 99;
        actor.system.initiative.total = 101;
        actor.calls = { create: 0, updateItems: 0, delete: 0, updateActor: 0, render: 0 };
        await operation(actor);
        assert.equal(actor.system.attributes.dexterity.total, 5);
        assert.equal(actor.system.initiative.total, 7);
        assert.equal(actor.calls.updateItems, 0);
        assert.equal(actor.calls.updateActor, 1);
    }
});

test("read reports planned repairs and duplicates without claiming they were applied", async () => {
    const BloodBuffHelper = await helper();
    const actor = new FakeActor({ items: [
        makeItem("strength", 0, false, { _id: "a", system: { parentid: "wrong" } }),
        makeItem("strength", 0, false, { _id: "b" })
    ] });
    const state = BloodBuffHelper.read(actor);
    assert.ok(state.warnings.some(warning => warning.code === "REPAIR_REQUIRED"));
    assert.ok(state.warnings.some(warning => warning.code === "DUPLICATE_ZERO"));
    assert.equal(actor.items.length, 3);
    const result = await BloodBuffHelper.ensure(actor);
    assert.ok(result.warnings.some(warning => warning.code === "CANONICAL_REPAIRED"));
    assert.ok(result.warnings.some(warning => warning.code === "DUPLICATE_REMOVED"));
});

test("read preserves the raw invalid stored value while reporting zero effective value", async () => {
    const BloodBuffHelper = await helper();
    const actor = new FakeActor({ items: [makeItem("strength", null, true)] });
    const state = BloodBuffHelper.read(actor);
    assert.equal(state.attributes.strength.storedValue, null);
    assert.equal(state.attributes.strength.effectiveValue, 0);
    assert.equal(actor.items[0].system.value, null);
});

test("narrow actor persistence preserves an unrelated concurrent edit", async () => {
    const BloodBuffHelper = await helper();
    const actor = new FakeActor();
    actor.system.bio = { note: "before" };
    actor.concurrentBioChange = true;
    await BloodBuffHelper.setValue(actor, "dexterity", 2);
    assert.equal(actor.system.bio.note, "concurrent edit");
    assert.equal(actor.system.attributes.dexterity.total, 7);
});
