import { NextRequest, NextResponse } from "next/server";
import sql from "@/app/lib/postgres_client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

type LoginRequest = {
  email: string;
  password: string;
};

/**
 * Login user and generate JWT token
 * @param request
 */
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Query user from database
    const users = await sql`
      SELECT id, email, password_hash
      FROM users
      WHERE email = ${email}
    `;

    // Check if user exists
    if (users.length === 0) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const user = users[0];

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" } // Token expires in 7 days
    );

    // Create response
    const response = NextResponse.json(
      { message: "Login successful" },
      { status: 200 }
    );

    // Set JWT as HTTP-only cookie
    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days in seconds
      path: "/",
    });

    return response;
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}