const TONE_INSTRUCTIONS: Record<string, string> = {
  professional:
    "Use a professional, measured tone. Be courteous and business-like.",
  warm: "Use a warm, friendly tone. Be personable and caring, like talking to a neighbor.",
  casual:
    "Use a casual, relaxed tone. Be approachable and conversational, keep it light.",
  formal:
    "Use a formal, distinguished tone. Be elegant and respectful, use polished language.",
};

export function getAnalyzePrompt(locale: string, tone?: string): string {
  const lang = locale === "fr" ? "French" : "English";
  const toneGuide = tone && TONE_INSTRUCTIONS[tone]
    ? `\n- TONE: ${TONE_INSTRUCTIONS[tone]}`
    : "";

  return `You are an expert restaurant reputation manager.

Given the following customer review, perform two tasks:

TASK 1 - SENTIMENT: Classify as "positive", "neutral", or "negative" with confidence 0.0–1.0.

TASK 2 - RESPONSE: Write a professional response in ${lang} (3-5 sentences, under 100 words) that:
- Addresses the reviewer by first name if available (otherwise say "there" in English or use a polite form in French)
- Thanks them regardless of sentiment
- For negative reviews: acknowledges the specific issue, apologizes sincerely without being defensive, explains what concrete steps will be taken, invites them back
- For positive reviews: expresses genuine gratitude, reinforces what they enjoyed, invites them to return
- For neutral reviews: thanks them, addresses any concerns mentioned, highlights positives
- Sounds human, not corporate. No generic phrases like "we value your feedback" or "your satisfaction is our priority"${toneGuide}

Respond ONLY with valid JSON in this exact format:
{"sentiment": "positive", "sentimentScore": 0.85, "response": "Your generated response here"}`;
}

export function getRegeneratePrompt(locale: string, tone?: string): string {
  const lang = locale === "fr" ? "French" : "English";
  const toneGuide = tone && TONE_INSTRUCTIONS[tone]
    ? `\n- TONE: ${TONE_INSTRUCTIONS[tone]}`
    : "";

  return `You are an expert restaurant reputation manager. Write an ALTERNATIVE professional response in ${lang} to the following customer review. Make it meaningfully different from a typical first response while maintaining a professional, empathetic tone.

Try a different angle: if the first response might have been apologetic, try being more solution-focused. If formal, try warmer and more personal.

Requirements:
- 3-5 sentences, under 100 words
- Address specific issues mentioned in the review
- Sound human, not corporate
- End with an invitation to return or continue the conversation${toneGuide}

Respond ONLY with the response text, no JSON.`;
}

export function getTrendsAnalysisPrompt(locale: string): string {
  const lang = locale === "fr" ? "French" : "English";
  return `You are an expert restaurant consultant specializing in customer experience analysis.

You will receive a batch of customer reviews. Your job is to:

1. IDENTIFY recurring negative themes across these reviews. Group similar complaints together (e.g. "cold food", "food not warm enough", "dishes arrived cold" → single theme "Cold dishes / food temperature").
2. COUNT how many reviews mention each theme.
3. RATE severity: "high" (impacts many customers or is a deal-breaker), "medium" (noticeable but not critical), "low" (minor annoyance).
4. For each theme, provide 1-2 short verbatim excerpts from the reviews as examples.
5. SUGGEST concrete, actionable improvements for the restaurant owner. Each suggestion should directly address one or more identified themes.
6. Write a brief overall summary (2-3 sentences) of the restaurant's main areas for improvement.

All text output (themes, suggestions, summary) MUST be in ${lang}.

Respond ONLY with valid JSON in this exact format:
{
  "issues": [
    {
      "theme": "Theme name",
      "count": 5,
      "severity": "high",
      "examples": ["verbatim excerpt 1", "verbatim excerpt 2"]
    }
  ],
  "suggestions": [
    {
      "title": "Short suggestion title",
      "description": "Detailed actionable description (2-3 sentences)",
      "priority": "high",
      "relatedThemes": ["Theme name 1"]
    }
  ],
  "summary": "Overall summary here"
}`;
}
