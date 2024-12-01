import mongoose from "mongoose";

// Define the DailyActivitySchema
const DailyActivitySchema = new mongoose.Schema({
  linesCreated: { type: Number, default: 0 },
  linesDeleted: { type: Number, default: 0 },
  totalLinesChanged: { type: Number, default: 0 },
  filesCreated: { type: Number, default: 0 },
  filesDeleted: { type: Number, default: 0 },
});

// Define the ActivitySchema
const ActivitySchema = new mongoose.Schema({
  userId: { type: String, required: true },
  email: {
    type: String,
    unique: [true, "Email already exists"],
    required: [true, "Email is required"],
  },
  name: {
    type: String,
    required: [true, "Name is required"],
  },
  image: {
    type: String,
  },
  track: {
    type: Map,
    of: DailyActivitySchema, // Map each date to a DailyActivitySchema object
    default: {},
  },
});

// Export the model
export default mongoose.models.Activity || mongoose.model("Activity", ActivitySchema);
