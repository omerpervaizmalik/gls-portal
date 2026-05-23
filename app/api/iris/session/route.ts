import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import path from "path";
import fs from "fs";

export async function GET() {
  // Check if a session file exists
  const sessionPath = path.join(process.cwd(), "scripts", "iris_session.json");
  const exists = fs.existsSync(sessionPath);
  
  if (exists) {
    const stat = fs.statSync(sessionPath);
    const ageHours = (Date.now() - stat.mtimeMs) / (1000 * 60 * 60);
    return NextResponse.json({
      active: true,
      savedAt: stat.mtime,
      ageHours: ageHours.toFixed(1),
      expired: ageHours > 12
    });
  }
  
  return NextResponse.json({ active: false });
}

export async function DELETE() {
  // Clear the session file
  const sessionPath = path.join(process.cwd(), "scripts", "iris_session.json");
  if (fs.existsSync(sessionPath)) {
    fs.unlinkSync(sessionPath);
  }
  return NextResponse.json({ message: "Session cleared" });
}
