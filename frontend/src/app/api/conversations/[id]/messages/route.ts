import { NextRequest, NextResponse } from "next/server";
import sql from "@/app/lib/postgres_client";
import { getAuthenticatedUserId } from "@/app/lib/auth_user";

/**
 * Get all messages in a conversation
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  // Authenticate user
  const userIdOrResponse = getAuthenticatedUserId(request);
  if (userIdOrResponse instanceof NextResponse) {
    return userIdOrResponse;
  }
  const userId = userIdOrResponse;

  try {
    const { id } = await context.params;
    const conversationId = id;

    // Verify user is part of this conversation
    const conversations = await sql`
      SELECT
        c.id,
        c.listing_id,
        c.seller_id,
        c.buyer_id,
        c.status,
        l.title as listing_title,
        l.price_pence as listing_price,
        u_seller.name as seller_name,
        u_buyer.name as buyer_name,
        CASE
          WHEN c.seller_id = ${userId} THEN 'seller'
          ELSE 'buyer'
        END as my_role
      FROM conversations c
      JOIN listings l ON c.listing_id = l.id
      JOIN users u_seller ON c.seller_id = u_seller.id
      JOIN users u_buyer ON c.buyer_id = u_buyer.id
      WHERE c.id = ${conversationId}
      AND (c.seller_id = ${userId} OR c.buyer_id = ${userId})
    `;

    if (conversations.length === 0) {
      return NextResponse.json(
        { error: "Conversation not found or access denied" },
        { status: 404 }
      );
    }

    const conversation = conversations[0];

    // Get all messages in the conversation
    const messages = await sql`
      SELECT
        m.id,
        m.sender_id,
        m.type,
        m.body,
        m.image_url,
        m.created_at,
        m.read_at,
        u.name as sender_name,
        CASE
          WHEN m.sender_id = ${userId} THEN true
          ELSE false
        END as is_mine
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.conversation_id = ${conversationId}
      ORDER BY m.created_at ASC
    `;

    return NextResponse.json(
      {
        conversation: {
          id: conversation.id,
          listing_id: conversation.listing_id,
          listing_title: conversation.listing_title,
          listing_price: conversation.listing_price,
          seller_name: conversation.seller_name,
          buyer_name: conversation.buyer_name,
          my_role: conversation.my_role,
          status: conversation.status,
        },
        messages: messages,
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

/**
 * Send a new message in a conversation
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  // Authenticate user
  const userIdOrResponse = getAuthenticatedUserId(request);
  if (userIdOrResponse instanceof NextResponse) {
    return userIdOrResponse;
  }
  const userId = userIdOrResponse;

  try {
    const { id } = await context.params;
    const conversationId = id;
    const { body, image_url } = await request.json();

    if (!body && !image_url) {
      return NextResponse.json(
        { error: "Message body or image is required" },
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

    const conversation = conversations[0];

    // Check if conversation is open
    if (conversation.status === 'closed') {
      return NextResponse.json(
        { error: "Cannot send message to closed conversation" },
        { status: 400 }
      );
    }

    // Insert new message
    const newMessages = await sql`
      INSERT INTO messages (
        conversation_id,
        sender_id,
        type,
        body,
        image_url,
        created_at
      ) VALUES (
        ${conversationId},
        ${userId},
        'user',
        ${body || null},
        ${image_url || null},
        NOW()
      )
      RETURNING id, sender_id, type, body, image_url, created_at
    `;

    const message = newMessages[0];

    // Update conversation's last_message_at
    await sql`
      UPDATE conversations
      SET last_message_at = NOW()
      WHERE id = ${conversationId}
    `;

    // Get sender name
    const users = await sql`
      SELECT name FROM users WHERE id = ${userId}
    `;

    return NextResponse.json(
      {
        message: "Message sent successfully",
        data: {
          ...message,
          sender_name: users[0]?.name,
          is_mine: true,
        },
      },
      { status: 201 }
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
