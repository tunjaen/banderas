"use client";

export default function SteveFireCanvas({ size = 90 }: { size?: number }) {
  const width = size;
  const height = Math.round(size * 1.5);

  return (
    <iframe
      src="/steve-fire.html"
      width={width}
      height={height}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        border: "none",
        background: "transparent",
        pointerEvents: "none",
        overflow: "hidden",
        display: "block"
      }}
      allowTransparency={true}
    />
  );
}
