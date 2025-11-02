import { NextRequest, NextResponse } from "next/server";
import sql from "@/app/lib/postgres_client";
import jwt from "jsonwebtoken";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value;
    if (!token)
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);

    const users = await sql`
      SELECT id, email, name, phone, lat, lng, created_at, updated_at
      FROM users
      WHERE id = ${decoded.userId}
      LIMIT 1
    `;

    if (users.length === 0)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    return NextResponse.json({ profile: users[0] }, { status: 200 });
  } catch (err: any) {
    console.error("❌ Profile fetch error:", err);
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 403 });
  }
}
