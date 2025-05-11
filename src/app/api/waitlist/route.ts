import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const WAITLIST_PATH = path.join(process.cwd(), "public", "waitlist.json");

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email." }, { status: 400 });
    }
    let waitlist: string[] = [];
    try {
      const data = await fs.readFile(WAITLIST_PATH, "utf-8");
      waitlist = JSON.parse(data);
      if (!Array.isArray(waitlist)) waitlist = [];
    } catch {
      waitlist = [];
    }
    if (!waitlist.includes(email)) {
      waitlist.push(email);
      await fs.writeFile(WAITLIST_PATH, JSON.stringify(waitlist, null, 2));
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
} 