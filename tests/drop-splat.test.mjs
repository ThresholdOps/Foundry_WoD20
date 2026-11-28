import test from "node:test";
import assert from "node:assert/strict";
import { installFoundryEnv } from "./helpers/foundry-env.mjs";

installFoundryEnv();

// Foundry's duplicate() is a JSON round trip, so it drops the methods on the test actor.
// The default helper uses structuredClone, which refuses objects that have functions.
globalThis.foundry.utils.duplicate = value => JSON.parse(JSON.stringify(value));

let confirmAnswer = true;
let confirmCalls = 0;
globalThis.Dialog = {
    confirm: options => {
        confirmCalls++;
        return confirmAnswer ? options.yes() : options.no();
    }
};

const { default: DropHelper } = await import("../module/scripts/drop-helpers.js");

const DAMAGE_TYPES = ["bashing", "lethal", "aggravated"];

function soakSettings(isrollable) {
    return {
        ...Object.fromEntries(DAMAGE_TYPES.map(type => [type, { bonus: 0, isrollable }])),
        chimerical: Object.fromEntries(DAMAGE_TYPES.map(type => [type, { bonus: 0, isrollable: false }]))
    };
}

/** A Splat item with no components, so only the replacement and settings code runs. */
function createSplat(overrides = {}) {
    return {
        type: "Splat",
        name: "Werewolf [modern]",
        system: {
            settings: {
                id: "werewolf",
                game: "werewolf",
                era: "modern",
                variant: "general",
                variantsheet: "werewolf",
                usechimerical: false,
                attributes: { defaultmaxvalue: 5 },
                abilities: { defaultmaxvalue: 5 },
                powers: { defaultmaxvalue: 5 },
                soak: soakSettings(true)
            },
            abilities: [],
            advantages: [],
            features: [],
            powers: [],
            bio: [{ key: "breed", label: "wod.bio.werewolf.breed", value: "", type: "input", listdata: "" }],
            health: {},
            ...overrides
        }
    };
}

/** A PC actor that records every write the drop makes. */
function createActor(items) {
    const calls = { deleted: [], created: [], updatedItems: [], updates: [] };
    const actor = {
        _id: "actor-pc",
        name: "Test PC",
        type: "PC",
        items,
        system: {
            attributes: {},
            health: {},
            traits: { health: { totalhealthlevels: { value: 7, max: 7 } } },
            bio: { splatfields: {} },
            settings: {
                splat: "vampire",
                game: "vampire",
                era: "modern",
                variant: "general",
                variantsheet: "vampire",
                usechimerical: false,
                attributes: { defaultmaxvalue: 5 },
                abilities: { defaultmaxvalue: 5 },
                powers: { defaultmaxvalue: 5 },
                soak: soakSettings(true)
            }
        },
        async deleteEmbeddedDocuments(type, ids) {
            calls.deleted.push(...ids);
            actor.items = actor.items.filter(item => !ids.includes(item.id));
        },
        async createEmbeddedDocuments(type, data) { calls.created.push(...data); },
        async updateEmbeddedDocuments(type, data) { calls.updatedItems.push(...data); },
        async update(data) { calls.updates.push(data); }
    };
    return { actor, calls };
}

const oldSplat = () => ({ id: "splat-old", type: "Splat", system: {} });
const ownGear = () => ({ id: "gear-1", type: "Item", system: {} });

test("dropping a Splat on an actor that already has one replaces the old Splat after confirmation", async () => {
    confirmAnswer = true;
    confirmCalls = 0;
    const { actor, calls } = createActor([oldSplat(), ownGear()]);

    await DropHelper.DropSplatToActor(actor, createSplat());

    assert.equal(confirmCalls, 1);
    assert.deepEqual(calls.deleted, ["splat-old"]);
    assert.ok(actor.items.some(item => item.id === "gear-1"), "items that are not Splats stay on the actor");
    assert.equal(calls.updates.length, 1);
    assert.equal(calls.updates[0].system.settings.splat, "werewolf");
    assert.equal(calls.updates[0].system.settings.game, "werewolf");
    assert.ok(calls.updates[0].system.bio.splatfields.breed, "splat bio fields are merged");
});

test("cancelling the replacement keeps the actor unchanged", async () => {
    confirmAnswer = false;
    confirmCalls = 0;
    const { actor, calls } = createActor([oldSplat(), ownGear()]);

    const result = await DropHelper.DropSplatToActor(actor, createSplat());

    assert.equal(result, false);
    assert.equal(confirmCalls, 1);
    assert.deepEqual(calls.deleted, []);
    assert.deepEqual(calls.updates, []);
    assert.equal(actor.items.length, 2);
});

test("dropping a Splat on an actor without one does not ask for confirmation", async () => {
    confirmAnswer = true;
    confirmCalls = 0;
    const { actor, calls } = createActor([ownGear()]);

    await DropHelper.DropSplatToActor(actor, createSplat());

    assert.equal(confirmCalls, 0);
    assert.deepEqual(calls.deleted, []);
    assert.equal(calls.updates.length, 1);
    assert.equal(calls.updates[0].system.settings.splat, "werewolf");
});
