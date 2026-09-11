import { z } from "zod";
export const SearchRequest = z.object({ query: z.string().trim().min(2).max(120) });
export const RepoSchema = z.object({ id: z.number(), full_name: z.string(), description: z.string().nullable(), stargazers_count: z.number(), language: z.string().nullable(), pushed_at: z.string(), html_url: z.string().url(), fork: z.boolean().optional(), archived: z.boolean().optional() });
export const ComparisonSchema = z.object({ features: z.array(z.string()).max(5), selfHost: z.enum(["Easy", "Medium", "Hard", "Unknown"]), docker: z.boolean(), replaces: z.string(), pros: z.string(), cons: z.string(), ai: z.boolean() });
