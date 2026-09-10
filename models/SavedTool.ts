// models/SavedTool.ts
import { Schema, models, model } from "mongoose";
const s = new Schema({ userId: { type: String, required: true, index: true }, repoFullName: { type: String, required: true }, createdAt: { type: Date, default: Date.now } });
s.index({ userId: 1, repoFullName: 1 }, { unique: true });
export const SavedTool = models.SavedTool ?? model("SavedTool", s);
