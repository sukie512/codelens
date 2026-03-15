import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import Groq from "groq-sdk";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, "../.env") });

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_PROMPTS = {
  full: `You are a senior software engineer conducting a thorough code review. Analyze the code for:
1. Security vulnerabilities (injections, exposed secrets, improper validation)
2. Performance issues (complexity, unnecessary loops, memory leaks)
3. Code quality (naming, structure, DRY violations, readability)
4. Missing error handling and edge cases

Respond in this EXACT JSON format (no markdown, no extra text):
{
  "summary": "2-3 sentence overall assessment",
  "score": <0-100 integer>,
  "issues": [
    {
      "severity": "critical|high|medium|low",
      "line": <line number or null>,
      "title": "Short issue title",
      "description": "Clear explanation of the problem",
      "suggestion": "Concrete fix or improvement"
    }
  ]
}`,

  security: `You are a security-focused code auditor. Only report security vulnerabilities: SQL injection, XSS, CSRF, exposed credentials, insecure dependencies, improper auth, data exposure.

Respond in EXACT JSON:
{
  "summary": "Security assessment summary",
  "score": <0-100>,
  "issues": [{ "severity": "critical|high|medium|low", "line": <number|null>, "title": "...", "description": "...", "suggestion": "..." }]
}`,

  performance: `You are a performance optimization expert. Only report performance issues: time complexity, space complexity, unnecessary re-renders, N+1 queries, blocking operations, memory leaks.

Respond in EXACT JSON:
{
  "summary": "Performance assessment",
  "score": <0-100>,
  "issues": [{ "severity": "critical|high|medium|low", "line": <number|null>, "title": "...", "description": "...", "suggestion": "..." }]
}`,

  style: `You are a code quality reviewer. Only report style and maintainability issues: naming conventions, code duplication, missing documentation, function length, complexity.

Respond in EXACT JSON:
{
  "summary": "Code quality assessment",
  "score": <0-100>,
  "issues": [{ "severity": "critical|high|medium|low", "line": <number|null>, "title": "...", "description": "...", "suggestion": "..." }]
}`,
};

export async function streamReview({ code, language, mode = "full", onChunk }) {
  const prompt = `Review this ${language} code:\n\`\`\`${language}\n${code}\n\`\`\``;

  const stream = await client.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: SYSTEM_PROMPTS[mode] || SYSTEM_PROMPTS.full },
      { role: "user", content: prompt },
    ],
    stream: true,
    max_tokens: 2048,
  });

  let fullText = "";

  for await (const chunk of stream) {
    const text = chunk.choices[0]?.delta?.content || "";
    if (text) {
      fullText += text;
      onChunk(text);
    }
  }

  return fullText;
}

export function parseReviewJSON(raw) {
  try {
    const cleaned = raw.replace(/```json|```/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return {
      summary: "Review completed. See raw output below.",
      score: null,
      issues: [],
    };
  }
}
