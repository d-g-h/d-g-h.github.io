import type { D1Database, D1PreparedStatement } from "@cloudflare/workers-types";
import { sha256 } from "./security";
import { HttpError, type Career, type ResumeInput } from "./validation";

export type Variant = Omit<ResumeInput, "experience" | "skill_ids" | "education_ids"> & {
  id: string;
  uuid: string;
  resume_id: string;
  version: number;
  parent_version: string | null;
  template_version: string;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
};
export type ResumeRecord = Variant &
  Pick<ResumeInput, "experience" | "skill_ids" | "education_ids">;
export type ResumeModel = {
  resume: ResumeRecord;
  profile: Career["profile"];
  experience: Career["experience"];
  skills: Career["skills"];
  education: Career["education"];
};
export const stmt = (db: D1Database, sql: string, ...args: (string | number | null)[]) =>
  db.prepare(sql).bind(...args);
export async function getVariant(db: D1Database, uuid: string): Promise<Variant> {
  const row = await stmt(db, "SELECT * FROM resume_variants WHERE uuid = ?", uuid).first<Variant>();
  if (!row) throw new HttpError(404, "Resume not found");
  return row;
}
export async function getResume(db: D1Database, uuid: string): Promise<ResumeRecord> {
  const row = await getVariant(db, uuid);
  const [experiences, bullets, skills, education] = await Promise.all([
    stmt(
      db,
      "SELECT experience_id FROM resume_variant_experience WHERE resume_variant_id = ? ORDER BY position",
      row.id,
    ).all<{ experience_id: string }>(),
    stmt(
      db,
      "SELECT experience_id, bullet_id FROM resume_variant_bullets WHERE resume_variant_id = ? ORDER BY position",
      row.id,
    ).all<{ experience_id: string; bullet_id: string }>(),
    stmt(
      db,
      "SELECT skill_id FROM resume_variant_skills WHERE resume_variant_id = ? ORDER BY position",
      row.id,
    ).all<{ skill_id: string }>(),
    stmt(
      db,
      "SELECT education_id FROM resume_variant_education WHERE resume_variant_id = ? ORDER BY position",
      row.id,
    ).all<{ education_id: string }>(),
  ]);
  return {
    ...row,
    experience: experiences.results.map((e) => ({
      experienceId: e.experience_id,
      bulletIds: bullets.results
        .filter((b) => b.experience_id === e.experience_id)
        .map((b) => b.bullet_id),
    })),
    skill_ids: skills.results.map((s) => s.skill_id),
    education_ids: education.results.map((e) => e.education_id),
  };
}
export async function getCareer(db: D1Database, revision: string): Promise<Career> {
  const profile = await stmt(
    db,
    "SELECT name, email, phone, location, website, linkedin FROM profile WHERE revision_id = ?",
    revision,
  ).first<Career["profile"]>();
  if (!profile) throw new HttpError(404, "Career revision not found");
  const [experiences, bullets, skills, education, source] = await Promise.all([
    stmt(
      db,
      "SELECT id, company, role, location, start_date, end_date, hours_per_week FROM experience WHERE revision_id = ? ORDER BY rowid",
      revision,
    ).all<Omit<Career["experience"][number], "bullets">>(),
    stmt(
      db,
      "SELECT experience_id, id, text FROM experience_bullets WHERE revision_id = ? ORDER BY position",
      revision,
    ).all<{ experience_id: string; id: string; text: string }>(),
    stmt(db, "SELECT id, name FROM skills WHERE revision_id = ? ORDER BY position", revision).all<
      Career["skills"][number]
    >(),
    stmt(
      db,
      "SELECT id, name FROM education WHERE revision_id = ? ORDER BY position",
      revision,
    ).all<Career["education"][number]>(),
    stmt(db, "SELECT source_commit FROM career_revisions WHERE id = ?", revision).first<{
      source_commit: string | null;
    }>(),
  ]);
  return {
    profile,
    source_commit: source?.source_commit ?? null,
    experience: experiences.results.map((e) => ({
      ...e,
      bullets: bullets.results
        .filter((b) => b.experience_id === e.id)
        .map(({ id, text }) => ({ id, text })),
    })),
    skills: skills.results,
    education: education.results,
  };
}
export async function importCareer(db: D1Database, data: Career) {
  const hash = await sha256(JSON.stringify(data));
  const existing = await stmt(
    db,
    "SELECT id FROM career_revisions WHERE content_hash = ?",
    hash,
  ).first<{ id: string }>();
  if (existing) return existing;
  const id = crypto.randomUUID();
  const statements = [
    stmt(
      db,
      "INSERT INTO career_revisions (id, created_at, source_commit, content_hash) VALUES (?, ?, ?, ?)",
      id,
      new Date().toISOString(),
      data.source_commit,
      hash,
    ),
    stmt(
      db,
      "INSERT INTO profile (revision_id, name, email, phone, location, website, linkedin) VALUES (?, ?, ?, ?, ?, ?, ?)",
      id,
      data.profile.name,
      data.profile.email,
      data.profile.phone,
      data.profile.location,
      data.profile.website,
      data.profile.linkedin,
    ),
  ];
  for (const e of data.experience) {
    statements.push(
      stmt(
        db,
        "INSERT INTO experience (revision_id, id, company, role, location, start_date, end_date, hours_per_week) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        id,
        e.id,
        e.company,
        e.role,
        e.location,
        e.start_date,
        e.end_date,
        e.hours_per_week,
      ),
    );
    e.bullets.forEach((b, i) =>
      statements.push(
        stmt(
          db,
          "INSERT INTO experience_bullets (revision_id, experience_id, id, text, position) VALUES (?, ?, ?, ?, ?)",
          id,
          e.id,
          b.id,
          b.text,
          i,
        ),
      ),
    );
  }
  data.skills.forEach((s, i) =>
    statements.push(
      stmt(
        db,
        "INSERT INTO skills (revision_id, id, name, position) VALUES (?, ?, ?, ?)",
        id,
        s.id,
        s.name,
        i,
      ),
    ),
  );
  data.education.forEach((e, i) =>
    statements.push(
      stmt(
        db,
        "INSERT INTO education (revision_id, id, name, position) VALUES (?, ?, ?, ?)",
        id,
        e.id,
        e.name,
        i,
      ),
    ),
  );
  await db.batch(statements);
  return { id };
}
export function compose(resume: ResumeRecord, career: Career): ResumeModel {
  const experience = resume.experience.map((selection) => {
    const e = career.experience.find((item) => item.id === selection.experienceId);
    if (!e) throw new HttpError(422, "Unknown experience ID");
    return {
      ...e,
      bullets: selection.bulletIds.map((id) => {
        const b = e.bullets.find((item) => item.id === id);
        if (!b) throw new HttpError(422, "Bullet does not belong to selected experience");
        return b;
      }),
    };
  });
  const select = <T extends { id: string }>(ids: string[], rows: T[]) =>
    ids.map((id) => {
      const value = rows.find((r) => r.id === id);
      if (!value) throw new HttpError(422, "Unknown canonical ID");
      return value;
    });
  if (resume.template === "federal" && experience.some((e) => e.hours_per_week === null))
    throw new HttpError(422, "Federal resumes require hours_per_week for each selected experience");
  return {
    resume,
    profile: career.profile,
    experience,
    skills: select(resume.skill_ids, career.skills),
    education: select(resume.education_ids, career.education),
  };
}
export async function composeResume(db: D1Database, uuid: string) {
  const resume = await getResume(db, uuid);
  return compose(resume, await getCareer(db, resume.revision_id));
}
export async function createResume(db: D1Database, input: ResumeInput, parent?: Variant) {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const last = parent
    ? await stmt(
        db,
        "SELECT MAX(version) AS version FROM resume_variants WHERE resume_id = ?",
        parent.resume_id,
      ).first<{ version: number }>()
    : null;
  const record: ResumeRecord = {
    ...input,
    id,
    uuid: id,
    resume_id: parent?.resume_id ?? id,
    version: (last?.version ?? 0) + 1,
    parent_version: parent?.id ?? null,
    created_at: now,
    updated_at: now,
    archived_at: null,
    template_version: input.template_version,
  };
  compose(record, await getCareer(db, input.revision_id));
  const statements: D1PreparedStatement[] = [
    stmt(
      db,
      "INSERT INTO resume_variants (id, uuid, resume_id, version, parent_version, revision_id, slug, title, summary, template, template_version, company, role, job_url, created_at, updated_at, source_commit) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      id,
      id,
      record.resume_id,
      record.version,
      record.parent_version,
      input.revision_id,
      input.slug,
      input.title,
      input.summary,
      input.template,
      input.template_version,
      input.company,
      input.role,
      input.job_url,
      now,
      now,
      input.source_commit,
    ),
  ];
  input.experience.forEach((e, i) => {
    statements.push(
      stmt(
        db,
        "INSERT INTO resume_variant_experience (resume_variant_id, revision_id, experience_id, position) VALUES (?, ?, ?, ?)",
        id,
        input.revision_id,
        e.experienceId,
        i,
      ),
    );
    e.bulletIds.forEach((b, n) =>
      statements.push(
        stmt(
          db,
          "INSERT INTO resume_variant_bullets (resume_variant_id, revision_id, experience_id, bullet_id, position) VALUES (?, ?, ?, ?, ?)",
          id,
          input.revision_id,
          e.experienceId,
          b,
          n,
        ),
      ),
    );
  });
  input.skill_ids.forEach((s, i) =>
    statements.push(
      stmt(
        db,
        "INSERT INTO resume_variant_skills (resume_variant_id, revision_id, skill_id, position) VALUES (?, ?, ?, ?)",
        id,
        input.revision_id,
        s,
        i,
      ),
    ),
  );
  input.education_ids.forEach((e, i) =>
    statements.push(
      stmt(
        db,
        "INSERT INTO resume_variant_education (resume_variant_id, revision_id, education_id, position) VALUES (?, ?, ?, ?)",
        id,
        input.revision_id,
        e,
        i,
      ),
    ),
  );
  statements.push(stmt(db, "INSERT INTO resume_seals (resume_variant_id) VALUES (?)", id));
  try {
    await db.batch(statements);
  } catch (error) {
    if (String(error).includes("UNIQUE constraint"))
      throw new HttpError(409, "Concurrent version creation; retry the request");
    throw error;
  }
  return record;
}
