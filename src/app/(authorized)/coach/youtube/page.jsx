"use client";
import { Button } from "@/components/ui/button";
import { buildUrlWithQueryParams } from "@/lib/formatter";
import { useAppSelector } from "@/providers/global/hooks";

const YT_REDIRECTION_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const YT_OAUTH_CLIENT_ID = "92110669040-tjdv1tdl21qs0d1dk5epe4lhrb7cjqqi.apps.googleusercontent.com"
const YT_RESPONSE_TYPE = "code"
const YT_REDIRECT_URL = "https://e408eb24d1ea.ngrok-free.app/api/app/youtube/oauth"
const YT_SCOPES = [
  "https://www.googleapis.com/auth/youtube.upload"
]


export default function Page() {
  const { _id } = useAppSelector(state => state.coach.data)

  function redirectUser() {
    const endpoint = buildUrlWithQueryParams(
      YT_REDIRECTION_URL,
      {
        client_id: YT_OAUTH_CLIENT_ID,
        response_type: YT_RESPONSE_TYPE,
        redirect_uri: YT_REDIRECT_URL,
        scope: YT_SCOPES.join(" "),
        state: _id,
        access_type: "offline",
        prompt: "consent"
      }
    )
    console.log(endpoint)
    // window.location.href = endpoint
  }

  return <div className="content-container content-height-screen flex items-center justify-center">
    <Button
      onClick={redirectUser}
    >
      Connect
    </Button>
  </div>
}