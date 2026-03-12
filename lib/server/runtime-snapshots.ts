import { getPrismaClient } from "@/lib/server/prisma";

const ALLOWED_SNAPSHOT_KEYS = [
  "app-state",
  "flow-v3-state",
  "flow-v4-state",
  "flow-v5-state",
  "flow-v6-state",
  "flow-v7-state"
] as const;

export type RuntimeSnapshotKey = (typeof ALLOWED_SNAPSHOT_KEYS)[number];

export function isRuntimeSnapshotKey(value: string): value is RuntimeSnapshotKey {
  return ALLOWED_SNAPSHOT_KEYS.includes(value as RuntimeSnapshotKey);
}

async function ensureRuntimeSnapshotTable() {
  const prisma = getPrismaClient();
  if (!prisma) {
    throw new Error("Database is not configured.");
  }

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS runtime_snapshots (
      key TEXT PRIMARY KEY,
      payload JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

export async function readRuntimeSnapshot(key: RuntimeSnapshotKey) {
  const prisma = getPrismaClient();
  if (!prisma) {
    throw new Error("Database is not configured.");
  }

  await ensureRuntimeSnapshotTable();

  const rows = (await prisma.$queryRawUnsafe(
    `SELECT payload FROM runtime_snapshots WHERE key = $1 LIMIT 1`,
    key
  )) as Array<{ payload: unknown }>;

  return rows[0]?.payload ?? null;
}

export async function writeRuntimeSnapshot(
  key: RuntimeSnapshotKey,
  payload: unknown
) {
  const prisma = getPrismaClient();
  if (!prisma) {
    throw new Error("Database is not configured.");
  }

  await ensureRuntimeSnapshotTable();

  await prisma.$executeRawUnsafe(
    `
      INSERT INTO runtime_snapshots (key, payload, updated_at)
      VALUES ($1, $2::jsonb, NOW())
      ON CONFLICT (key)
      DO UPDATE SET payload = EXCLUDED.payload, updated_at = NOW()
    `,
    key,
    JSON.stringify(payload)
  );
}
