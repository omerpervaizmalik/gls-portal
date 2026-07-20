import { NextRequest, NextResponse } from "next/server";
import { storage } from "@/lib/storage";
import { prisma } from "@/lib/prisma";
import path from "path";

const TAX_RETURNS_ROOT = "Malik Law Associates/Corporate Work MLA/Income TAX/TAX RETURNS";
const CATEGORIES = [
  "Salaried Person",
  "Business Person",
  "AOP",
  "PVT LTD",
  "Pensioner Tax Filing",
  "New Return 2024",
  "New Return 2025",
  "NGO Trust Org",
  "MISC Fillers",
  "Forigeon Resident",
  "OUT OF CONTACT"
];

export async function GET(req: NextRequest) {
  const cfNo = req.nextUrl.searchParams.get("cfNo");

  if (!cfNo) {
    return NextResponse.json({ error: "Missing CF No" }, { status: 400 });
  }

  try {
    const cfNoStr = cfNo.toString();
    
    // Fetch client name for fallback
    const client = await prisma.client.findFirst({
        where: { cfNo: cfNoStr }
    });
    const clientName = client?.name?.toLowerCase();

    console.log(`Searching for folder for CF No: ${cfNoStr} (Name: ${clientName})`);

    // First Pass: Match by Number
    for (const category of CATEGORIES) {
      const categoryPath = path.join(TAX_RETURNS_ROOT, category).replace(/\\/g, '/');
      try {
        const folders = await storage.listFolder(categoryPath);
        const match = folders.find((f: any) => {
          if (!f.folder) return false;
          const name = f.name.trim();
          const regex = new RegExp(`^0*${cfNoStr}(?:[^0-9]|$)`);
          return regex.test(name);
        });
        
        if (match) {
          // Return human-readable path (categoryPath/folderName) instead of OneDrive item ID
          // so that permission checks on the files page work correctly for non-admin users
          const humanPath = `${categoryPath}/${match.name}`;
          return NextResponse.json({ path: humanPath });
        }
      } catch (e) {}
    }

    // Second Pass: Match by Name (Fallback)
    if (clientName) {
      for (const category of CATEGORIES) {
        const categoryPath = path.join(TAX_RETURNS_ROOT, category).replace(/\\/g, '/');
        try {
          const folders = await storage.listFolder(categoryPath);
          const match = folders.find((f: any) => f.folder && f.name.toLowerCase().includes(clientName));
          if (match) {
            const humanPath = `${categoryPath}/${match.name}`;
            return NextResponse.json({ path: humanPath });
          }
        } catch (e) {}
      }
    }

    return NextResponse.json({ error: "Folder not found" }, { status: 404 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
