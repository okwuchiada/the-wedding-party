import { beforeAll, describe, expect, it, vi } from "vitest";

let canOptimizeImage: (src: string) => boolean;

beforeAll(async () => {
  vi.stubEnv("NEXT_PUBLIC_OPTIMIZED_IMAGE_HOSTS", "bucket.s3.eu-west-1.amazonaws.com,images.unsplash.com");
  ({ canOptimizeImage } = await import("./image-src"));
});

describe("canOptimizeImage", () => {
  it("optimizes local files and allowed https hosts", () => {
    expect(canOptimizeImage("/images/hero.jpg")).toBe(true);
    expect(canOptimizeImage("https://bucket.s3.eu-west-1.amazonaws.com/weddings/a/b.jpg")).toBe(true);
    expect(canOptimizeImage("https://images.unsplash.com/photo-1?w=900")).toBe(true);
  });

  it("leaves pasted links on other hosts unoptimized", () => {
    expect(canOptimizeImage("https://example.com/cake.jpg")).toBe(false);
    expect(canOptimizeImage("http://images.unsplash.com/photo-1")).toBe(false);
    expect(canOptimizeImage("//example.com/cake.jpg")).toBe(false);
    expect(canOptimizeImage("not a url")).toBe(false);
  });
});
