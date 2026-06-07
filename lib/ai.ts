// lib/ai.ts
'use client';

import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase';

const generatePollCall = httpsCallable(functions, 'generatePollWithAI');
const rephraseContentCall = httpsCallable(functions, 'rephraseContent');
const generateImageCall = httpsCallable(functions, 'generateImage');
const generateOptionImagesCall = httpsCallable(functions, 'generateOptionImages');
const generatePollFromURLCall = httpsCallable(functions, 'generatePollFromURL');
const generatePollInsightsCall = httpsCallable(functions, 'generatePollInsights');
const generateAndUploadImageCall = httpsCallable(functions, 'generateAndUploadImage');
const getDetailedPromptCall = httpsCallable(functions, 'getDetailedPrompt');

export async function generatePollSuggestions(
  topic: string,
  numOptions: number = 4,
  pollType: string = 'quick',
  action: string = 'generate',
  existingOptions: string[] = []
) {
  console.log('[Frontend] generatePollSuggestions called:', { topic, numOptions, pollType, action });
  try {
    const result = await generatePollCall({
      topic,
      numOptions,
      pollType,
      action,
      existingOptions,
    });
    console.log('[Frontend] generatePollSuggestions success:', result.data);
    return result.data;
  } catch (err) {
    console.error('[Frontend] generatePollSuggestions error:', err);
    throw err;
  }
}

export async function rephraseContent(text: string, context: string = 'text') {
  console.log('[Frontend] rephraseContent called, text length:', text?.length);
  try {
    const result = await rephraseContentCall({ text, context });
    console.log('[Frontend] rephraseContent success, rephrased length:', result.data.rephrased?.length);
    return result.data.rephrased;
  } catch (err) {
    console.error('[Frontend] rephraseContent error:', err);
    return text;
  }
}

export async function generateImage(prompt: string, context: string = 'poll question') {
  console.log('[Frontend] generateImage called, prompt length:', prompt?.length);
  try {
    const result = await generateImageCall({ prompt, context });
    console.log('[Frontend] generateImage success, URL:', result.data.imageUrl);
    return result.data.imageUrl;
  } catch (err) {
    console.error('[Frontend] generateImage error:', err);
    throw err;
  }
}

export async function generateOptionImages(optionTexts: string[], pollQuestion: string) {
  console.log('[Frontend] generateOptionImages called, options count:', optionTexts.length);
  try {
    const result = await generateOptionImagesCall({ optionTexts, pollQuestion });
    console.log('[Frontend] generateOptionImages success, images count:', result.data.imageUrls?.length);
    return result.data.imageUrls;
  } catch (err) {
    console.error('[Frontend] generateOptionImages error:', err);
    return optionTexts.map(() => null);
  }
}

export async function generatePollFromURL(url: string, numOptions: number = 4, pollType: string = 'quick') {
  console.log('[Frontend] generatePollFromURL called:', { url, numOptions, pollType });
  try {
    const result = await generatePollFromURLCall({ url, numOptions, pollType });
    console.log('[Frontend] generatePollFromURL success:', result.data);
    return result.data;
  } catch (err) {
    console.error('[Frontend] generatePollFromURL error:', err);
    throw err;
  }
}

export async function generatePollInsights(pollId: string) {
  console.log('[Frontend] generatePollInsights called for poll:', pollId);
  try {
    const result = await generatePollInsightsCall({ pollId });
    console.log('[Frontend] generatePollInsights success');
    return result.data;
  } catch (err) {
    console.error('[Frontend] generatePollInsights error:', err);
    throw err;
  }
}

export async function generateAndUploadImage(
  prompt: string,
  folder: string,
  context: string = 'poll_question',
  style: string = 'auto',
  pollQuestion?: string,
  pollOptions: string[] = [],
  optionIndex?: number,
  totalOptions?: number,
  pollType: string = 'quick',
  customPrompt: boolean = false
) {
  console.log('[Frontend] generateAndUploadImage called', { customPrompt });
  const result = await generateAndUploadImageCall({
    prompt,
    folder,
    context,
    style,
    pollQuestion,
    pollOptions,
    optionIndex,
    totalOptions,
    pollType,
    customPrompt,
  });
  return result.data.imageUrl;
}

export async function getDetailedPrompt(
  subject: string,
  context: string = 'poll_question',
  style: string = 'auto',
  pollQuestion?: string,
  pollOptions: string[] = [],
  optionIndex?: number,
  totalOptions?: number,
  pollType: string = 'quick'
) {
  console.log('[Frontend] getDetailedPrompt called');
  const result = await getDetailedPromptCall({
    subject,
    context,
    style,
    pollQuestion,
    pollOptions,
    optionIndex,
    totalOptions,
    pollType,
  });
  return result.data.detailedPrompt;
}

export async function rewritePromptForDalle(prompt: string) {
  console.warn('[Frontend] rewritePromptForDalle is deprecated; rewriting is done server‑side in generateImage.');
  return prompt;
}