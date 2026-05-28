'use server';
/**
 * @fileOverview A GenAI flow for generating sarcastic and humorous match recaps based on user predictions and actual results.
 *
 * - sarcasticMatchRecap - A function that triggers the AI to generate a match recap.
 * - SarcasticMatchRecapInput - The input type for the sarcasticMatchRecap function.
 * - SarcasticMatchRecapOutput - The return type for the sarcasticMatchRecap function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SarcasticMatchRecapInputSchema = z.object({
  homeTeamName: z.string().describe('The name of the home team.'),
  awayTeamName: z.string().describe('The name of the away team.'),
  predictedHomeScore: z.number().describe('The user\'s predicted score for the home team.'),
  predictedAwayScore: z.number().describe('The user\'s predicted score for the away team.'),
  actualHomeScore: z.number().describe('The actual score for the home team.'),
  actualAwayScore: z.number().describe('The actual score for the away team.'),
});
export type SarcasticMatchRecapInput = z.infer<typeof SarcasticMatchRecapInputSchema>;

const SarcasticMatchRecapOutputSchema = z.object({
  recap: z.string().describe('A humorous and sarcastic recap of the user\'s prediction vs. the actual match result.'),
});
export type SarcasticMatchRecapOutput = z.infer<typeof SarcasticMatchRecapOutputSchema>;

const sarcasticMatchRecapPrompt = ai.definePrompt({
  name: 'sarcasticMatchRecapPrompt',
  input: {
    schema: SarcasticMatchRecapInputSchema.extend({
      isCorrectResult: z.boolean().describe('True if the user predicted the correct outcome (win, loss, or draw).'),
      isExactScore: z.boolean().describe('True if the user predicted the exact final score.'),
      isCorrectGoalDifference: z.boolean().describe('True if the user predicted the correct goal difference.'),
    }),
  },
  output: { schema: SarcasticMatchRecapOutputSchema },
  prompt: `You are a highly sarcastic and witty football commentator. Your task is to provide a humorous recap of a user's prediction for a football match, contrasting it with the actual outcome. Be entertaining, slightly condescending if the prediction was wildly off, or begrudgingly complimentary if it was surprisingly accurate. Keep it concise and engaging.

Here's the match scenario:
User predicted: {{{homeTeamName}}} {{{predictedHomeScore}}}-{{{predictedAwayScore}}} {{{awayTeamName}}}
Actual score: {{{homeTeamName}}} {{{actualHomeScore}}}-{{{actualAwayScore}}} {{{awayTeamName}}}

Prediction analysis:
- Correct outcome (win/draw/loss): {{{isCorrectResult}}}
- Exact score: {{{isExactScore}}}
- Correct goal difference: {{{isCorrectGoalDifference}}}

Using this information, generate a single, sarcastic recap.
Your response MUST be a JSON object matching the following schema:
{{json output.schema}}`,
});

const sarcasticMatchRecapFlow = ai.defineFlow(
  {
    name: 'sarcasticMatchRecapFlow',
    inputSchema: SarcasticMatchRecapInputSchema,
    outputSchema: SarcasticMatchRecapOutputSchema,
  },
  async (input) => {
    const predictedResultType = (homeScore: number, awayScore: number) => {
      if (homeScore > awayScore) return 'HOME_WIN';
      if (awayScore > homeScore) return 'AWAY_WIN';
      return 'DRAW';
    };

    const actualResultType = predictedResultType(input.actualHomeScore, input.actualAwayScore);
    const predictedResult = predictedResultType(input.predictedHomeScore, input.predictedAwayScore);

    const isCorrectResult = predictedResult === actualResultType;
    const isExactScore = input.predictedHomeScore === input.actualHomeScore && input.predictedAwayScore === input.actualAwayScore;
    const isCorrectGoalDifference = (input.predictedHomeScore - input.predictedAwayScore) === (input.actualHomeScore - input.actualAwayScore);

    const { output } = await sarcasticMatchRecapPrompt({
      ...input,
      isCorrectResult,
      isExactScore,
      isCorrectGoalDifference,
    });
    return output!;
  }
);

export async function sarcasticMatchRecap(input: SarcasticMatchRecapInput): Promise<SarcasticMatchRecapOutput> {
  return sarcasticMatchRecapFlow(input);
}
