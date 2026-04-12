/**
 * Integration tests for API routes.
 * These tests mock external dependencies (Anthropic, Supabase).
 * Run: npm run test:integration
 */

// Mock Anthropic SDK
jest.mock("@anthropic-ai/sdk", () => {
  return jest.fn().mockImplementation(() => ({
    messages: {
      create: jest.fn().mockResolvedValue({
        content: [
          {
            type: "text",
            text: "## Mock Intel Brief\n\nThis is a mock response for testing.",
          },
        ],
      }),
    },
  }));
});

// Mock Supabase
jest.mock("@supabase/supabase-js", () => ({
  createClient: jest.fn().mockReturnValue({
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      }),
      upsert: jest.fn().mockResolvedValue({ error: null }),
    }),
  }),
}));

// Set up env vars for tests
process.env.ANTHROPIC_API_KEY = "test-key-sk-ant-123";
process.env.SUPABASE_URL = "https://test.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "test-supabase-key";

describe("API Route: /api/generate", () => {
  const { POST: generateHandler } = require("@/app/api/generate/route");
  const { NextRequest } = require("next/server");

  function makeRequest(body: object) {
    return new NextRequest("http://localhost:3000/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  it("should return 400 when topicId is missing", async () => {
    const req = makeRequest({ phase: 1 });
    const res = await generateHandler(req);
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
  });

  it("should return 400 when phase is missing", async () => {
    const req = makeRequest({ topicId: "pollution" });
    const res = await generateHandler(req);
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
  });

  it("should return 404 for non-existent topic", async () => {
    const req = makeRequest({ topicId: "nonexistent-topic-xyz", phase: 1 });
    const res = await generateHandler(req);
    const json = await res.json();
    expect(res.status).toBe(404);
    expect(json.success).toBe(false);
  });

  it("should return 400 for phase outside 1-3", async () => {
    const req = makeRequest({ topicId: "pollution", phase: 4 });
    const res = await generateHandler(req);
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
  });

  it("should successfully generate phase 1 content", async () => {
    const req = makeRequest({ topicId: "pollution", topicName: "Pollution", phase: 1 });
    const res = await generateHandler(req);
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(typeof json.data).toBe("string");
    expect(json.data.length).toBeGreaterThan(0);
  });
});

describe("API Route: /api/grade", () => {
  const { POST: gradeHandler } = require("@/app/api/grade/route");
  const { NextRequest } = require("next/server");

  // Mock generateJSON for grading
  jest.mock("@/lib/anthropic", () => ({
    generateContent: jest.fn().mockResolvedValue("Mock content"),
    generateJSON: jest.fn().mockResolvedValue({
      grade: "borderline",
      score: 5,
      strengths: ["Good opening"],
      weaknesses: ["Missing facts"],
      corrections: ["Add more statistics"],
      overallFeedback: "Good attempt but needs more detail.",
    }),
  }));

  function makeRequest(body: object) {
    return new NextRequest("http://localhost:3000/api/grade", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  it("should return 400 when delivery is missing", async () => {
    const req = makeRequest({ topicId: "pollution" });
    const res = await gradeHandler(req);
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
  });

  it("should return 400 when delivery is too short", async () => {
    const req = makeRequest({ topicId: "pollution", delivery: "too short" });
    const res = await gradeHandler(req);
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.error).toMatch(/short/i);
  });

  it("should return 404 for non-existent topic", async () => {
    const req = makeRequest({
      topicId: "nonexistent-xyz",
      delivery: "This is a long enough delivery text for testing purposes in the SSB lecture.",
    });
    const res = await gradeHandler(req);
    const json = await res.json();
    expect(res.status).toBe(404);
    expect(json.success).toBe(false);
  });

  it("should successfully grade a delivery", async () => {
    const delivery = "Respected panel, the topic I have chosen today is Pollution. Pollution is the introduction of harmful substances into the natural environment, causing damage to ecosystems and human health. India has 9 of the world's 10 most polluted cities according to IQAir 2024 report.";
    const req = makeRequest({ topicId: "pollution", topicName: "Pollution", delivery });
    const res = await gradeHandler(req);
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
  });
});

describe("API Route: /api/weakpoints", () => {
  const { POST: weakpointsHandler } = require("@/app/api/weakpoints/route");
  const { NextRequest } = require("next/server");

  function makeRequest(body: object) {
    return new NextRequest("http://localhost:3000/api/weakpoints", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  it("should return 400 when required fields are missing", async () => {
    const req = makeRequest({ topicId: "pollution" });
    const res = await weakpointsHandler(req);
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
  });

  it("should return 404 for non-existent topic", async () => {
    const req = makeRequest({
      topicId: "nonexistent-xyz",
      delivery: "test delivery",
      gradingResult: {
        grade: "retry",
        score: 3,
        strengths: [],
        weaknesses: ["no structure"],
        corrections: ["add facts"],
        overallFeedback: "needs work",
      },
    });
    const res = await weakpointsHandler(req);
    const json = await res.json();
    expect(res.status).toBe(404);
  });

  it("should successfully generate weak point fix", async () => {
    const req = makeRequest({
      topicId: "pollution",
      topicName: "Pollution",
      delivery: "My delivery on pollution was not good",
      gradingResult: {
        grade: "retry",
        score: 3,
        strengths: ["attempted structure"],
        weaknesses: ["no specific facts", "no defence angle"],
        corrections: ["add government initiatives", "mention NGT"],
        overallFeedback: "Needs significant improvement with facts and structure.",
      },
    });
    const res = await weakpointsHandler(req);
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
  });
});
