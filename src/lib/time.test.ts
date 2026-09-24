import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { to12h } from "./time.ts";

describe("to12h", () => {
  it("converts morning times", () => {
    assert.equal(to12h("10:00"), "10:00 AM");
    assert.equal(to12h("09:00"), "9:00 AM");
  });

  it("converts afternoon and evening times", () => {
    assert.equal(to12h("13:30"), "1:30 PM");
    assert.equal(to12h("21:00"), "9:00 PM");
  });

  it("handles noon and midnight", () => {
    assert.equal(to12h("12:00"), "12:00 PM");
    assert.equal(to12h("00:00"), "12:00 AM");
  });

  it("formats ranges on both sides", () => {
    assert.equal(to12h("10:00 – 21:00"), "10:00 AM – 9:00 PM");
  });
});