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

    const orders = await sql`
      SELECT o.id, o.total_price, o.order_status, o.created_at
      FROM orders o
      WHERE o.session_id = ${sessionId}
      ORDER BY o.created_at DESC
    `;

    return Response.json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    return Response.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { sessionId, cartItems } = body;

    if (!sessionId || !cartItems || cartItems.length === 0) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Calculate total price
    let totalPrice = 0;
    for (const item of cartItems) {
      totalPrice += item.price * item.quantity;
    }

    // Create order
    const order = await sql`
      INSERT INTO orders (session_id, total_price, order_status)
      VALUES (${sessionId}, ${totalPrice}, 'pending')
      RETURNING *
    `;

    // Add order items
    for (const item of cartItems) {
      await sql`
        INSERT INTO order_items (order_id, product_id, quantity, price)
        VALUES (${order[0].id}, ${item.product_id}, ${item.quantity}, ${item.price})
      `;
    }

    // Clear cart
    await sql`
      DELETE FROM cart_items WHERE session_id = ${sessionId}
    `;

    return Response.json(order[0]);
  } catch (error) {
    console.error("Error creating order:", error);
    return Response.json({ error: "Failed to create order" }, { status: 500 });
  }
}
