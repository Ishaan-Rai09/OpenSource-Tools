// models/SearchHistory.ts
import { Schema, models, model } from "mongoose";
const s = new Schema({ userId: { type: String, index: true }, query: { type: String, required: true, maxlength: 120 }, createdAt: { type: Date, default: Date.now, expires: 90 * 24 * 3600 } });
export const SearchHistory = models.SearchHistory ?? model("SearchHistory", s);
