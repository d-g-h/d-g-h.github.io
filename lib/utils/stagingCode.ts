export type ParsedStagingCode = {
  lane: string;
  stage: number | null;
  normalized: string;
};

export function normalizeStagingCode(staging: string): string {
  return staging.replace(/[^A-Za-z0-9.]/g, "").toUpperCase();
}

export function parseStagingCode(staging: string): ParsedStagingCode {
  const normalized = normalizeStagingCode(staging).trim();
  if (!normalized) return { lane: "", stage: null, normalized: "" };

  const match = normalized.match(/^([A-Z]+)(?:\.?(\d+))?/);
  const lane = match?.[1] ?? "";
  const stageRaw = match?.[2] ?? "";
  const stageNum = stageRaw ? Number(stageRaw) : Number.NaN;
  const stage = Number.isFinite(stageNum) && stageNum >= 1 ? stageNum : null;
  return { lane, stage, normalized };
}

function laneRank(lane: string): number {
  if (lane === "F") return 0;
  if (lane === "I") return 2;
  return 1;
}

export function compareStagingCodes(aStaging: string, bStaging: string): number {
  const a = parseStagingCode(aStaging);
  const b = parseStagingCode(bStaging);

  const aRank = laneRank(a.lane);
  const bRank = laneRank(b.lane);
  if (aRank !== bRank) return aRank - bRank;

  const laneCmp = a.lane.localeCompare(b.lane);
  if (laneCmp !== 0) return laneCmp;

  if (a.stage !== null && b.stage !== null && a.stage !== b.stage) return a.stage - b.stage;
  if (a.stage !== null && b.stage === null) return -1;
  if (a.stage === null && b.stage !== null) return 1;

  const normalizedCmp = a.normalized.localeCompare(b.normalized);
  if (normalizedCmp !== 0) return normalizedCmp;

  return 0;
}
