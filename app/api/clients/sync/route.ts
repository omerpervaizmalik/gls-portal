import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import path from "path";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const { clientId } = await req.json();

  if (!clientId) {
    return NextResponse.json({ error: "Missing client ID" }, { status: 400 });
  }

    try {
    const client = await prisma.client.findUnique({
      where: { id: clientId }
    });

    if (!client || !client.cnic) {
      return NextResponse.json({ error: "Client CNIC not set" }, { status: 400 });
    }

    const scriptPath = path.join(process.cwd(), "scripts", "iris_status_checker.py");
    const cmd = `python "${scriptPath}" "${client.cnic}" "${client.cfNo}"`;

    return new Promise<NextResponse>((resolve) => {
      exec(cmd, (error, stdout, stderr) => {
        if (error) {
          console.error(`Exec error: ${error}`);
          resolve(NextResponse.json({ error: "Sync failed", details: stderr }, { status: 500 }));
          return;
        }
        console.log(`Stdout: ${stdout}`);
        resolve(NextResponse.json({ message: "Sync completed", output: stdout }));
      });
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
