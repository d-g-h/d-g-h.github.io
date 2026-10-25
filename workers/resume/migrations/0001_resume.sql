PRAGMA foreign_keys = ON;

-- Canonical revisions are append-only. Existing resumes keep their original revision.
CREATE TABLE career_revisions (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  source_commit TEXT,
  content_hash TEXT NOT NULL UNIQUE
);
CREATE TABLE profile (
  revision_id TEXT PRIMARY KEY REFERENCES career_revisions(id),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  location TEXT NOT NULL DEFAULT '',
  website TEXT NOT NULL DEFAULT '',
  linkedin TEXT NOT NULL DEFAULT ''
);
CREATE TABLE experience (
  revision_id TEXT NOT NULL REFERENCES career_revisions(id),
  id TEXT NOT NULL,
  company TEXT NOT NULL,
  role TEXT NOT NULL,
  location TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT,
  hours_per_week REAL,
  PRIMARY KEY (revision_id, id)
);
CREATE TABLE experience_bullets (
  revision_id TEXT NOT NULL,
  experience_id TEXT NOT NULL,
  id TEXT NOT NULL,
  text TEXT NOT NULL,
  position INTEGER NOT NULL,
  PRIMARY KEY (revision_id, experience_id, id),
  FOREIGN KEY (revision_id, experience_id) REFERENCES experience(revision_id, id)
);
CREATE TABLE skills (
  revision_id TEXT NOT NULL REFERENCES career_revisions(id),
  id TEXT NOT NULL,
  name TEXT NOT NULL,
  position INTEGER NOT NULL,
  PRIMARY KEY (revision_id, id)
);
CREATE TABLE education (
  revision_id TEXT NOT NULL REFERENCES career_revisions(id),
  id TEXT NOT NULL,
  name TEXT NOT NULL,
  position INTEGER NOT NULL,
  PRIMARY KEY (revision_id, id)
);
CREATE TABLE resume_variants (
  id TEXT PRIMARY KEY,
  uuid TEXT NOT NULL UNIQUE,
  resume_id TEXT NOT NULL,
  version INTEGER NOT NULL CHECK (version > 0),
  parent_version TEXT REFERENCES resume_variants(id),
  revision_id TEXT NOT NULL REFERENCES career_revisions(id),
  slug TEXT NOT NULL DEFAULT '',
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  template TEXT NOT NULL CHECK (template IN ('standard', 'federal')),
  template_version TEXT NOT NULL DEFAULT '1',
  company TEXT NOT NULL,
  role TEXT NOT NULL,
  job_url TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  source_commit TEXT,
  archived_at TEXT,
  UNIQUE (resume_id, version),
  UNIQUE (id, revision_id)
);
CREATE TABLE resume_variant_experience (
  resume_variant_id TEXT NOT NULL,
  revision_id TEXT NOT NULL,
  experience_id TEXT NOT NULL,
  position INTEGER NOT NULL,
  PRIMARY KEY (resume_variant_id, experience_id),
  UNIQUE (resume_variant_id, revision_id, experience_id),
  FOREIGN KEY (resume_variant_id, revision_id) REFERENCES resume_variants(id, revision_id),
  FOREIGN KEY (revision_id, experience_id) REFERENCES experience(revision_id, id)
);
CREATE TABLE resume_variant_bullets (
  resume_variant_id TEXT NOT NULL,
  revision_id TEXT NOT NULL,
  experience_id TEXT NOT NULL,
  bullet_id TEXT NOT NULL,
  position INTEGER NOT NULL,
  PRIMARY KEY (resume_variant_id, experience_id, bullet_id),
  FOREIGN KEY (resume_variant_id, revision_id, experience_id)
    REFERENCES resume_variant_experience(resume_variant_id, revision_id, experience_id),
  FOREIGN KEY (revision_id, experience_id, bullet_id)
    REFERENCES experience_bullets(revision_id, experience_id, id)
);
CREATE TABLE resume_variant_skills (
  resume_variant_id TEXT NOT NULL,
  revision_id TEXT NOT NULL,
  skill_id TEXT NOT NULL,
  position INTEGER NOT NULL,
  PRIMARY KEY (resume_variant_id, skill_id),
  FOREIGN KEY (resume_variant_id, revision_id) REFERENCES resume_variants(id, revision_id),
  FOREIGN KEY (revision_id, skill_id) REFERENCES skills(revision_id, id)
);
CREATE TABLE resume_variant_education (
  resume_variant_id TEXT NOT NULL,
  revision_id TEXT NOT NULL,
  education_id TEXT NOT NULL,
  position INTEGER NOT NULL,
  PRIMARY KEY (resume_variant_id, education_id),
  FOREIGN KEY (resume_variant_id, revision_id) REFERENCES resume_variants(id, revision_id),
  FOREIGN KEY (revision_id, education_id) REFERENCES education(revision_id, id)
);
CREATE TABLE applications (
  id TEXT PRIMARY KEY,
  uuid TEXT NOT NULL UNIQUE,
  resume_variant_id TEXT NOT NULL REFERENCES resume_variants(id),
  company TEXT NOT NULL,
  role TEXT NOT NULL,
  job_url TEXT NOT NULL DEFAULT '',
  recruiter_name TEXT NOT NULL DEFAULT '',
  recruiter_email TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL,
  applied_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  notes TEXT NOT NULL DEFAULT ''
);
CREATE TABLE share_links (
  id TEXT PRIMARY KEY,
  resume_variant_id TEXT NOT NULL REFERENCES resume_variants(id),
  token_hash TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  expires_at TEXT,
  revoked_at TEXT,
  view_count INTEGER NOT NULL DEFAULT 0 CHECK (view_count >= 0),
  max_views INTEGER CHECK (max_views > 0)
);
CREATE INDEX applications_resume ON applications(resume_variant_id);
CREATE INDEX shares_resume ON share_links(resume_variant_id);
CREATE INDEX variants_created ON resume_variants(created_at);

