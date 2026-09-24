import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { answer } from "./engine.ts";

describe("chat engine", () => {
  it("lists prices in English with real data", () => {
    const out = answer("what are your prices?", "en");
    assert.ok(out?.includes("Traditional Thai Massage"));
    assert.ok(out?.includes("\u20ac50"));
  });

  it("answers a specific treatment in Portuguese", () => {
    const out = answer("falem-me da massagem de gravidez", "pt");
    assert.ok(out?.includes("Massagem de Gravidez"));
    assert.ok(out?.includes("Relaxante"));
    assert.ok(out?.includes("50"));
  });

  it("reports opening hours in 12-hour time", () => {
    const out = answer("when are you open?", "en");
    assert.ok(out?.includes("Every day"));
    assert.ok(out?.includes("10:00 AM – 9:00 PM"));
  });

  it("lists available booking times in 12-hour time", () => {
    const out = answer("how to book", "en");
    assert.ok(out?.includes("1:30 PM"));
  });

  it("explains how to book", () => {
    const out = answer("how to book", "en");
    assert.ok(out?.includes("booking form"));
  });

  it("routes walk-ins before generic booking keywords", () => {
    const out = answer("aceitam sem marcação?", "pt");
    assert.ok(out?.includes("sem marca"));
  });

  it("returns null for an unknown topic", () => {
    assert.equal(answer("banana falafel", "en"), null);
  });
});