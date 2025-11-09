import sql from "@/app/api/utils/sql";

export async function GET(request, { params: { id } }) {
  try {
    const product = await sql`
      SELECT * FROM products WHERE id = ${parseInt(id)}
    `;

    if (product.length === 0) {
      return Response.json({ error: "Product not found" }, { status: 404 });
    }

    return Response.json(product[0]);
  } catch (error) {
    console.error("Error fetching product:", error);
    return Response.json({ error: "Failed to fetch product" }, { status: 500 });
  }
}
