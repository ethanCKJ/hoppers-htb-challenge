import { NextRequest, NextResponse } from "next/server";
import sql from "@/app/lib/postgres_client";
import { getAuthenticatedUserId } from "@/app/lib/auth_user";

/**
 * Update a listing (e.g., change status to sold/withdrawn)
 * Only the seller can update their own listing
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
    const listingId = (await params).id;
    const { status, buyer_id } = await request.json();

    // Validate status
    const validStatuses = ["active", "reserved", "sold", "withdrawn"];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        {
          error: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Verify user owns this listing
    const listings = await sql`
      SELECT id, seller_id, status, title
      FROM listings
      WHERE id = ${listingId}
    `;

    if (listings.length === 0) {
      return NextResponse.json(
        { error: "Listing not found" },
        { status: 404 }
      );
    }

    const listing = listings[0];

    if (listing.seller_id !== userId) {
      return NextResponse.json(
        { error: "Only the seller can update this listing" },
        { status: 403 }
      );
    }

    // Update listing
    const updatedListings = await sql`
      UPDATE listings
      SET
        status = ${status},
        buyer_id = ${buyer_id || null},
        archived_at = ${status === "sold" || status === "withdrawn" ? sql`NOW()` : null}
      WHERE id = ${listingId}
      RETURNING id, seller_id, title, status, buyer_id, archived_at, updated_at
    `;

    // If listing is being closed (sold/withdrawn), close all related conversations
    if (status === "sold" || status === "withdrawn") {
      await sql`
        UPDATE conversations
        SET
          status = 'closed',
          closed_at = NOW()
        WHERE listing_id = ${listingId}
        AND status = 'open'
      `;
    }

    return NextResponse.json(
      {
        message: "Listing updated successfully",
        listing: updatedListings[0],
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
 * Get a single listing by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const listingId = (await params).id;

    const listings = await sql`
      SELECT
        l.id,
        l.seller_id,
        l.title,
        l.description,
        l.price_pence,
        l.latitude,
        l.longitude,
        l.address,
        l.postcode,
        l.hide_exact_location,
        l.status,
        l.views_count,
        l.created_at,
        l.updated_at,
        u.name as seller_name,
        u.phone as seller_phone,
        COALESCE(
          json_agg(
            json_build_object(
              'id', li.id,
              'url', li.url,
              'position', li.position
            ) ORDER BY li.position
          ) FILTER (WHERE li.id IS NOT NULL),
          '[]'
        ) as images
      FROM listings l
      JOIN users u ON l.seller_id = u.id
      LEFT JOIN listing_images li ON l.id = li.listing_id
      WHERE l.id = ${listingId}
      GROUP BY l.id, u.name, u.phone
    `;

    if (listings.length === 0) {
      return NextResponse.json(
        { error: "Listing not found" },
        { status: 404 }
      );
    }

    // Increment view count
    await sql`
      UPDATE listings
      SET views_count = views_count + 1
      WHERE id = ${listingId}
    `;

    return NextResponse.json(
      {
        listing: listings[0],
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
