import { z } from "zod";

const text = z.string().trim().max(500);
const id = z.string().regex(/^[a-zA-Z0-9_-]{1,100}$/);
const ids = z
  .array(id)
  .max(100)
  .refine((v) => new Set(v).size === v.length, "Duplicate IDs");
const url = z.union([
  z.literal(""),
  z
    .url()
    .max(2000)
    .refine((v) => /^https?:\/\//.test(v)),
]);
const commit = z
  .string()
  .regex(/^[a-f0-9]{40,64}$/)
  .nullable()
  .default(null);
const unique = <T extends { id: string }>(rows: T[]) =>
  new Set(rows.map((v) => v.id)).size === rows.length;
export const careerSchema = z
  .object({
    source_commit: commit,
    profile: z
      .object({
        name: text.min(1),
        email: z.email().max(254),
        phone: text.default(""),
        location: text.default(""),
        website: url.default(""),
        linkedin: url.default(""),
      })
      .strict(),
    experience: z
      .array(
        z
          .object({
            id,
            company: text,
            role: text.min(1),
            location: text,
            start_date: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
            end_date: z
              .string()
              .regex(/^\d{4}-(0[1-9]|1[0-2])$/)
              .nullable()
              .default(null),
            hours_per_week: z.number().positive().max(168).nullable().default(null),
            bullets: z
              .array(z.object({ id, text: z.string().trim().min(1).max(3000) }).strict())
              .max(100)
              .refine(unique, "Duplicate bullet IDs"),
          })
          .strict(),
      )
      .min(1)
      .max(50)
      .refine(unique, "Duplicate experience IDs"),
    skills: z
      .array(z.object({ id, name: text.min(1) }).strict())
      .max(100)
      .refine(unique, "Duplicate skill IDs"),
    education: z
      .array(z.object({ id, name: text.min(1) }).strict())
      .max(30)
      .refine(unique, "Duplicate education IDs"),
  })
  .strict();
export const selectionSchema = z.object({ experienceId: id, bulletIds: ids }).strict();
export const resumeSchema = z
  .object({
    revision_id: id,
    slug: text.default(""),
    title: text.min(1),
    summary: z.string().trim().max(6000).default(""),
    template: z.enum(["standard", "federal"]).default("standard"),
    template_version: z.enum(["1", "2"]).default("1"),
    company: text.min(1),
    role: text.min(1),
    job_url: url.default(""),
    source_commit: commit,
    experience: z
      .array(selectionSchema)
      .min(1)
      .max(50)
      .refine(
        (v) => new Set(v.map((x) => x.experienceId)).size === v.length,
        "Duplicate experience IDs",
      ),
    skill_ids: ids.default([]),
    education_ids: ids.default([]),
  })
  .strict();
export const applicationSchema = z
  .object({
    resume_uuid: z.uuid(),
    company: text.min(1),
    role: text.min(1),
    job_url: url.default(""),
    recruiter_name: text.default(""),
    recruiter_email: z.union([z.literal(""), z.email().max(254)]).default(""),
    status: z
      .enum(["draft", "applied", "interview", "offer", "rejected", "withdrawn"])
      .default("draft"),
    applied_at: z.iso.datetime().nullable().default(null),
    notes: z.string().max(20000).default(""),
  })
  .strict();
export const shareSchema = z
  .object({
    label: text.default(""),
    expires: z
      .string()
      .regex(/^[1-9]\d{0,3}d$/)
      .optional(),
    max_views: z.number().int().positive().max(1000000).nullable().default(null),
  })
  .strict();
export type Career = z.infer<typeof careerSchema>;
export type ResumeInput = z.infer<typeof resumeSchema>;
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
