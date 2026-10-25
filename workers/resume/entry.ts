import type {
  DurableObjectNamespace,
  DurableObjectState,
  R2Bucket,
} from "@cloudflare/workers-types";
import worker, { type Env } from "./index";
import initialSchema from "./migrations/0001_resume.sql";
import artifactSchema from "./migrations/0002_artifacts.sql";
import shareUrlSchema from "./migrations/0003_share_urls.sql";
import { sqliteDatabase } from "./sqlite";

type Bindings = Omit<Env, "DB"> & {
  RESUME_DATABASE: DurableObjectNamespace;
  FILES: R2Bucket;
};

export class ResumeDatabase {
  private readonly database: Env["DB"];

  constructor(
    private readonly state: DurableObjectState,
    private readonly env: Bindings,
  ) {
    this.database = sqliteDatabase(state.storage);
    void state.blockConcurrencyWhile(async () => {
      state.storage.transactionSync(() => {
        const sql = state.storage.sql;
        sql.exec("CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY)");
        for (const [version, schema] of [
          [1, initialSchema],
          [2, artifactSchema],
          [3, shareUrlSchema],
        ] as const) {
          if (
            !sql.exec("SELECT version FROM schema_migrations WHERE version = ?", version).toArray()
              .length
          ) {
            sql.exec(schema.replace("PRAGMA foreign_keys = ON;", ""));
            sql.exec("INSERT INTO schema_migrations (version) VALUES (?)", version);
          }
        }
      });
    });
  }

  async fetch(request: Request): Promise<Response> {
    const run = () => worker.fetch(request, { ...this.env, DB: this.database });
    // Serialize mutations so concurrent updates cannot allocate the same version.
    const path = new URL(request.url).pathname;
    if (request.method !== "GET" && path.startsWith("/api/") && !path.includes("/render")) {
      return this.state.blockConcurrencyWhile(run);
    }
    return run();
  }
}

export default {
  fetch(request: Request, env: Bindings): Promise<Response> {
    const stub = env.RESUME_DATABASE.get(
      env.RESUME_DATABASE.idFromName("private-resume"),
    ) as unknown as {
      fetch(request: Request): Promise<Response>;
    };
    return stub.fetch(request);
  },
};
