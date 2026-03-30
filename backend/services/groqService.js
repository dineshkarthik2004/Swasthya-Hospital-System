// groqService.js — Reusable Groq API service
// Accepts a system prompt and user text, returns parsed JSON from Groq

import Groq from "groq-sdk";

// Initialize the Groq client (uses GROQ_API_KEY from .env automatically)
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * Sends a prompt to the Groq API and returns structured JSON.
 *
 * @param {string} systemPrompt - Instructions that define AI behavior
 * @param {string} userText     - The speech transcript from the user
 * @returns {Object}            - Parsed JSON object from Groq's response
 */
export async function callGroq(systemPrompt, userText) {
  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    temperature: 0.2, // Low temperature for deterministic, structured output
    response_format: { type: "json_object" }, // Force JSON response
    messages: [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: userText,
      },
    ],
  });

  // Extract the text content from Groq's response
  const rawContent = completion.choices[0]?.message?.content;

  if (!rawContent) {
    throw new Error("Empty response received from Groq API.");
  }

  // Parse and return the JSON object
  return JSON.parse(rawContent);
}
