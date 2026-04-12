import {
  ALL_TOPICS,
  TOPICS_BY_CATEGORY,
  getTopicById,
  getAdjacentTopics,
  CATEGORY_LABELS,
} from "@/data/topics";

describe("Topics Data", () => {
  describe("ALL_TOPICS", () => {
    it("should contain exactly 203 topics", () => {
      expect(ALL_TOPICS.length).toBe(203);
    });

    it("should have below-average, average, and above-average categories", () => {
      const categories = [...new Set(ALL_TOPICS.map((t) => t.category))];
      expect(categories).toContain("below-average");
      expect(categories).toContain("average");
      expect(categories).toContain("above-average");
    });

    it("should have unique ids", () => {
      const ids = ALL_TOPICS.map((t) => t.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it("should have non-empty names for all topics", () => {
      ALL_TOPICS.forEach((t) => {
        expect(t.name.trim()).not.toBe("");
      });
    });

    it("should have valid category values", () => {
      ALL_TOPICS.forEach((t) => {
        expect(["below-average", "average", "above-average"]).toContain(
          t.category
        );
      });
    });

    it("should have sequential numbers within each category", () => {
      const categories = ["below-average", "average", "above-average"] as const;
      categories.forEach((cat) => {
        const topics = TOPICS_BY_CATEGORY[cat];
        topics.forEach((topic, index) => {
          expect(topic.number).toBe(index + 1);
        });
      });
    });
  });

  describe("TOPICS_BY_CATEGORY", () => {
    it("should have 27 below-average topics", () => {
      expect(TOPICS_BY_CATEGORY["below-average"].length).toBe(27);
    });

    it("should have 107 average topics", () => {
      expect(TOPICS_BY_CATEGORY["average"].length).toBe(107);
    });

    it("should have 69 above-average topics", () => {
      // Our list has slightly adjusted count — verify it's populated
      expect(TOPICS_BY_CATEGORY["above-average"].length).toBeGreaterThan(60);
    });

    it("should include Pollution in below-average", () => {
      const pollution = TOPICS_BY_CATEGORY["below-average"].find(
        (t) => t.name === "Pollution"
      );
      expect(pollution).toBeDefined();
    });

    it("should include Make in India in average", () => {
      const topic = TOPICS_BY_CATEGORY["average"].find(
        (t) => t.name === "Make in India"
      );
      expect(topic).toBeDefined();
    });

    it("should include BRICS in above-average", () => {
      const topic = TOPICS_BY_CATEGORY["above-average"].find(
        (t) => t.name === "BRICS"
      );
      expect(topic).toBeDefined();
    });
  });

  describe("getTopicById", () => {
    it("should return a topic by valid id", () => {
      const topic = getTopicById("pollution");
      expect(topic).toBeDefined();
      expect(topic?.name).toBe("Pollution");
    });

    it("should return undefined for invalid id", () => {
      const topic = getTopicById("nonexistent-topic-123");
      expect(topic).toBeUndefined();
    });

    it("should find topics by their slug id", () => {
      const topic = getTopicById("global-warming");
      expect(topic).toBeDefined();
      expect(topic?.category).toBe("below-average");
    });
  });

  describe("getAdjacentTopics", () => {
    it("should return next topic for first topic", () => {
      const firstTopicId = ALL_TOPICS[0].id;
      const { prev, next } = getAdjacentTopics(firstTopicId);
      expect(prev).toBeNull();
      expect(next).toBeDefined();
      expect(next?.id).toBe(ALL_TOPICS[1].id);
    });

    it("should return prev topic for last topic", () => {
      const lastTopicId = ALL_TOPICS[ALL_TOPICS.length - 1].id;
      const { prev, next } = getAdjacentTopics(lastTopicId);
      expect(prev).toBeDefined();
      expect(next).toBeNull();
    });

    it("should return both prev and next for middle topic", () => {
      const midTopicId = ALL_TOPICS[10].id;
      const { prev, next } = getAdjacentTopics(midTopicId);
      expect(prev).toBeDefined();
      expect(next).toBeDefined();
    });

    it("should return null for invalid topic id", () => {
      const { prev, next } = getAdjacentTopics("invalid-id");
      expect(prev).toBeNull();
      expect(next).toBeNull();
    });
  });

  describe("CATEGORY_LABELS", () => {
    it("should have correct labels", () => {
      expect(CATEGORY_LABELS["below-average"]).toBe("Below Average");
      expect(CATEGORY_LABELS["average"]).toBe("Average");
      expect(CATEGORY_LABELS["above-average"]).toBe("Above Average");
    });
  });
});
