import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request) {
  try {
    const payload = await request.json();
    const cookieStore = await cookies();
    const cookieToken = cookieStore.get("token")?.value;
    const headerToken = request.headers.get("authorization")?.replace("Bearer ", "");
    const token = headerToken || cookieToken;

    if (!token) {
      return NextResponse.json(
        { status_code: 401, message: "Missing authorization token" },
        { status: 401 }
      );
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/app/register`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return NextResponse.json(
      { status_code: 500, message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
