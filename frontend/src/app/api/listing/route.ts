import { NextRequest, NextResponse } from "next/server";
import sql from "@/app/lib/postgres_client";
import { getAuthenticatedUserId } from "@/app/lib/auth_user";

type CreateListingRequest = {
  title: string;
  description: string;
  category?: string; // ✅ added
  price_pence: number;
  latitude?: number;
  longitude?: number;
  address?: string;
  postcode?: string;
  hide_exact_location?: boolean;
  images?: string[]; // Array of image filenames
};

/**
 * 🧾 POST /api/listing — Create a new listing
 */
export async function POST(request: NextRequest) {
  // Authenticate user
  const userIdOrResponse = getAuthenticatedUserId(request);
  if (userIdOrResponse instanceof NextResponse) {
    return userIdOrResponse; // Return authentication error
  }
  const userId = userIdOrResponse;

  try {
    const {
      title,
      description,
      price_pence,
      category,
      latitude,
      longitude,
      address,
      postcode,
      hide_exact_location = true,
      images = [],
    } = (await request.json()) as CreateListingRequest;

    // Validate required fields
    if (!title || !description || price_pence === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: title, description, price_pence" },
        { status: 400 }
      );
    }

    if (price_pence < 0) {
      return NextResponse.json(
        { error: "Price must be non-negative" },
        { status: 400 }
      );
    }

    // Insert listing
    const listings = await sql`
      INSERT INTO listings (
        seller_id,
        title,
        description,
        category,
        price_pence,
        latitude,
        longitude,
        address,
        postcode,
        hide_exact_location,
        status
      ) VALUES (
        ${userId},
        ${title},
        ${description},
        ${category || null},
        ${price_pence},
        ${latitude || null},
        ${longitude || null},
        ${address || null},
        ${postcode || null},
        ${hide_exact_location},
        'active'
      )
      RETURNING id, seller_id, title, description, category, price_pence, status, created_at
    `;

    const listing = listings[0];

    // Insert images if provided
    if (images.length > 0) {
      for (let i = 0; i < images.length; i++) {
        const imageFilename = images[i];
        const imageUrl = `/listing_images/${imageFilename}`;

        await sql`
          INSERT INTO listing_images (
            listing_id,
            position,
            url,
            storage_key
          ) VALUES (
            ${listing.id},
            ${i},
            ${imageUrl},
            ${imageFilename}
          )
        `;
      }
    }

    return NextResponse.json(
      {
        message: "Listing created successfully",
        listing: listing,
      },
      { status: 201 }
    );
  } catch (e) {
    console.error("Error creating listing:", e);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

/**
 * 🔍 GET /api/listing — Fetch listings with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Extract filter parameters
    const sellerId = searchParams.get("sellerId");
    const keyword = searchParams.get("keyword");
    const maxPrice = searchParams.get("maxPrice");
    const minPrice = searchParams.get("minPrice");
    const category = searchParams.get("category"); // ✅ added

    // Build dynamic query
    let query = `
      SELECT
        l.id,
        l.seller_id,
        l.title,
        l.description,
        l.category,
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
      LEFT JOIN listing_images li ON l.id = li.listing_id
      WHERE l.status = 'active'
    `;

    const params: any[] = [];
    let paramIndex = 1;

    // Add sellerId filter
    if (sellerId) {
      query += ` AND l.seller_id = $${paramIndex}`;
      params.push(sellerId);
      paramIndex++;
    }

    // Add keyword search
    if (keyword) {
      query += ` AND l.search_tsv @@ plainto_tsquery('simple', $${paramIndex})`;
      params.push(keyword);
      paramIndex++;
    }

    // Add category filter
    if (category) {
      query += ` AND l.category ILIKE $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    // Add minPrice filter
    if (minPrice) {
      const minPricePence = parseInt(minPrice);
      if (!isNaN(minPricePence)) {
        query += ` AND l.price_pence >= $${paramIndex}`;
        params.push(minPricePence);
        paramIndex++;
      }
    }

    // Add maxPrice filter
    if (maxPrice) {
      const maxPricePence = parseInt(maxPrice);
      if (!isNaN(maxPricePence)) {
        query += ` AND l.price_pence <= $${paramIndex}`;
        params.push(maxPricePence);
        paramIndex++;
      }
    }

    // Group and order
    query += `
      GROUP BY l.id
      ORDER BY l.created_at DESC
      LIMIT 100
    `;

    // Execute query with parameters
    const listings = await sql.unsafe(query, params);

    return NextResponse.json(
      {
        listings,
        count: listings.length,
      },
      { status: 200 }
    );
  } catch (e) {
    console.error("Error fetching listings:", e);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

/**
 * ✏️ PUT /api/listing — Placeholder (unused)
 */
export async function PUT(request: NextRequest) {
  return NextResponse.json(
    { message: "Not implemented" },
    { status: 405 }
  );
}
