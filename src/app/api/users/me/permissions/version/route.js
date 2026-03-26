import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { status_code: 401, message: "Please login!" },
        { status: 401 }
      );
    }

    const requestOptions = {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        // Some backends validate refresh token via custom header
        "x-refresh-token": token,
        refreshToken: token,
      },
      cache: "no-store",
    };

    let response = await fetch(
      `${process.env.NEXT_PUBLIC_API_ENDPOINT}/app/users/me/permissions/version`,
      requestOptions
    );

    // Backward compatibility with older middleware that still expects person=user.
    if (response.status === 401) {
      response = await fetch(
        `${process.env.NEXT_PUBLIC_API_ENDPOINT}/app/users/me/permissions/version?person=user`,
        requestOptions
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return NextResponse.json(
      { status_code: 500, message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
