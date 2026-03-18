import ContentError from "./ContentError";

export default function NotAuthorized({
  title = "Not authorized",
  description = "You don't have access to view this section.",
}) {
  return (
    <div className="w-full">
      <div className="rounded-lg border bg-white p-6">
        <div className="text-lg font-semibold">{title}</div>
        <div className="mt-1 text-sm text-muted-foreground">{description}</div>
      </div>
      <ContentError className="min-h-[240px]" title="" />
    </div>
  );
}

