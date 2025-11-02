import { NextRequest, NextResponse } from "next/server";
import sql from "@/app/lib/postgres_client";
import { getAuthenticatedUserId } from "@/app/lib/auth_user";

/**
 * Get all conversations for authenticated user
 * Segregated into buyer conversations and seller conversations
 */
export async function GET(request: NextRequest) {
  // Authenticate user
  const userIdOrResponse = getAuthenticatedUserId(request);
  if (userIdOrResponse instanceof NextResponse) {
    return userIdOrResponse;
  }
  const userId = userIdOrResponse;

  try {
    // Get all conversations where user is buyer or seller
    const conversations = await sql`
      SELECT
        c.id,
        c.listing_id,
        c.seller_id,
        c.buyer_id,
        c.status,
        c.last_message_at,
        c.created_at,
        -- Listing info
        l.title as listing_title,
        l.price_pence as listing_price,
        l.status as listing_status,
        -- Seller info
        u_seller.name as seller_name,
        -- Buyer info
        u_buyer.name as buyer_name,
        -- Determine user's role in this conversation
        CASE
          WHEN c.seller_id = ${userId} THEN 'seller'
          ELSE 'buyer'
        END as my_role,
        -- Get other party's info
        CASE
          WHEN c.seller_id = ${userId} THEN u_buyer.name
          ELSE u_seller.name
        END as other_party_name,
        CASE
          WHEN c.seller_id = ${userId} THEN c.buyer_id
          ELSE c.seller_id
        END as other_party_id,
        -- Get latest message
        (
          SELECT json_build_object(
            'id', m.id,
            'body', m.body,
            'type', m.type,
            'sender_id', m.sender_id,
            'created_at', m.created_at
          )
          FROM messages m
          WHERE m.conversation_id = c.id
          ORDER BY m.created_at DESC
          LIMIT 1
        ) as last_message,
        -- Get first listing image
        (
          SELECT li.url
          FROM listing_images li
          WHERE li.listing_id = c.listing_id
          ORDER BY li.position
          LIMIT 1
        ) as listing_image
      FROM conversations c
      JOIN listings l ON c.listing_id = l.id
      JOIN users u_seller ON c.seller_id = u_seller.id
      JOIN users u_buyer ON c.buyer_id = u_buyer.id
      WHERE c.seller_id = ${userId} OR c.buyer_id = ${userId}
      ORDER BY c.last_message_at DESC NULLS LAST, c.created_at DESC
    `;

    // Segregate into buyer and seller conversations
    const buyerConversations = conversations.filter((c) => c.my_role === "buyer");
    const sellerConversations = conversations.filter((c) => c.my_role === "seller");

    return NextResponse.json(
      {
        buyer_conversations: buyerConversations,
        seller_conversations: sellerConversations,
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
 * Create a new conversation
 * Automatically creates system message: "[Buyer name] is interested in [TITLE]"
 */
export async function POST(request: NextRequest) {
  // Authenticate user
  const userIdOrResponse = getAuthenticatedUserId(request);
  if (userIdOrResponse instanceof NextResponse) {
    return userIdOrResponse;
  }
  const userId = userIdOrResponse;

  try {
    const { listing_id } = await request.json();

    if (!listing_id) {
      return NextResponse.json(
        { error: "listing_id is required" },
        { status: 400 }
      );
    }

    // Get listing and seller info
    const listings = await sql`
      SELECT
        l.id,
        l.seller_id,
        l.title,
        l.status,
        u.name as seller_name
      FROM listings l
      JOIN users u ON l.seller_id = u.id
      WHERE l.id = ${listing_id}
    `;

    if (listings.length === 0) {
      return NextResponse.json(
        { error: "Listing not found" },
        { status: 404 }
      );
    }

    const listing = listings[0];

    // Check if user is trying to message their own listing
    if (listing.seller_id === userId) {
      return NextResponse.json(
        { error: "Cannot create conversation with yourself" },
        { status: 400 }
      );
    }

    // Get buyer info
    const buyers = await sql`
      SELECT name FROM users WHERE id = ${userId}
    `;

    if (buyers.length === 0) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const buyerName = buyers[0].name;

    // Check if conversation already exists
    const existingConversations = await sql`
      SELECT id FROM conversations
      WHERE listing_id = ${listing_id}
      AND buyer_id = ${userId}
    `;

    if (existingConversations.length > 0) {
      // Conversation already exists, return it
      return NextResponse.json(
        {
          message: "Conversation already exists",
          conversation_id: existingConversations[0].id,
          is_new: false,
        },
        { status: 200 }
      );
    }

    // Create new conversation
    const newConversations = await sql`
      INSERT INTO conversations (
        listing_id,
        seller_id,
        buyer_id,
        status,
        last_message_at
      ) VALUES (
        ${listing_id},
        ${listing.seller_id},
        ${userId},
        'open',
        NOW()
      )
      RETURNING id, listing_id, seller_id, buyer_id, created_at
    `;

    const conversation = newConversations[0];

    // Create automatic system message: "[Buyer name] is interested in [TITLE]"
    const systemMessageBody = `${buyerName} is interested in ${listing.title}`;

    await sql`
      INSERT INTO messages (
        conversation_id,
        sender_id,
        type,
        body,
        created_at
      ) VALUES (
        ${conversation.id},
        ${userId},
        'system',
        ${systemMessageBody},
        NOW()
      )
    `;

    return NextResponse.json(
      {
        message: "Conversation created successfully",
        conversation_id: conversation.id,
        is_new: true,
        conversation: conversation,
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
