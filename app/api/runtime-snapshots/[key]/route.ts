import { NextRequest, NextResponse } from "next/server";
import {
  isRuntimeSnapshotKey,
  readRuntimeSnapshot,
  writeRuntimeSnapshot
} from "@/lib/server/runtime-snapshots";

export const dynamic = "force-dynamic";

function getDatabaseConfigured() {
  return Boolean(process.env.DATABASE_URL);
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ key: string }> }
) {
  const { key } = await context.params;

  if (!isRuntimeSnapshotKey(key)) {
    return NextResponse.json({ message: "Snapshot key is not supported." }, { status: 400 });
  }

  if (!getDatabaseConfigured()) {
    return NextResponse.json({ message: "Database is not configured." }, { status: 503 });
  }

  try {
    const payload = await readRuntimeSnapshot(key);

    if (!payload) {
      return NextResponse.json({ message: "Snapshot not found." }, { status: 404 });
    }

    return NextResponse.json({ payload });
  } catch {
    return NextResponse.json({ message: "Failed to read runtime snapshot." }, { status: 503 });
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ key: string }> }
) {
  const { key } = await context.params;

  if (!isRuntimeSnapshotKey(key)) {
    return NextResponse.json({ message: "Snapshot key is not supported." }, { status: 400 });
  }

  if (!getDatabaseConfigured()) {
    return NextResponse.json({ message: "Database is not configured." }, { status: 503 });
  }

  try {
    const body = (await request.json()) as { payload?: unknown };
    if (!("payload" in body)) {
      return NextResponse.json({ message: "Payload is required." }, { status: 400 });
    }

    await writeRuntimeSnapshot(key, body.payload);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ message: "Failed to write runtime snapshot." }, { status: 503 });
  }
}
