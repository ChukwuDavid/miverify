// src/app/api/verify/route.ts
import { NextResponse } from "next/server";

/* -------------------------------------------------------------------------- */
/* CONSTANTS                                                                  */
/* -------------------------------------------------------------------------- */

// This list replaces the file in src/lib/allowedCodes.ts
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

/* -------------------------------------------------------------------------- */
/* API ROUTE                                                                  */
/* -------------------------------------------------------------------------- */

export async function POST(request: Request) {
  try {
    const { code } = await request.json();

    if (!code) {
      return NextResponse.json(
        { success: false, message: "No code provided." },
        { status: 400 }
      );
    }

    // Normalize input (trim spaces)
    const cleanCode = code.trim();
    const guestName = VALID_CODES.get(cleanCode);

    if (guestName) {
      return NextResponse.json({ success: true, guestName }, { status: 200 });
    }

    return NextResponse.json(
      { success: false, message: "Access Denied: Invalid or Unknown Code" },
      { status: 404 }
    );
  } catch {
    return NextResponse.json(
      { success: false, message: "Server validation error" },
      { status: 500 }
    );
  }
}
