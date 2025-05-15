import cookies from "js-cookie";
const API_ENDPOINT = process.env.NEXT_PUBLIC_API_ENDPOINT;

export async function fetchBlobData(endpoint) {
  try {
    const TOKEN = cookies.get('token');

    const response = await fetch(`${API_ENDPOINT}/${endpoint}`, {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      },
      cache: "no-store"
    });
    return response;
  } catch (error) {
    return error;
  }
}