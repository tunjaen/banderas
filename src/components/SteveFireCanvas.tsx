"use client";

export default function SteveFireCanvas({ size = 80 }: { size?: number }) {
  const height = Math.round(size * 1.35);

  return (
    <iframe
      src="/steve-fire.html"
      title="Steve Fire Animation"
      style={{
        width: `${size}px`,
        height: `${height}px`,
        border: "none",
        background: "transparent",
        pointerEvents: "none",
        display: "block",
        overflow: "hidden",
      }}
    />
  );
}
