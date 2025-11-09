import sql from "@/app/api/utils/sql";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return Response.json(
        { error: "Session ID is required" },
        { status: 400 },
      );
    }

    const favorites = await sql`
      SELECT f.id, p.id as product_id, p.name, p.price, p.image_url, p.brand, p.rating, p.review_count
      FROM favorites f
      JOIN products p ON f.product_id = p.id
      WHERE f.session_id = ${sessionId}
      ORDER BY f.created_at DESC
    `;

    return Response.json(favorites);
  } catch (error) {
    console.error("Error fetching favorites:", error);
    return Response.json(
      { error: "Failed to fetch favorites" },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { sessionId, productId } = body;

    if (!sessionId || !productId) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Check if already favorited
    const existing = await sql`
      SELECT id FROM favorites 
      WHERE session_id = ${sessionId} AND product_id = ${productId}
    `;

    if (existing.length > 0) {
      // Remove from favorites
      await sql`
        DELETE FROM favorites WHERE id = ${existing[0].id}
      `;
      return Response.json({ success: true, added: false });
    } else {
      // Add to favorites
      await sql`
        INSERT INTO favorites (session_id, product_id)
        VALUES (${sessionId}, ${productId})
      `;
      return Response.json({ success: true, added: true });
    }
  } catch (error) {
    console.error("Error toggling favorite:", error);
    return Response.json(
      { error: "Failed to toggle favorite" },
      { status: 500 },
    );
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");
    const productId = searchParams.get("productId");

    if (!sessionId || !productId) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    await sql`
      DELETE FROM favorites 
      WHERE session_id = ${sessionId} AND product_id = ${productId}
    `;

    return Response.json({ success: true });
  } catch (error) {
    console.error("Error removing favorite:", error);
    return Response.json(
      { error: "Failed to remove favorite" },
      { status: 500 },
    );
  }
}
