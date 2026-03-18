"use server";

import { useExpireUserSession } from "@/components/common/AppNavbar";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
const API_ENDPOINT = process.env.NEXT_PUBLIC_API_ENDPOINT;

function withPersonIfNeeded(endpoint, cookieStore) {
  // Only auto-append for sub-users; coaches/clients have many explicit per-endpoint person values already.
  const userType = cookieStore?.get("userType")?.value;
  if (userType !== "user") return endpoint;
  if (!endpoint || typeof endpoint !== "string") return endpoint;
  if (endpoint.includes("person=")) return endpoint;
  return endpoint.includes("?") ? `${endpoint}&person=user` : `${endpoint}?person=user`;
}

export async function fetchData(endpoint, expireUserSession) {
  try {
    const cookieStore = await cookies();
    const TOKEN = cookieStore.get("token")?.value;
    const finalEndpoint = withPersonIfNeeded(endpoint, cookieStore);

    const response = await fetch(`${API_ENDPOINT}/${finalEndpoint}`, {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        "Accept-Encoding": "gzip, deflate, br",
        'Content-type': 'application/json',
        'Accept': 'application/json',
        "Connection": "keep-alive"
      },
      cache: "no-store",
    });

    if (response.status === 502) {
      redirect("/maintenance");
    }

    const data = await response.json();
    if (
      [408].includes(data.status_code)
      // || data.message?.toLowerCase() === "something went wrong"
    ) {
      cookieStore.delete("token");
      redirect("/login");
    }
    return data;
  } catch (error) {
    // Rethrow Next.js navigation errors (redirect, notFound, etc.)
    if (error?.digest?.startsWith('NEXT_REDIRECT')) {
      throw error;
    }
    return error;
  }
}

export async function sendData(
  endpoint,
  data,
  method = "POST",
  expireUserSession
) {
  try {
    if (typeof method !== "string") {
      throw new Error("HTTP method must be a string");
    }

    const cookieStore = await cookies();
    const TOKEN = cookieStore.get("token")?.value;
    const finalEndpoint = withPersonIfNeeded(endpoint, cookieStore);

    const response = await fetch(`${API_ENDPOINT}/${finalEndpoint}`, {
      method,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${TOKEN}`,
      },
      body: JSON.stringify(data),
      cache: "no-store",
    });

    if (response.status === 502) {
      redirect("/maintenance");
    }

    const retrievedData = await response.json();
    if (response.status === 401) {
      if (expireUserSession) await expireUserSession();
      return null;
    }
    return retrievedData;
  } catch (error) {
    // Rethrow Next.js navigation errors (redirect, notFound, etc.)
    if (error?.digest?.startsWith('NEXT_REDIRECT')) {
      throw error;
    }
    return error;
  }
}

export async function sendDataWithFormData(
  endpoint,
  formData,
  method = "POST",
  expireUserSession
) {
  try {
    if (typeof method !== "string") {
      throw new Error("HTTP method must be a string");
    }

    const cookieStore = await cookies();
    const TOKEN = cookieStore.get("token")?.value;
    const finalEndpoint = withPersonIfNeeded(endpoint, cookieStore);

    const response = await fetch(`${API_ENDPOINT}/${finalEndpoint}`, {
      method,
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${TOKEN}`,
      },
      body: formData,
      cache: "no-store",
    });

    if (response.status === 502) {
      redirect("/maintenance");
    }

    const retrievedData = await response.json();
    if (response.status === 401) {
      if (expireUserSession) await expireUserSession();
      return retrievedData;
    }
    return retrievedData;
  } catch (error) {
    // Rethrow Next.js navigation errors (redirect, notFound, etc.)
    if (error?.digest?.startsWith('NEXT_REDIRECT')) {
      throw error;
    }
    return error;
  }
}
export async function sendFile(endpoint, file) {
  try {
    const cookieStore = await cookies();
    const TOKEN = cookieStore.get("token")?.value;
    const finalEndpoint = withPersonIfNeeded(endpoint, cookieStore);

    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${API_ENDPOINT}/${finalEndpoint}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${TOKEN}`,
      },
      body: formData,
    });

    if (response.status === 502) redirect("/maintenance");

    return await response.json();
  } catch (error) {
    if (error?.digest?.startsWith("NEXT_REDIRECT")) throw error;
    return error;
  }
}
export async function sendFileWithQuery(endpoint, file, queryText) {
  try {
    const cookieStore = await cookies();
    const TOKEN = cookieStore.get("token")?.value;
    const finalEndpoint = withPersonIfNeeded(endpoint, cookieStore);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("query", queryText);

    const url = `${API_ENDPOINT}/${finalEndpoint}`;

    const response = await fetch(url, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${TOKEN}`,
      },
      body: formData,
    });

    if (response.status === 502) redirect("/maintenance");

    return await response.json();
  } catch (error) {
    if (error?.digest?.startsWith("NEXT_REDIRECT")) throw error;
    return error;
  }
}


export async function uploadImage(file) {
  try {
    const data = new FormData();
    data.append("file", file)
    const response = await sendDataWithFormData("app/getPlanImageWeb", data);
    if (response.status_code !== 200) throw new Error(response.message)
    return response;
  } catch (error) {
    return error
  }
}

export async function streamResponse(endpoint, data) {
  try {
    const response = await fetch(`${API_ENDPOINT}/${endpoint}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response
  } catch (error) {
    return error;
  }
}

export async function sendUserInsight(userId, payload) {
  try {
    if (!userId) return
    await sendData(`app/users/actions?person=coach`, { userId, payload }, "PUT")
  } catch (error) { }
}