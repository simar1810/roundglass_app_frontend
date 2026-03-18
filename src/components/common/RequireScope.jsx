"use client";

import { hasScope } from "@/lib/permissions";
import NotAuthorized from "./NotAuthorized";

export default function RequireScope({
  scope,
  children,
  title,
  description,
}) {
  if (!hasScope(scope)) {
    return (
      <NotAuthorized
        title={title || "Not authorized"}
        description={
          description ||
          "Your account doesn't have permission to access this section. Contact your coach admin."
        }
      />
    );
  }
  return children;
}

