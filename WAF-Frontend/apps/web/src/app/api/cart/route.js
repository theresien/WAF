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

    const cartItems = await sql`
      SELECT ci.id, ci.product_id, ci.quantity, p.name, p.price, p.image_url, p.brand
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ci.session_id = ${sessionId}
      ORDER BY ci.added_at DESC
    `;

    return Response.json(cartItems);
  } catch (error) {
    console.error("Error fetching cart:", error);
    return Response.json({ error: "Failed to fetch cart" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { sessionId, productId, quantity } = body;

    if (!sessionId || !productId || !quantity) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Check if item already in cart
    const existing = await sql`
      SELECT id, quantity FROM cart_items 
      WHERE session_id = ${sessionId} AND product_id = ${productId}
    `;

    if (existing.length > 0) {
      // Update quantity
      const newQuantity = existing[0].quantity + quantity;
      await sql`
        UPDATE cart_items 
        SET quantity = ${newQuantity}
        WHERE id = ${existing[0].id}
      `;
      const updated = await sql`
        SELECT ci.id, ci.product_id, ci.quantity, p.name, p.price, p.image_url, p.brand
        FROM cart_items ci
        JOIN products p ON ci.product_id = p.id
        WHERE ci.id = ${existing[0].id}
      `;
      return Response.json(updated[0]);
    } else {
      // Add new item
      const result = await sql`
        INSERT INTO cart_items (session_id, product_id, quantity)
        VALUES (${sessionId}, ${productId}, ${quantity})
        RETURNING *
      `;

      const item = await sql`
        SELECT ci.id, ci.product_id, ci.quantity, p.name, p.price, p.image_url, p.brand
        FROM cart_items ci
        JOIN products p ON ci.product_id = p.id
        WHERE ci.id = ${result[0].id}
      `;
      return Response.json(item[0]);
    }
  } catch (error) {
    console.error("Error adding to cart:", error);
    return Response.json({ error: "Failed to add to cart" }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const cartItemId = searchParams.get("cartItemId");

    if (!cartItemId) {
      return Response.json(
        { error: "Cart item ID is required" },
        { status: 400 },
      );
    }

    await sql`
      DELETE FROM cart_items WHERE id = ${cartItemId}
    `;

    return Response.json({ success: true });
  } catch (error) {
    console.error("Error deleting from cart:", error);
    return Response.json(
      { error: "Failed to delete from cart" },
      { status: 500 },
    );
  }
}
