export default function ContentError({
  title,
  description,
  className
}) {
  return (
    <div className={`content-container min-h-[400px] flex items-center justify-center ${className}`}>
      <div className="text-center">
        <div className="font-semibold">{title}</div>
        {description ? (
          <div className="mt-1 text-sm text-muted-foreground">{description}</div>
        ) : null}
      </div>
    </div>
  );
}