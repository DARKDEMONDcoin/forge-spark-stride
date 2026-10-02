import { describe, expect, test } from "bun:test";
import { recommendationInput, recommendationOutput } from "../../src/lib/welcome-recommendation.server";
import { fallbackRecommendation } from "../../src/lib/welcome-recommendation-fallback";

describe("welcome recommendations", () => {
  test("rejects invalid or oversized anonymous input", () => {
    expect(recommendationInput.safeParse({ industry: "<script>", purpose: "business" }).success).toBe(false);
    expect(recommendationInput.safeParse({ industry: "a".repeat(61), purpose: "business" }).success).toBe(false);
    expect(recommendationInput.safeParse({ industry: "مقهى وحلويات", purpose: "business" }).success).toBe(true);
    expect(recommendationInput.safeParse({ industry: "استشارات هندسية", purpose: "business" }).success).toBe(true);
    expect(recommendationInput.safeParse({ industry: "عيادات", purpose: "hacker" }).success).toBe(false);
  });
  test("provides safe sector-specific next steps without invented market facts", () => {
    const coffee = fallbackRecommendation({ industry: "المطاعم والمقاهي", purpose: "business" });
    const engineering = fallbackRecommendation({ industry: "استشارات هندسية", purpose: "business" });
    expect(recommendationOutput.safeParse(coffee).success).toBe(true);
    expect(coffee.actions[0]?.text).not.toBe(engineering.actions[0]?.text);
    expect(coffee.insight).toContain("المطاعم والمقاهي");
  });
  test("references only supplied public evidence", () => {
    const result = fallbackRecommendation({ industry: "الأزياء", purpose: "job", site: { name: "متجر", summary: "", products: ["عبايات"], actions: ["تسوق الآن"], platform: "" } });
    expect(result.actions[0]?.text).toContain("عبايات");
    expect(result.actions[2]?.text).toContain("تسوق الآن");
  });
});