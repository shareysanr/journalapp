import OpenAI from "openai";
import { logger } from "./logger";

export type RecurringGoalWeekSummary = {
  title: string;
  completedDays: number;
  totalDays: number;
};

export type WeeklyNarrativeInput = {
  weekStartDate: string;
  weekEndDate: string;
  accomplishments: number;
  failures: number;
  averageRating: number;
  averageMood: number | null;
  averageMotivation: number | null;
  highestMood: number | null;
  lowestMood: number | null;
  highestMotivation: number | null;
  lowestMotivation: number | null;
  commonDistractions: string[];
  commonNegativeComponents: string[];
  commonPositiveComponents: string[];
  entryCount: number;
  recurringGoals: RecurringGoalWeekSummary[];
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
    logger.warn({ event: "openai_not_configured" }, "OPENAI_API_KEY is missing; using fallback");
    return null;
  }

  const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
  logger.info(
    { event: "openai_weekly_narrative_requested", model, entryCount: input.entryCount },
    "Requesting weekly narrative from OpenAI"
  );

  try {
    const response = await client.chat.completions.create({
      model,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You write concise weekly journal reflections. Respond with JSON only, using keys \"summary\" and \"recommendations\". " +
            "Do not invent statistics; use only the provided metrics. Summary: 2-4 sentences. Recommendations: 2-4 actionable sentences. " +
            "When recurringGoals are provided, mention daily habit consistency alongside journal patterns."
        },
        {
          role: "user",
          content: JSON.stringify(input)
        }
      ]
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      logger.warn({ event: "openai_weekly_narrative_empty_response", model });
      return null;
    }

    const parsed = JSON.parse(content) as { summary?: string; recommendations?: string };
    if (!parsed.summary || !parsed.recommendations) {
      logger.warn({ event: "openai_weekly_narrative_invalid_json_shape", model });
      return null;
    }

    logger.info({ event: "openai_weekly_narrative_success", model }, "OpenAI narrative generated");
    return {
      summary: parsed.summary,
      recommendations: parsed.recommendations
    };
  } catch (err) {
    logger.error({ event: "openai_weekly_narrative_error", model, err }, "OpenAI request failed");
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

  const ratingText = ` Your average rating was ${input.averageRating.toFixed(1)}.`;
  const moodText =
    input.averageMood !== null && input.lowestMood !== null && input.highestMood !== null
      ? ` Average mood was ${input.averageMood.toFixed(1)} (range ${input.lowestMood}–${input.highestMood}).`
      : "";
  const motivationText =
    input.averageMotivation !== null &&
    input.lowestMotivation !== null &&
    input.highestMotivation !== null
      ? ` Average motivation was ${input.averageMotivation.toFixed(1)} (range ${input.lowestMotivation}–${input.highestMotivation}).`
      : "";

  const recurringGoalsText =
    input.recurringGoals.length > 0
      ? ` Daily habits: ${input.recurringGoals
          .map((goal) => `${goal.title} (${goal.completedDays}/${goal.totalDays} days)`)
          .join(", ")}.`
      : "";

  return {
    summary:
      `From ${input.weekStartDate} to ${input.weekEndDate}, you logged ${input.entryCount} entries, ` +
      `completed ${input.accomplishments} goals, and had ${input.failures} uncompleted goals.${ratingText}${moodText}${motivationText}${recurringGoalsText}`,
    recommendations:
      "Review your most common distractions and negative patterns, then schedule focused blocks around your top positive components next week."
  };
}
