import mongoose from "mongoose";

const problemSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      unique: true,
    },
    slug: {
      type: String,
      unique: true,
      sparse: true,
    },
    description: {
      type: String,
      required: true,
    },
    difficulty: {
      type: String,
      enum: ["Easy", "Medium", "Hard"],
      required: true,
    },
    category: {
      type: String,
      default: "Algorithms",
    },
    constraints: [
      {
        type: String,
      },
    ],
    examples: [
      {
        input: String,
        output: String,
        explanation: String,
      },
    ],
    // Test cases for code evaluation
    testCases: [
      {
        input: {
          type: String,
          required: true,
        },
        expectedOutput: {
          type: String,
          required: true,
        },
        isHidden: {
          type: Boolean,
          default: false, // Hidden test cases won't be shown to users
        },
      },
    ],
    // Starter code templates for different languages
    starterCode: {
      javascript: {
        type: String,
        default: "",
      },
      python: {
        type: String,
        default: "",
      },
      java: {
        type: String,
        default: "",
      },
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Statistics
    totalSubmissions: {
      type: Number,
      default: 0,
    },
    acceptedSubmissions: {
      type: Number,
      default: 0,
    },
    // Soft delete - keep submissions even when problem is archived
    isActive: {
      type: Boolean,
      default: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

const Problem = mongoose.model("Problem", problemSchema);

export default Problem;