-- Version preservation is enforced in storage as well as in the API.
CREATE TRIGGER immutable_resume_update BEFORE UPDATE ON resume_variants BEGIN
  SELECT RAISE(ABORT, 'Create a new resume version');
END;
CREATE TRIGGER immutable_resume_delete BEFORE DELETE ON resume_variants BEGIN
  SELECT RAISE(ABORT, 'Resume versions cannot be deleted');
END;
CREATE TRIGGER application_resume_locked BEFORE UPDATE OF resume_variant_id ON applications BEGIN
  SELECT RAISE(ABORT, 'Application resume version is immutable');
END;

CREATE TABLE resume_seals (
  resume_variant_id TEXT PRIMARY KEY REFERENCES resume_variants(id)
);
CREATE TRIGGER immutable_career_revisions_update BEFORE UPDATE ON career_revisions BEGIN SELECT RAISE(ABORT, 'Immutable metadata'); END;
CREATE TRIGGER immutable_career_revisions_delete BEFORE DELETE ON career_revisions BEGIN SELECT RAISE(ABORT, 'Immutable metadata'); END;
CREATE TRIGGER immutable_profile_update BEFORE UPDATE ON profile BEGIN SELECT RAISE(ABORT, 'Immutable metadata'); END;
CREATE TRIGGER immutable_profile_delete BEFORE DELETE ON profile BEGIN SELECT RAISE(ABORT, 'Immutable metadata'); END;
CREATE TRIGGER immutable_experience_update BEFORE UPDATE ON experience BEGIN SELECT RAISE(ABORT, 'Immutable metadata'); END;
CREATE TRIGGER immutable_experience_delete BEFORE DELETE ON experience BEGIN SELECT RAISE(ABORT, 'Immutable metadata'); END;
CREATE TRIGGER immutable_experience_bullets_update BEFORE UPDATE ON experience_bullets BEGIN SELECT RAISE(ABORT, 'Immutable metadata'); END;
CREATE TRIGGER immutable_experience_bullets_delete BEFORE DELETE ON experience_bullets BEGIN SELECT RAISE(ABORT, 'Immutable metadata'); END;
CREATE TRIGGER immutable_skills_update BEFORE UPDATE ON skills BEGIN SELECT RAISE(ABORT, 'Immutable metadata'); END;
CREATE TRIGGER immutable_skills_delete BEFORE DELETE ON skills BEGIN SELECT RAISE(ABORT, 'Immutable metadata'); END;
CREATE TRIGGER immutable_education_update BEFORE UPDATE ON education BEGIN SELECT RAISE(ABORT, 'Immutable metadata'); END;
CREATE TRIGGER immutable_education_delete BEFORE DELETE ON education BEGIN SELECT RAISE(ABORT, 'Immutable metadata'); END;
CREATE TRIGGER immutable_resume_seals_update BEFORE UPDATE ON resume_seals BEGIN SELECT RAISE(ABORT, 'Immutable metadata'); END;
CREATE TRIGGER immutable_resume_seals_delete BEFORE DELETE ON resume_seals BEGIN SELECT RAISE(ABORT, 'Immutable metadata'); END;
CREATE TRIGGER sealed_resume_variant_experience_insert BEFORE INSERT ON resume_variant_experience WHEN EXISTS (SELECT 1 FROM resume_seals WHERE resume_variant_id = NEW.resume_variant_id) BEGIN SELECT RAISE(ABORT, 'Resume version is sealed'); END;
CREATE TRIGGER sealed_resume_variant_experience_update BEFORE UPDATE ON resume_variant_experience WHEN EXISTS (SELECT 1 FROM resume_seals WHERE resume_variant_id = OLD.resume_variant_id) BEGIN SELECT RAISE(ABORT, 'Resume version is sealed'); END;
CREATE TRIGGER sealed_resume_variant_experience_delete BEFORE DELETE ON resume_variant_experience WHEN EXISTS (SELECT 1 FROM resume_seals WHERE resume_variant_id = OLD.resume_variant_id) BEGIN SELECT RAISE(ABORT, 'Resume version is sealed'); END;
CREATE TRIGGER sealed_resume_variant_bullets_insert BEFORE INSERT ON resume_variant_bullets WHEN EXISTS (SELECT 1 FROM resume_seals WHERE resume_variant_id = NEW.resume_variant_id) BEGIN SELECT RAISE(ABORT, 'Resume version is sealed'); END;
CREATE TRIGGER sealed_resume_variant_bullets_update BEFORE UPDATE ON resume_variant_bullets WHEN EXISTS (SELECT 1 FROM resume_seals WHERE resume_variant_id = OLD.resume_variant_id) BEGIN SELECT RAISE(ABORT, 'Resume version is sealed'); END;
CREATE TRIGGER sealed_resume_variant_bullets_delete BEFORE DELETE ON resume_variant_bullets WHEN EXISTS (SELECT 1 FROM resume_seals WHERE resume_variant_id = OLD.resume_variant_id) BEGIN SELECT RAISE(ABORT, 'Resume version is sealed'); END;
CREATE TRIGGER sealed_resume_variant_skills_insert BEFORE INSERT ON resume_variant_skills WHEN EXISTS (SELECT 1 FROM resume_seals WHERE resume_variant_id = NEW.resume_variant_id) BEGIN SELECT RAISE(ABORT, 'Resume version is sealed'); END;
CREATE TRIGGER sealed_resume_variant_skills_update BEFORE UPDATE ON resume_variant_skills WHEN EXISTS (SELECT 1 FROM resume_seals WHERE resume_variant_id = OLD.resume_variant_id) BEGIN SELECT RAISE(ABORT, 'Resume version is sealed'); END;
CREATE TRIGGER sealed_resume_variant_skills_delete BEFORE DELETE ON resume_variant_skills WHEN EXISTS (SELECT 1 FROM resume_seals WHERE resume_variant_id = OLD.resume_variant_id) BEGIN SELECT RAISE(ABORT, 'Resume version is sealed'); END;
CREATE TRIGGER sealed_resume_variant_education_insert BEFORE INSERT ON resume_variant_education WHEN EXISTS (SELECT 1 FROM resume_seals WHERE resume_variant_id = NEW.resume_variant_id) BEGIN SELECT RAISE(ABORT, 'Resume version is sealed'); END;
CREATE TRIGGER sealed_resume_variant_education_update BEFORE UPDATE ON resume_variant_education WHEN EXISTS (SELECT 1 FROM resume_seals WHERE resume_variant_id = OLD.resume_variant_id) BEGIN SELECT RAISE(ABORT, 'Resume version is sealed'); END;
CREATE TRIGGER sealed_resume_variant_education_delete BEFORE DELETE ON resume_variant_education WHEN EXISTS (SELECT 1 FROM resume_seals WHERE resume_variant_id = OLD.resume_variant_id) BEGIN SELECT RAISE(ABORT, 'Resume version is sealed'); END;
