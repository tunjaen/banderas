"use client";

import { useLanguage } from "@/lib/LanguageContext";
import { FaTimes, FaBolt, FaFire, FaCrown } from "react-icons/fa";

interface QuestionCountModalProps {
  onSelect: (limit: number) => void;
  onClose: () => void;
  title?: string;
  subtitle?: string;
}

export default function QuestionCountModal({
  onSelect,
  onClose,
  title,
  subtitle
}: QuestionCountModalProps) {
  const { lang } = useLanguage();

  const isEn = lang === "en";

  const options = [
    {
      limit: 10,
      icon: <FaBolt style={{ color: "#10B981" }} size={24} />,
      label: "10",
      bg: "rgba(16, 185, 129, 0.12)",
      color: "#10B981",
      borderColor: "rgba(16, 185, 129, 0.3)",
      hoverBorder: "#10B981"
    },
    {
      limit: 25,
      icon: <FaFire style={{ color: "#F59E0B" }} size={24} />,
      label: "25",
      bg: "rgba(245, 158, 11, 0.12)",
      color: "#F59E0B",
      borderColor: "rgba(245, 158, 11, 0.3)",
      hoverBorder: "#F59E0B"
    },
    {
      limit: 50,
      icon: <FaCrown style={{ color: "#60A5FA" }} size={24} />,
      label: "50",
      bg: "rgba(59, 130, 246, 0.12)",
      color: "#60A5FA",
      borderColor: "rgba(59, 130, 246, 0.3)",
      hoverBorder: "#60A5FA"
    }
  ];

  const modalTitle = title || (isEn ? "Select the number of questions in this round" : "Selecciona el número de preguntas en esta ronda");

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0, 0, 0, 0.82)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "1rem"
      }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="animate-fade-in"
        style={{
          background: "linear-gradient(145deg, #1e293b, #0f172a)",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          borderRadius: "20px",
          padding: "1.75rem 1.25rem 1.5rem",
          maxWidth: "420px",
          width: "100%",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7)",
          position: "relative",
          textAlign: "center"
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "1rem",
            right: "1.25rem",
            background: "rgba(255, 255, 255, 0.08)",
            border: "none",
            borderRadius: "50%",
            width: "32px",
            height: "32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--color-text-muted)",
            cursor: "pointer",
            transition: "all 0.2s"
          }}
        >
          <FaTimes size={14} />
        </button>

        {/* Title & Subtitle */}
        <div style={{ marginBottom: "1.5rem", paddingRight: "1rem", paddingLeft: "1rem" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: "800", color: "#fff", margin: 0, lineHeight: "1.35" }}>
            {modalTitle}
          </h2>
          {subtitle && (
            <span style={{ fontSize: "0.85rem", color: "#A7F432", fontWeight: "700", display: "inline-block", marginTop: "0.4rem" }}>
              {subtitle}
            </span>
          )}
        </div>

        {/* 3 Square / Compact Buttons in 1 Row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "0.75rem",
            width: "100%"
          }}
        >
          {options.map(opt => (
            <button
              key={opt.limit}
              onClick={() => onSelect(opt.limit)}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.4rem",
                aspectRatio: "1 / 1",
                padding: "0.75rem 0.5rem",
                borderRadius: "16px",
                background: opt.bg,
                border: `2px solid ${opt.borderColor}`,
                cursor: "pointer",
                transition: "all 0.2s ease-in-out"
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = opt.hoverBorder;
                e.currentTarget.style.transform = "translateY(-3px)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = opt.borderColor;
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              {opt.icon}
              <span style={{ fontSize: "1.35rem", fontWeight: "900", color: "#fff" }}>
                {opt.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
