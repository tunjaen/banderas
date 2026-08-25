"use client";

import { useLanguage } from "@/lib/LanguageContext";
import { FaTimes, FaBolt, FaFire, FaCrown, FaCheck } from "react-icons/fa";

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

  const options = [
    {
      limit: 10,
      icon: <FaBolt style={{ color: "#10B981" }} size={22} />,
      title: lang === "en" ? "10 Questions" : "10 Preguntas",
      badge: lang === "en" ? "Quick Round" : "Ronda Rápida",
      badgeBg: "rgba(16, 185, 129, 0.15)",
      badgeColor: "#10B981",
      borderColor: "rgba(16, 185, 129, 0.3)",
      hoverBorder: "#10B981",
      desc: lang === "en" ? "Ideal for quick practice (~2 min)" : "Ideal para prácticas rápidas (~2 min)"
    },
    {
      limit: 25,
      icon: <FaFire style={{ color: "#F59E0B" }} size={22} />,
      title: lang === "en" ? "25 Questions" : "25 Preguntas",
      badge: lang === "en" ? "Standard Round" : "Ronda Estándar",
      badgeBg: "rgba(245, 158, 11, 0.15)",
      badgeColor: "#F59E0B",
      borderColor: "rgba(245, 158, 11, 0.3)",
      hoverBorder: "#F59E0B",
      desc: lang === "en" ? "Balanced mastery (~5 min)" : "Equilibrado para dominar territorio (~5 min)"
    },
    {
      limit: 50,
      icon: <FaCrown style={{ color: "#60A5FA" }} size={22} />,
      title: lang === "en" ? "50 Questions" : "50 Preguntas",
      badge: lang === "en" ? "Full Challenge" : "Desafío Total",
      badgeBg: "rgba(59, 130, 246, 0.15)",
      badgeColor: "#60A5FA",
      borderColor: "rgba(59, 130, 246, 0.3)",
      hoverBorder: "#60A5FA",
      desc: lang === "en" ? "Maximum domination challenge (~10 min)" : "Máxima dominación y experiencia (~10 min)"
    }
  ];

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
          padding: "1.75rem 1.25rem",
          maxWidth: "480px",
          width: "100%",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7)",
          position: "relative"
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "1.25rem",
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

        {/* Modal Header */}
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <div style={{ fontSize: "2.25rem", marginBottom: "0.4rem" }}>🎯</div>
          <h2 style={{ fontSize: "1.35rem", fontWeight: "900", color: "#fff", margin: 0 }}>
            {title || (lang === "en" ? "Choose Round Duration" : "¿Cuántas preguntas en esta ronda?")}
          </h2>
          {subtitle && (
            <p style={{ fontSize: "0.85rem", color: "#A7F432", fontWeight: "700", marginTop: "0.35rem", margin: "0.35rem 0 0" }}>
              {subtitle}
            </p>
          )}
          <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginTop: "0.25rem" }}>
            {lang === "en" ? "Select the number of questions for this session" : "Selecciona el número de preguntas para tu sesión de Conquista"}
          </p>
        </div>

        {/* Options List */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
          {options.map(opt => (
            <button
              key={opt.limit}
              onClick={() => onSelect(opt.limit)}
              style={{
                width: "100%",
                minHeight: "68px",
                padding: "0.9rem 1.1rem",
                borderRadius: "14px",
                background: "rgba(255, 255, 255, 0.03)",
                border: `2px solid ${opt.borderColor}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "0.85rem",
                cursor: "pointer",
                textAlign: "left",
                transition: "all 0.2s ease-in-out",
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = opt.hoverBorder)}
              onMouseLeave={e => (e.currentTarget.style.borderColor = opt.borderColor)}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
                <div
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "12px",
                    background: opt.badgeBg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0
                  }}
                >
                  {opt.icon}
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "1.1rem", fontWeight: "900", color: "#fff" }}>
                      {opt.title}
                    </span>
                    <span
                      style={{
                        fontSize: "0.7rem",
                        fontWeight: "800",
                        color: opt.badgeColor,
                        background: opt.badgeBg,
                        padding: "0.1rem 0.5rem",
                        borderRadius: "10px"
                      }}
                    >
                      {opt.badge}
                    </span>
                  </div>
                  <span style={{ fontSize: "0.775rem", color: "var(--color-text-muted)", marginTop: "0.15rem", display: "block" }}>
                    {opt.desc}
                  </span>
                </div>
              </div>

              <div
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "50%",
                  background: opt.badgeBg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: opt.badgeColor,
                  flexShrink: 0
                }}
              >
                <FaCheck size={12} />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
