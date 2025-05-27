"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
const API_ENDPOINT = process.env.NEXT_PUBLIC_API_ENDPOINT;

export async function fetchData(endpoint) {
  try {
    const cookieStore = await cookies();
    const TOKEN = cookieStore.get("token")?.value;

    const response = await fetch(`${API_ENDPOINT}/${endpoint}`, {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
      },
      cache: "no-store"
    });
    const data = await response.json();
    if ([408].includes(data.status_code)) {
      cookieStore.delete("token");
      redirect("/login");
    }
    return data;
  } catch (error) {
    return error;
  }
}

export async function sendData(endpoint, data, method = "POST") {
  try {
    if (typeof method !== "string") {
      throw new Error("HTTP method must be a string");
    }

    const cookieStore = await cookies();
    const TOKEN = cookieStore.get("token")?.value;

    const response = await fetch(`${API_ENDPOINT}/${endpoint}`, {
      method,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${TOKEN}`,
      },
      body: JSON.stringify(data),
      cache: "no-store"
    });
    const retrievedData = await response.json();
    return retrievedData;
  } catch (error) {
    return error;
  }
}

export async function sendDataWithFormData(endpoint, formData, method = "POST") {
  try {
    if (typeof method !== "string") {
      throw new Error("HTTP method must be a string");
    }

    const cookieStore = await cookies();
    const TOKEN = cookieStore.get("token")?.value;

    const response = await fetch(`${API_ENDPOINT}/${endpoint}`, {
      method,
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${TOKEN}`,
      },
      body: formData,
      cache: "no-store",
    });
    const retrievedData = await response.json();
    return retrievedData;
  } catch (error) {
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