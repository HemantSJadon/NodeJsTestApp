import { NextRequest, NextResponse } from "next/server";
import { generateJSON } from "@/lib/anthropic";
import { getGradingPrompt } from "@/lib/prompts";
import { GradeRequest, GradingResult, ApiResponse } from "@/types";
import { getTopicById } from "@/data/topics";

export async function POST(req: NextRequest) {
  try {
    const body: GradeRequest = await req.json();
    const { topicId, delivery, intelBrief } = body;

    if (!topicId || !delivery) {
      return NextResponse.json<ApiResponse<GradingResult>>(
        { success: false, error: "Missing topicId or delivery" },
        { status: 400 }
      );
    }

    if (delivery.trim().length < 50) {
      return NextResponse.json<ApiResponse<GradingResult>>(
        {
          success: false,
          error: "Delivery is too short. Please write at least 50 characters.",
        },
        { status: 400 }
      );
    }

    const topic = getTopicById(topicId);
    if (!topic) {
      return NextResponse.json<ApiResponse<GradingResult>>(
        { success: false, error: `Topic not found: ${topicId}` },
        { status: 404 }
      );
    }

    // Grading is never cached — each delivery is unique
    const prompt = getGradingPrompt(topic.name, delivery, intelBrief);
    const result = await generateJSON<GradingResult>(prompt);

    return NextResponse.json<ApiResponse<GradingResult>>({
      success: true,
      data: result,
      cached: false,
    });
  } catch (error) {
    console.error("Grade API error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json<ApiResponse<GradingResult>>(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
