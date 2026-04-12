import {
  SYSTEM_PROMPT,
  getPhase1Prompt,
  getPhase2Prompt,
  getPhase3Prompt,
  getGradingPrompt,
  getWeakPointFixPrompt,
} from "@/lib/prompts";

describe("Prompts", () => {
  describe("SYSTEM_PROMPT", () => {
    it("should be a non-empty string", () => {
      expect(typeof SYSTEM_PROMPT).toBe("string");
      expect(SYSTEM_PROMPT.trim().length).toBeGreaterThan(100);
    });

    it("should mention SSB and CDS preparation", () => {
      expect(SYSTEM_PROMPT).toMatch(/SSB/i);
      expect(SYSTEM_PROMPT).toMatch(/CDS/i);
    });

    it("should establish expert persona", () => {
      expect(SYSTEM_PROMPT).toMatch(/expert/i);
    });
  });

  describe("getPhase1Prompt", () => {
    it("should include the topic name", () => {
      const prompt = getPhase1Prompt("Pollution");
      expect(prompt).toContain("Pollution");
    });

    it("should request all required sections", () => {
      const prompt = getPhase1Prompt("Pollution");
      expect(prompt).toMatch(/WHAT IS/i);
      expect(prompt).toMatch(/CAUSES/i);
      expect(prompt).toMatch(/CONSEQUENCES/i);
      expect(prompt).toMatch(/Defence/i);
      expect(prompt).toMatch(/GOVERNMENT INITIATIVES/i);
      expect(prompt).toMatch(/SOLUTIONS/i);
    });

    it("should work with any topic name", () => {
      const topics = ["Global Warming", "BRICS", "Make in India", "Yoga"];
      topics.forEach((topic) => {
        const prompt = getPhase1Prompt(topic);
        expect(prompt).toContain(topic);
        expect(prompt.length).toBeGreaterThan(200);
      });
    });
  });

  describe("getPhase2Prompt", () => {
    it("should include the topic name", () => {
      const prompt = getPhase2Prompt("Deforestation");
      expect(prompt).toContain("Deforestation");
    });

    it("should specify word count requirement", () => {
      const prompt = getPhase2Prompt("Deforestation");
      expect(prompt).toMatch(/350|380|3.?minut/i);
    });

    it("should request a script format", () => {
      const prompt = getPhase2Prompt("Deforestation");
      expect(prompt).toMatch(/script/i);
    });

    it("should mention delivery notes", () => {
      const prompt = getPhase2Prompt("Deforestation");
      expect(prompt).toMatch(/delivery/i);
    });
  });

  describe("getPhase3Prompt", () => {
    it("should include the topic name", () => {
      const prompt = getPhase3Prompt("Artificial Intelligence");
      expect(prompt).toContain("Artificial Intelligence");
    });

    it("should request exactly 10 questions", () => {
      const prompt = getPhase3Prompt("Artificial Intelligence");
      expect(prompt).toMatch(/10/);
    });

    it("should specify JSON format", () => {
      const prompt = getPhase3Prompt("Artificial Intelligence");
      expect(prompt).toMatch(/JSON/i);
    });

    it("should define question/answer structure", () => {
      const prompt = getPhase3Prompt("Artificial Intelligence");
      expect(prompt).toMatch(/question/i);
      expect(prompt).toMatch(/answer/i);
    });
  });

  describe("getGradingPrompt", () => {
    const mockDelivery = "Today I will speak about Pollution. Pollution is a major environmental problem...";

    it("should include topic name", () => {
      const prompt = getGradingPrompt("Pollution", mockDelivery);
      expect(prompt).toContain("Pollution");
    });

    it("should include the student delivery", () => {
      const prompt = getGradingPrompt("Pollution", mockDelivery);
      expect(prompt).toContain(mockDelivery);
    });

    it("should specify all three grade levels", () => {
      const prompt = getGradingPrompt("Pollution", mockDelivery);
      expect(prompt).toMatch(/ready/i);
      expect(prompt).toMatch(/borderline/i);
      expect(prompt).toMatch(/retry/i);
    });

    it("should request JSON output", () => {
      const prompt = getGradingPrompt("Pollution", mockDelivery);
      expect(prompt).toMatch(/JSON/i);
    });

    it("should optionally include intel brief context", () => {
      const intelBrief = "Sample intel brief content...";
      const promptWithBrief = getGradingPrompt("Pollution", mockDelivery, intelBrief);
      const promptWithout = getGradingPrompt("Pollution", mockDelivery);
      expect(promptWithBrief.length).toBeGreaterThan(promptWithout.length);
    });
  });

  describe("getWeakPointFixPrompt", () => {
    const mockGrading = {
      grade: "retry",
      score: 3,
      weaknesses: ["No facts", "No structure"],
      corrections: ["Add government initiatives", "Include defence angle"],
      overallFeedback: "Needs significant improvement",
    };

    it("should include topic name", () => {
      const prompt = getWeakPointFixPrompt("BRICS", "My delivery text", mockGrading);
      expect(prompt).toContain("BRICS");
    });

    it("should include the grade", () => {
      const prompt = getWeakPointFixPrompt("BRICS", "My delivery text", mockGrading);
      expect(prompt).toContain("retry".toUpperCase());
    });

    it("should include weaknesses", () => {
      const prompt = getWeakPointFixPrompt("BRICS", "My delivery text", mockGrading);
      expect(prompt).toContain("No facts");
      expect(prompt).toContain("No structure");
    });

    it("should include corrections", () => {
      const prompt = getWeakPointFixPrompt("BRICS", "My delivery text", mockGrading);
      expect(prompt).toContain("Add government initiatives");
    });

    it("should request structured fix session format", () => {
      const prompt = getWeakPointFixPrompt("BRICS", "My delivery text", mockGrading);
      expect(prompt).toMatch(/FIX/i);
    });
  });
});
