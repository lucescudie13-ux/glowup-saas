/** True when the avatar value is an image (data URL or http URL) vs an emoji. */
export function isImageAvatar(avatar?: string | null): boolean {
  return !!avatar && (avatar.startsWith("data:image") || avatar.startsWith("http"));
}

/**
 * Renders the character avatar — either a custom image or an emoji glyph —
 * inside a square `size`px box. `className` is applied to the wrapper.
 */
export function Avatar({
  avatar,
  size = 40,
  className,
}: {
  avatar?: string | null;
  size?: number;
  className?: string;
}) {
  const value = avatar || "🧍‍♂️";
  if (isImageAvatar(value)) {
    return (
      <span className={className} style={{ width: size, height: size, display: "inline-block" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={value}
          alt="Avatar"
          width={size}
          height={size}
          style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "inherit", display: "block" }}
        />
      </span>
    );
  }
  return (
    <span
      className={className}
      style={{ width: size, height: size, display: "inline-grid", placeItems: "center", fontSize: Math.round(size * 0.58) }}
    >
      {value}
    </span>
  );
}
