import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/app/lib/auth_user";
import sql from "@/app/lib/postgres_client";

/**
 * Get all bot conversations for the authenticated user
 */
export async function GET(request: NextRequest) {
  // Authenticate user
  const userIdOrResponse = getAuthenticatedUserId(request);
  if (userIdOrResponse instanceof NextResponse) {
    return userIdOrResponse;
  }
  const userId = userIdOrResponse;

  try {
    // Get all conversations with last message preview
    const conversations = await sql`
      SELECT
        c.id,
        c.created_at,
        c.updated_at,
        (
          SELECT json_build_object(
            'role', m.role,
            'content', m.content,
            'created_at', m.created_at
          )
          FROM bot_messages m
          WHERE m.conversation_id = c.id
          ORDER BY m.created_at DESC
          LIMIT 1
        ) as last_message,
        (
          SELECT COUNT(*)
          FROM bot_messages m
          WHERE m.conversation_id = c.id
        ) as message_count
      FROM bot_conversations c
      WHERE c.user_id = ${userId}
      ORDER BY c.updated_at DESC
    `;

    return NextResponse.json(
      {
        conversations: conversations,
      },
      { status: 200 }
    );
  } catch (e) {
    console.error("Failed to fetch bot conversations:", e);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
