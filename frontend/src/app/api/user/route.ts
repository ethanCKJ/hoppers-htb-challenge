import { NextRequest, NextResponse } from "next/server";
import sql from "@/app/lib/postgres_client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { PostgresError } from "postgres";

type UserSignupRequest = {
  email: string;
  password: string;
  name: string;
  phone: string;
};

/**
 * 👤 POST /api/user — Create new user (Sign Up)
 */
export async function POST(request: NextRequest) {
  try {
    const { email, password, name, phone } = await request.json();
    console.log("user request from", email);

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    await sql`
      INSERT INTO users (email, password_hash, name, phone)
      VALUES (${email}, ${passwordHash}, ${name}, ${phone})
    `;

    console.log("✅ Successfully created new user");
    return NextResponse.json({ message: "User created successfully" }, { status: 201 });
  } catch (e: PostgresError | any) {
    console.error(e);
    if (e.code === "23505") {
      return NextResponse.json({ error: "Email or phone already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * 🔍 GET /api/user — Validate logged-in user
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value;
    console.log("auth token:", token);
    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Verify the JWT token
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
    console.log("decoded token:", decoded);

    // Optionally get user details
    const users = await sql`
      SELECT id, email, name, phone
      FROM users
      WHERE id = ${decoded.userId}
      LIMIT 1
    `;

    if (users.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user: users[0] }, { status: 200 });
  } catch (err: any) {
    console.error("❌ Auth check error:", err);
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 403 });
  }
}
