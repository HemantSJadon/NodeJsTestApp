import Anthropic from "@anthropic-ai/sdk";
import { SYSTEM_PROMPT } from "./prompts";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MODEL = "claude-sonnet-4-6";

export async function generateContent(userPrompt: string): Promise<string> {
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 4096,
    system: [
      {
        type: "text",
        text: SYSTEM_PROMPT,
        // @ts-expect-error - cache_control is valid in Anthropic SDK
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [
      {
        role: "user",
        content: userPrompt,
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text response from Claude");
  }

  return textBlock.text;
}

export async function generateJSON<T>(userPrompt: string): Promise<T> {
  const raw = await generateContent(userPrompt);

  // Extract JSON from the response (Claude sometimes wraps it)
  const jsonMatch = raw.match(/```json\n?([\s\S]*?)\n?```/) ||
    raw.match(/(\[[\s\S]*\]|\{[\s\S]*\})/);

  const jsonStr = jsonMatch ? jsonMatch[1] || jsonMatch[0] : raw.trim();

  try {
    return JSON.parse(jsonStr) as T;
  } catch {
    // Try to find JSON in the response
    const arrayMatch = raw.match(/\[[\s\S]*\]/);
    const objectMatch = raw.match(/\{[\s\S]*\}/);
    const match = arrayMatch || objectMatch;
    if (match) {
      return JSON.parse(match[0]) as T;
    }
    throw new Error(`Failed to parse JSON response: ${raw.substring(0, 200)}`);
  }
}
