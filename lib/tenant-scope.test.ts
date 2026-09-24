import { describe, expect, it } from "vitest";
import { scopeArgs, TenantScopeError } from "@/lib/tenant-scope";

const W = "wed_a";

describe("scopeArgs", () => {
  it("leaves non-tenant models alone", () => {
    const args = { where: { slug: "x" } };
    expect(scopeArgs("Wedding", "findUnique", args, W)).toBe(args);
  });

  it("adds weddingId to reads, counts and deletes", () => {
    for (const op of ["findMany", "findFirst", "findUnique", "count", "aggregate", "delete", "deleteMany"]) {
      expect(scopeArgs("Rsvp", op, { where: { id: "r1" } }, W)).toEqual({
        where: { id: "r1", weddingId: W },
      });
    }
    expect(scopeArgs("Wish", "findMany", undefined, W)).toEqual({ where: { weddingId: W } });
  });

  it("rejects filters that target another wedding", () => {
    expect(() => scopeArgs("Rsvp", "findMany", { where: { weddingId: "wed_b" } }, W)).toThrow(
      TenantScopeError
    );
  });

  it("scopes updates by id and wedding", () => {
    expect(scopeArgs("Media", "update", { where: { id: "m1" }, data: { status: "APPROVED" } }, W)).toEqual({
      where: { id: "m1", weddingId: W },
      data: { status: "APPROVED" },
    });
  });

  it("refuses to move rows to another wedding", () => {
    expect(() =>
      scopeArgs("Media", "update", { where: { id: "m1" }, data: { weddingId: "wed_b" } }, W)
    ).toThrow(TenantScopeError);
    expect(() =>
      scopeArgs("Media", "updateMany", { data: { wedding: { connect: { id: "wed_b" } } } }, W)
    ).toThrow(TenantScopeError);
  });

  it("stamps created rows", () => {
    expect(scopeArgs("Wish", "create", { data: { message: "hi" } }, W)).toEqual({
      data: { message: "hi", weddingId: W },
    });
    expect(scopeArgs("StoryPhoto", "createMany", { data: [{ url: "a" }, { url: "b" }] }, W)).toEqual({
      data: [
        { url: "a", weddingId: W },
        { url: "b", weddingId: W },
      ],
    });
  });

  it("rejects creates for another wedding", () => {
    expect(() => scopeArgs("Wish", "create", { data: { weddingId: "wed_b" } }, W)).toThrow(TenantScopeError);
    expect(() =>
      scopeArgs("Wish", "create", { data: { wedding: { connect: { id: "wed_b" } } } }, W)
    ).toThrow(TenantScopeError);
  });

  it("scopes upserts on both branches", () => {
    expect(
      scopeArgs("StoryContent", "upsert", { where: { weddingId: W }, update: { tagline: "t" }, create: { tagline: "t" } }, W)
    ).toEqual({
      where: { weddingId: W },
      update: { tagline: "t" },
      create: { tagline: "t", weddingId: W },
    });
  });

  it("fails closed on operations it does not understand", () => {
    expect(() => scopeArgs("Rsvp", "findRaw", {}, W)).toThrow(TenantScopeError);
  });
});
