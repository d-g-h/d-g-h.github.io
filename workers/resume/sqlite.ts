import type { D1Database, DurableObjectStorage } from "@cloudflare/workers-types";

type Value = string | number | null;

export function sqliteDatabase(storage: DurableObjectStorage): D1Database {
  const prepare = (query: string, values: Value[] = []) => {
    const execute = () => {
      const cursor = storage.sql.exec(query, ...values);
      const results = cursor.toArray();
      return { success: true, results, meta: { changes: cursor.rowsWritten } };
    };
    return {
      bind: (...bindings: Value[]) => prepare(query, bindings),
      first: async () => execute().results[0] ?? null,
      all: async () => execute(),
      run: async () => execute(),
      execute,
    };
  };
  return {
    prepare,
    batch: async (statements: ReturnType<typeof prepare>[]) =>
      storage.transactionSync(() => statements.map((statement) => statement.execute())),
  } as unknown as D1Database;
}
