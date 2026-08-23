import React from "react";

export default function SwordsIcon({ 
  size = 20, 
  color = "currentColor",
  className = "",
  style = {}
}: { 
  size?: number; 
  color?: string; 
  className?: string; 
  style?: React.CSSProperties; 
}) {
  return (
    <span 
      className={className}
      style={{ 
        display: "inline-flex", 
        alignItems: "center", 
        justifyContent: "center", 
        fontSize: `${size}px`,
        color,
        lineHeight: 1,
        ...style 
      }}
    >
      ⚔️
    </span>
  );
}
