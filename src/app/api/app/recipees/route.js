import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const API_ENDPOINT = process.env.NEXT_PUBLIC_API_ENDPOINT;

export async function GET(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query") || "";
    const page = searchParams.get("page") || "1";
    const limit = searchParams.get("limit") || "20";
    const priority = searchParams.get("priority") || "high";

    const endpoint = `${API_ENDPOINT}/app/recipees?query=${encodeURIComponent(query)}&page=${encodeURIComponent(page)}&limit=${encodeURIComponent(limit)}&priority=${encodeURIComponent(priority)}`;
    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    const payload = await response.json();
    return NextResponse.json(payload, { status: response.status });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        status_code: 500,
        message: "Failed to fetch recipes",
        error: error?.message || "Unknown error",
        data: [],
        pagination: { page: 1, limit: 20, total: 0, hasMore: false },
      },
      { status: 500 }
    );
  }
}
