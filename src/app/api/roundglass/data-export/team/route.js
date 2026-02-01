import { fetchData } from "@/lib/api";
import { buildUrlWithQueryParams } from "@/lib/formatter";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryIds = searchParams.get("clientCategoryIds");
    const metrics = searchParams.get("metrics");

    if (!categoryIds) {
      return NextResponse.json(
        { status_code: 400, error: "At least one category ID is required" },
        { status: 400 }
      );
    }

    const queryParams = {
      person: "coach",
      clientCategoryIds: categoryIds,
    };

    if (metrics) {
      queryParams.metrics = metrics;
    }

    const endpoint = buildUrlWithQueryParams(
      "app/roundglass/data-export/team",
      queryParams
    );

    const response = await fetchData(endpoint);
    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json(
      { status_code: 500, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

