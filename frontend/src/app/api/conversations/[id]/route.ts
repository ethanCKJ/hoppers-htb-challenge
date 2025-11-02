import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/app/lib/auth_user";
import sql from "@/app/lib/postgres_client";

/**
 * Get a specific bot conversation with all messages
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> } // ✅ updated signature
) {
  const { id: conversationId } = await context.params; // ✅ await params

  // Authenticate user
  const userIdOrResponse = getAuthenticatedUserId(request);
  if (userIdOrResponse instanceof NextResponse) {
    return userIdOrResponse;
  }
  const userId = userIdOrResponse;

  try {
    // Verify ownership
    const conversations = await sql`
      SELECT id, created_at, updated_at
      FROM bot_conversations
      WHERE id = ${conversationId} AND user_id = ${userId}
    `;

    if (conversations.length === 0) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    const conversation = conversations[0];

    // Get all messages
    const messages = await sql`
      SELECT
        id,
        role,
        content,
        recommended_listings,
        created_at
      FROM bot_messages
      WHERE conversation_id = ${conversationId}
      ORDER BY created_at ASC
    `;

    return NextResponse.json(
      { conversation, messages },
      { status: 200 }
    );
  } catch (e) {
    console.error("Failed to fetch bot conversation:", e);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

/**
 * Delete a bot conversation
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> } // ✅ updated signature
) {
  const { id: conversationId } = await context.params; // ✅ await params

  // Authenticate user
  const userIdOrResponse = getAuthenticatedUserId(request);
  if (userIdOrResponse instanceof NextResponse) {
    return userIdOrResponse;
  }
  const userId = userIdOrResponse;

  try {
    // Delete conversation (messages will cascade)
    const result = await sql`
      DELETE FROM bot_conversations
      WHERE id = ${conversationId} AND user_id = ${userId}
      RETURNING id
    `;

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Conversation deleted successfully" },
      { status: 200 }
    );
  } catch (e) {
    console.error("Failed to delete bot conversation:", e);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
