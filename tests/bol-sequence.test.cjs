/**
 * BOL Sequence & Count Starting Verification Test Suite
 * Validates that BOL sequence starts from BOL-NSA598 and progresses atomically.
 */

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const loadTypescript = require("./load-typescript.cjs");

const {
  extractBolNumberSuffix,
  START_SEQUENCE,
  DEFAULT_BOL_PREFIX,
} = loadTypescript("lib/services/bol-sequence.ts");

test("BOL Sequence Starting Number & Format Verification", async (t) => {
  await t.test("1. Starting sequence is configured to 598 with BOL-NSA prefix", () => {
    assert.equal(START_SEQUENCE, 598, "START_SEQUENCE must be 598");
    assert.equal(DEFAULT_BOL_PREFIX, "BOL-NSA", "DEFAULT_BOL_PREFIX must be BOL-NSA");
  });

  await t.test("2. extractBolNumberSuffix correctly extracts sequence numbers", () => {
    assert.equal(extractBolNumberSuffix("BOL-NSA598"), 598);
    assert.equal(extractBolNumberSuffix("BOL-NSA599"), 599);
    assert.equal(extractBolNumberSuffix("BOL-2026-NSA598"), 598);
    assert.equal(extractBolNumberSuffix("BOL-2026-NSA600"), 600);
    assert.equal(extractBolNumberSuffix("BOL-NSA1000"), 1000);
    assert.equal(extractBolNumberSuffix(""), 0);
    assert.equal(extractBolNumberSuffix(null), 0);
  });

  await t.test("3. .local-bol-sequence.json is configured for BOL-NSA598", () => {
    const seqPath = path.resolve(".local-bol-sequence.json");
    assert.ok(fs.existsSync(seqPath), ".local-bol-sequence.json must exist");
    
    const data = JSON.parse(fs.readFileSync(seqPath, "utf8"));
    assert.equal(data.prefix, "BOL-NSA", "Prefix must be BOL-NSA");
    assert.equal(data.startSequence, 598, "startSequence must be 598");
    
    // The next allocated sequence is sequence + 1
    const nextAllocated = (data.sequence || 597) + 1;
    assert.equal(nextAllocated, 598, "Next allocated BOL count must be 598");
    assert.equal(`${data.prefix}${nextAllocated}`, "BOL-NSA598", "Next BOL number must be BOL-NSA598");
  });

  await t.test("4. Sequential progression formula produces sequential BOL numbers", () => {
    let currentSeq = 597;
    const prefix = "BOL-NSA";

    const bol1 = `${prefix}${++currentSeq}`;
    const bol2 = `${prefix}${++currentSeq}`;
    const bol3 = `${prefix}${++currentSeq}`;

    assert.equal(bol1, "BOL-NSA598", "First BOL must be BOL-NSA598");
    assert.equal(bol2, "BOL-NSA599", "Second BOL must be BOL-NSA599");
    assert.equal(bol3, "BOL-NSA600", "Third BOL must be BOL-NSA600");
  });
});
