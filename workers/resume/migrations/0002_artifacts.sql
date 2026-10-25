CREATE TABLE resume_artifacts (
  resume_variant_id TEXT PRIMARY KEY REFERENCES resume_variants(id),
  object_key TEXT NOT NULL UNIQUE,
  sha256 TEXT NOT NULL CHECK (length(sha256) = 64),
  byte_length INTEGER NOT NULL CHECK (byte_length > 0),
  page_count INTEGER NOT NULL CHECK (page_count > 0),
  created_at TEXT NOT NULL
);
CREATE TRIGGER immutable_artifacts_update BEFORE UPDATE ON resume_artifacts BEGIN
  SELECT RAISE(ABORT, 'Create a new resume version');
END;
CREATE TRIGGER immutable_artifacts_delete BEFORE DELETE ON resume_artifacts BEGIN
  SELECT RAISE(ABORT, 'Resume artifacts cannot be deleted');
END;
