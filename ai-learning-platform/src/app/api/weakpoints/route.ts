import { NextRequest, NextResponse } from "next/server";
import { generateContent } from "@/lib/anthropic";
import { getWeakPointFixPrompt } from "@/lib/prompts";
import { WeakPointRequest, ApiResponse } from "@/types";
import { getTopicById } from "@/data/topics";

export async function POST(req: NextRequest) {
  try {
    const body: WeakPointRequest = await req.json();
    const { topicId, delivery, gradingResult } = body;

    if (!topicId || !gradingResult || !delivery) {
      return NextResponse.json<ApiResponse<string>>(
        { success: false, error: "Missing topicId, delivery, or gradingResult" },
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

    // Weak point fix is personalized — never cached
    const prompt = getWeakPointFixPrompt(topic.name, delivery, gradingResult);
    const content = await generateContent(prompt);

    return NextResponse.json<ApiResponse<string>>({
      success: true,
      data: content,
      cached: false,
    });
  } catch (error) {
    console.error("WeakPoints API error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json<ApiResponse<string>>(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
