import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/app/lib/auth_user";
import sql from "@/app/lib/postgres_client";
import { openai, OPENAI_CHAT_MODEL } from "@/app/api/constants";
import { searchListings } from "@/app/lib/vector_search";

/**
 * Open a new or existing with AI bot for listing recommendations
 * Uses GPT with function calling to provide smart recommendations
 */
export async function POST(request: NextRequest) {
  // Authenticate user and get their id
  const userIdOrResponse = getAuthenticatedUserId(request);
  if (userIdOrResponse instanceof NextResponse) {
    return userIdOrResponse;
  }
  const userId = userIdOrResponse;

  try {
    const { conversation_id, message } = await request.json();
    // Catch empty message
    if (!message || message.trim().length === 0) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    let conversationId = conversation_id;

    // Create conversation if first time user creates new conversation with bot.
    if (!conversationId) {
      const newConv = await sql`
        INSERT INTO bot_conversations (user_id)
        VALUES (${userId})
        RETURNING id
      `;
      conversationId = newConv[0].id;
    } else {
      // Verify existing conversation belongs to user
      const conversations = await sql`
        SELECT id FROM bot_conversations
        WHERE id = ${conversationId} AND user_id = ${userId}
      `;

      if (conversations.length === 0) {
        return NextResponse.json(
          { error: "Conversation not found" },
          { status: 404 }
        );
      }
    }

    // Save user message in conversation
    await sql`
      INSERT INTO bot_messages (conversation_id, role, content)
      VALUES (${conversationId}, 'user', ${message})
    `;

    // Get conversation history (last 10 messages for context)
    const history = await sql`
      SELECT role, content
      FROM bot_messages
      WHERE conversation_id = ${conversationId}
      ORDER BY created_at DESC
      LIMIT 10
    `;

    // Reverse to get chronological order
    history.reverse();

    // Perform semantic search on user's most recent message for relevant listings
    console.log(`Searching for: "${message}"`);
    const searchResults = await searchListings(message, 8, 0.3);
    console.log(`Found ${searchResults.length} potential matches`);

    // Build context for GPT with available listings
    const listingsContext = searchResults
      .map(
        (listing, i) =>
          `[${i + 1}] Listing ID: ${listing.id}
Title: ${listing.title}
Price: £${(listing.price_pence / 100).toFixed(2)}
Category: ${listing.category || "Uncategorized"}
Description: ${listing.description.substring(0, 200)}${listing.description.length > 200 ? "..." : ""}
Similarity Score: ${(listing.similarity * 100).toFixed(1)}%`
      )
      .join("\n\n");

    // Define function for tool calling
    const tools: any[] = [
      {
        type: "function",
        function: {
          name: "recommend_listings",
          description:
            "Recommend specific listings to the user. Only recommend listings that truly match what the user is looking for. Be selective and quality-focused.",
          parameters: {
            type: "object",
            properties: {
              listings: {
                type: "array",
                description: "Array of recommended listings with reasons",
                items: {
                  type: "object",
                  properties: {
                    listing_id: {
                      type: "string",
                      description: "The UUID of the recommended listing e.g. e2b281a5-edac-4f82-b959-a33fd484e4f7",
                    },
                    reason: {
                      type: "string",
                      description:
                        "Brief, specific reason why this listing matches the user's request (1-2 sentences)",
                    },
                  },
                  required: ["listing_id", "reason"],
                },
              },
            },
            required: ["listings"],
          },
        },
      },
    ];

    // Build messages for GPT
    const messages: any[] = [
      {
        role: "system",
        content: `You are a helpful marketplace assistant helping users find items in Edinburgh, Scotland.

Your task:
1. Understand what the user is looking for
2. Analyze the available listings below
3. Recommend ONLY the listings that genuinely match their needs
4. Be selective - quality over quantity
5. Provide a friendly, conversational response
6. Use the recommend_listings function to specify which listings to show

Available listings from semantic search:
${listingsContext}

Important:
- Only recommend listings that truly fit the user's request
- Consider price, category, and description relevance
- If nothing matches well, be honest and ask clarifying questions
- Don't recommend everything - be selective
- Focus on the best 3-5 matches if multiple good options exist`,
      },
      ...history.map((msg: any) => ({
        role: msg.role,
        content: msg.content,
      })),
    ];

    // Call GPT with function calling
    console.log("Calling GPT...");
    const response = await openai.chat.completions.create({
      model: OPENAI_CHAT_MODEL,
      messages,
      tools,
      tool_choice: "auto",

    });

    const assistantMessage = response.choices[0].message;
    const textResponse = assistantMessage.content || "";

    // Extract function call (recommended listings)
    let recommendedListings: any[] = [];
    if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
      const toolCall = assistantMessage.tool_calls[0];
      if (toolCall.function.name === "recommend_listings") {
        try {
          const args = JSON.parse(toolCall.function.arguments);
          recommendedListings = args.listings || [];
          console.log(`Bot recommended ${recommendedListings.length} listings`);
        } catch (parseError) {
          console.error("Failed to parse tool call arguments:", parseError);
        }
      }
    }

    // Save assistant message with recommendations
    await sql`
      INSERT INTO bot_messages (
        conversation_id,
        role,
        content,
        recommended_listings
      ) VALUES (
        ${conversationId},
        'assistant',
        ${textResponse},
        ${JSON.stringify(recommendedListings)}
      )
    `;

    // Update conversation timestamp
    await sql`
      UPDATE bot_conversations
      SET updated_at = NOW()
      WHERE id = ${conversationId}
    `;

    return NextResponse.json(
      {
        conversation_id: conversationId,
        response: textResponse,
        recommended_listings: recommendedListings,
      },
      { status: 200 }
    );
  } catch (e) {
    console.error("Bot chat error:", e);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
