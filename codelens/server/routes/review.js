import express from "express";
import { authMiddleware } from "../middleware/auth.js";
import { reviewLimiter } from "../middleware/rateLimiter.js";
import { streamReview, parseReviewJSON } from "../services/claudeService.js";
import Review from "../models/Review.js";
import User from "../models/User.js";

const router = express.Router();

const SUPPORTED_LANGUAGES = [
  "javascript", "typescript", "python", "java", "c", "cpp",
  "go", "rust", "ruby", "php", "swift", "kotlin", "sql",
  "html", "css", "shell", "json",
];

router.post("/", authMiddleware, reviewLimiter, async (req, res) => {
  const { code, language, mode = "full" } = req.body;

  if (!code?.trim()) return res.status(400).json({ error: "Code is required" });
  if (code.length > 10000)
    return res.status(400).json({ error: "Code exceeds 10,000 character limit" });
  if (!SUPPORTED_LANGUAGES.includes(language))
    return res.status(400).json({ error: "Unsupported language" });

  // SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  const send = (event, data) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  const startTime = Date.now();

  try {
    send("status", { message: "Analyzing your code..." });

    let rawReview = "";

    await streamReview({
      code,
      language,
      mode,
      onChunk: (chunk) => {
        rawReview += chunk;
        send("chunk", { text: chunk });
      },
    });

    send("status", { message: "Parsing results..." });

    const parsed = parseReviewJSON(rawReview);
    const durationMs = Date.now() - startTime;

    // Save to DB
    const review = await Review.create({
      userId: req.user._id,
      code,
      language,
      mode,
      summary: parsed.summary,
      score: parsed.score,
      issues: parsed.issues || [],
      rawReview,
      durationMs,
    });

    await User.findByIdAndUpdate(req.user._id, { $inc: { reviewCount: 1 } });

    send("done", { reviewId: review._id, parsed, durationMs });
    res.write("event: close\ndata: {}\n\n");
    res.end();
  } catch (err) {
    console.error("Review error:", err);
    send("error", { message: "Review failed. Please try again." });
    res.end();
  }
});

export default router;
