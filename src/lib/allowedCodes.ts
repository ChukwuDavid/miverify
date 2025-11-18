// src/app/api/verify/route.ts
import { NextResponse } from "next/server";

const VALID_CODES = new Map([
  ["XTBBN325L", "Single Guest"],
  ["987654321", "Family of Four"],
  ["ABC111222", "Plus One Guest"],
  ["XYZ999888", "VIP Guest"],
  ["LMN555666", "Bride's Family"],
  ["QRS333444", "Groom's Family"],
  ["TUV777888", "Bride's Friends"],
  ["DEF444555", "Groom's Friends"],
]);

export async function POST(request: Request) {
  try {
    const { code } = await request.json();

    if (!code) {
      return NextResponse.json(
        { success: false, message: "No code provided." },
        { status: 400 }
      );
    }

    const guestName = VALID_CODES.get(code);

    if (guestName) {
      return NextResponse.json({ success: true, guestName }, { status: 200 });
    }

    return NextResponse.json(
      { success: false, message: "Access Denied: Invalid Code" },
      { status: 404 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
