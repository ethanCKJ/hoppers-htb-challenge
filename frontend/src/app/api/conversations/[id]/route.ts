import { NextRequest, NextResponse } from "next/server";
import sql from "@/app/lib/postgres_client";
import { getAuthenticatedUserId } from "@/app/lib/auth_user";

/**
 * Close a conversation
 * Only the seller or buyer can close their own conversation
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Authenticate user
  const userIdOrResponse = getAuthenticatedUserId(request);
  if (userIdOrResponse instanceof NextResponse) {
    return userIdOrResponse;
  }
  const userId = userIdOrResponse;

  try {
    const conversationId = (await params).id;
    const { status } = await request.json();

    // Validate status
    if (status !== "closed") {
      return NextResponse.json(
        { error: "Only 'closed' status is supported" },
        { status: 400 }
      );
    }

    // Verify user is part of this conversation
    const conversations = await sql`
      SELECT id, seller_id, buyer_id, status
      FROM conversations
      WHERE id = ${conversationId}
      AND (seller_id = ${userId} OR buyer_id = ${userId})
    `;

    if (conversations.length === 0) {
      return NextResponse.json(
        { error: "Conversation not found or access denied" },
        { status: 404 }
      );
    }

    // Update conversation status
    const updatedConversations = await sql`
      UPDATE conversations
      SET
        status = 'closed',
        closed_at = NOW()
      WHERE id = ${conversationId}
      RETURNING id, status, closed_at
    `;

    return NextResponse.json(
      {
        message: "Conversation closed successfully",
        conversation: updatedConversations[0],
      },
      { status: 200 }
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
