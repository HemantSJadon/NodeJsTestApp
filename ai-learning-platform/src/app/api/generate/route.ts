import { NextRequest, NextResponse } from "next/server";
import { generateContent, generateJSON } from "@/lib/anthropic";
import { getCachedContent, setCachedContent } from "@/lib/cache";
import {
  getPhase1Prompt,
  getPhase2Prompt,
  getPhase3Prompt,
} from "@/lib/prompts";
import { GenerateRequest, ApiResponse, ConceptFireQA } from "@/types";
import { getTopicById } from "@/data/topics";

export async function POST(req: NextRequest) {
  try {
    const body: GenerateRequest = await req.json();
    const { topicId, phase } = body;

    if (!topicId || !phase) {
      return NextResponse.json<ApiResponse<string>>(
        { success: false, error: "Missing topicId or phase" },
        { status: 400 }
      );
    }

    // Only phases 1, 2, 3 are cacheable (not grading phases)
    if (phase < 1 || phase > 3) {
      return NextResponse.json<ApiResponse<string>>(
        { success: false, error: "Only phases 1-3 can be generated via this endpoint" },
        { status: 400 }
      );
    }

    const topic = getTopicById(topicId);
    if (!topic) {
      return NextResponse.json<ApiResponse<string>>(
        { success: false, error: `Topic not found: ${topicId}` },
        { status: 404 }
      );
    }

    // Check cache first
    const cached = await getCachedContent(topicId, phase);
    if (cached) {
      return NextResponse.json<ApiResponse<string>>({
        success: true,
        data: cached,
        cached: true,
      });
    }

    // Generate with Claude API
    let content: string;

    if (phase === 1) {
      content = await generateContent(getPhase1Prompt(topic.name));
    } else if (phase === 2) {
      content = await generateContent(getPhase2Prompt(topic.name));
    } else {
      // Phase 3: returns JSON questions
      const questions = await generateJSON<ConceptFireQA[]>(
        getPhase3Prompt(topic.name)
      );
      content = JSON.stringify(questions);
    }

    // Cache the result
    await setCachedContent(topicId, phase, content);

    return NextResponse.json<ApiResponse<string>>({
      success: true,
      data: content,
      cached: false,
    });
  } catch (error) {
    console.error("Generate API error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json<ApiResponse<string>>(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
