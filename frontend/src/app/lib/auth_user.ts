import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

/**
 * Get authenticated user ID from JWT token in cookies
 * @param request - The Next.js request object
 * @returns NextResponse with error OR userId string if authenticated
 */
export function getAuthenticatedUserId(
  request: NextRequest
): NextResponse | string {
  try {
    // Get token from cookies
    const token = request.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
    };

    if (!decoded.userId) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      );
    }

    return decoded.userId;
  } catch (error) {
    // Token verification failed (expired, invalid signature, etc.)
    return NextResponse.json(
      { error: "Invalid or expired token" },
      { status: 401 }
    );
  }
}