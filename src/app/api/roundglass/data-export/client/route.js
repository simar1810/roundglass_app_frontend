import { fetchData } from "@/lib/api";
import { buildUrlWithQueryParams } from "@/lib/formatter";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");

    if (!clientId) {
      return NextResponse.json(
        { status_code: 400, error: "Client ID is required" },
        { status: 400 }
      );
    }

    const endpoint = buildUrlWithQueryParams("app/roundglass/data-export/client", {
      person: "coach",
      clientId: clientId,
    });

    const response = await fetchData(endpoint);
    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json(
      { status_code: 500, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

