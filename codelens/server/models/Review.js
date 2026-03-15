import mongoose from "mongoose";

const issueSchema = new mongoose.Schema({
  severity: {
    type: String,
    enum: ["critical", "high", "medium", "low"],
    required: true,
  },
  line: Number,
  title: String,
  description: String,
  suggestion: String,
});

const reviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    code: { type: String, required: true },
    language: { type: String, required: true },
    mode: {
      type: String,
      enum: ["full", "security", "performance", "style"],
      default: "full",
    },
    summary: String,
    score: { type: Number, min: 0, max: 100 },
    issues: [issueSchema],
    rawReview: String,
    durationMs: Number,
  },
  { timestamps: true }
);

reviewSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model("Review", reviewSchema);
