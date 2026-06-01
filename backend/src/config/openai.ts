import OpenAI from "openai";

export type WeeklyNarrativeInput = {
  weekStartDate: string;
  weekEndDate: string;
  accomplishments: number;
  failures: number;
  averageRating: number;
  commonDistractions: string[];
  commonNegativeComponents: string[];
  commonPositiveComponents: string[];
  entryCount: number;
};

export type WeeklyNarrative = {
  summary: string;
  recommendations: string;
};

function getClient(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new OpenAI({ apiKey });
}

export async function generateWeeklyNarrative(
  input: WeeklyNarrativeInput
): Promise<WeeklyNarrative | null> {
  const client = getClient();
  if (!client) {
    return null;
  }

  const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

  try {
    const response = await client.chat.completions.create({
      model,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You write concise weekly journal reflections. Respond with JSON only, using keys \"summary\" and \"recommendations\". " +
            "Do not invent statistics; use only the provided metrics. Summary: 2-4 sentences. Recommendations: 2-4 actionable sentences."
        },
        {
          role: "user",
          content: JSON.stringify(input)
        }
      ]
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return null;
    }

    const parsed = JSON.parse(content) as { summary?: string; recommendations?: string };
    if (!parsed.summary || !parsed.recommendations) {
      return null;
    }

    return {
      summary: parsed.summary,
      recommendations: parsed.recommendations
    };
  } catch {
    return null;
  }
}

export function fallbackWeeklyNarrative(input: WeeklyNarrativeInput): WeeklyNarrative {
  if (input.entryCount === 0) {
    return {
      summary: `No journal entries were recorded between ${input.weekStartDate} and ${input.weekEndDate}.`,
      recommendations:
        "Try logging at least one entry per day next week so your report can reflect patterns in goals, distractions, and mood."
    };
  }

  const ratingText =
    input.entryCount > 0 ? ` Your average rating was ${input.averageRating.toFixed(1)}.` : "";

  return {
    summary:
      `From ${input.weekStartDate} to ${input.weekEndDate}, you logged ${input.entryCount} entries, ` +
      `completed ${input.accomplishments} goals, and had ${input.failures} uncompleted goals.${ratingText}`,
    recommendations:
      "Review your most common distractions and negative patterns, then schedule focused blocks around your top positive components next week."
  };
}
