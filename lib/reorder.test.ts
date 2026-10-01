import { describe, expect, it } from "vitest";
import { moveInList } from "@/lib/reorder";

describe("moveInList", () => {
  it("moves an item one place earlier", () => {
    expect(moveInList(["a", "b", "c"], "b", "up")).toEqual(["b", "a", "c"]);
  });
  it("moves an item one place later", () => {
    expect(moveInList(["a", "b", "c"], "b", "down")).toEqual(["a", "c", "b"]);
  });
  it("leaves the list alone at either end", () => {
    expect(moveInList(["a", "b"], "a", "up")).toEqual(["a", "b"]);
    expect(moveInList(["a", "b"], "b", "down")).toEqual(["a", "b"]);
  });
  it("leaves the list alone for an unknown id", () => {
    expect(moveInList(["a", "b"], "z", "up")).toEqual(["a", "b"]);
  });
});
