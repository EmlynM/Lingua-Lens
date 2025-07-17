// This file is machine-generated - edit at your own risk.

'use server';

/**
 * @fileOverview Provides word definitions, synonyms, and example usages for a given word.
 *
 * - lookupWordDefinition - A function that handles the word definition lookup process.
 * - LookupWordDefinitionInput - The input type for the lookupWordDefinition function.
 * - LookupWordDefinitionOutput - The return type for the lookupWordDefinition function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const LookupWordDefinitionInputSchema = z.object({
  word: z.string().describe('The word to look up.'),
  language: z.string().describe('The language of the word.'),
});
export type LookupWordDefinitionInput = z.infer<
  typeof LookupWordDefinitionInputSchema
>;

const LookupWordDefinitionOutputSchema = z.object({
  definition: z.string().describe('The definition of the word.'),
  synonyms: z.array(z.string()).describe('Synonyms for the word.'),
  examples: z.array(z.string()).describe('Example usages of the word.'),
});
export type LookupWordDefinitionOutput = z.infer<
  typeof LookupWordDefinitionOutputSchema
>;

export async function lookupWordDefinition(
  input: LookupWordDefinitionInput
): Promise<LookupWordDefinitionOutput> {
  return lookupWordDefinitionFlow(input);
}

const lookupWordDefinitionPrompt = ai.definePrompt({
  name: 'lookupWordDefinitionPrompt',
  input: {schema: LookupWordDefinitionInputSchema},
  output: {schema: LookupWordDefinitionOutputSchema},
  prompt: `You are a dictionary. Provide the definition, synonyms, and example usages for the word "{{word}}" in {{language}}.

Definition:
Synonyms:
Examples:`,
});

const lookupWordDefinitionFlow = ai.defineFlow(
  {
    name: 'lookupWordDefinitionFlow',
    inputSchema: LookupWordDefinitionInputSchema,
    outputSchema: LookupWordDefinitionOutputSchema,
  },
  async input => {
    const {output} = await lookupWordDefinitionPrompt(input);
    return output!;
  }
);
