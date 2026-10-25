// @vitest-environment node
import { DatabaseSync } from "node:sqlite";
import type { DurableObjectStorage } from "@cloudflare/workers-types";
import { describe, expect, it } from "vitest";
import { sqliteDatabase } from "../../workers/resume/sqlite";

describe("Durable Object SQL adapter", () => {
  it("binds values safely and rolls back a failed batch", async () => {
    const sqlite = new DatabaseSync(":memory:");
    sqlite.exec("CREATE TABLE records (id TEXT PRIMARY KEY, value TEXT)");
    const storage = {
      sql: {
        exec: (query: string, ...values: (string | number | null)[]) => {
          const statement = sqlite.prepare(query);
          const results = statement.columns().length ? statement.all(...values) : [];
          const changes = statement.columns().length ? 0 : statement.run(...values).changes;
          return { toArray: () => results, rowsWritten: Number(changes) };
        },
      },
      transactionSync: <T>(callback: () => T): T => {
        sqlite.exec("BEGIN");
        try {
          const result = callback();
          sqlite.exec("COMMIT");
          return result;
        } catch (error) {
          sqlite.exec("ROLLBACK");
          throw error;
        }
      },
    } as unknown as DurableObjectStorage;
    const db = sqliteDatabase(storage);
    try {
      const value = "'); DROP TABLE records; --";
      await db.prepare("INSERT INTO records VALUES (?, ?)").bind("first", value).run();
      expect(
        await db.prepare("SELECT value FROM records WHERE id = ?").bind("first").first(),
      ).toEqual({ value });
      await expect(
        db.batch([
          db.prepare("INSERT INTO records VALUES (?, ?)").bind("second", "new"),
          db.prepare("INSERT INTO records VALUES (?, ?)").bind("first", "duplicate"),
        ]),
      ).rejects.toThrow();
      expect(await db.prepare("SELECT COUNT(*) AS count FROM records").first()).toEqual({
        count: 1,
      });
    } finally {
      sqlite.close();
    }
  });
});
