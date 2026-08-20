"use client";

import Link from "next/link";
import { FaGlobeAmericas, FaFlag, FaMapMarkedAlt } from "react-icons/fa";
import { useLanguage } from "@/lib/LanguageContext";
import LanguageSelector from "@/components/LanguageSelector";

export default function LandingClient() {
  const { t } = useLanguage();
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--color-background)", position: "relative" }}>
      
      <div style={{ position: "absolute", top: "1rem", right: "2rem" }}>
        <LanguageSelector />
      </div>

      <main style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center", padding: "2rem" }} className="animate-fade-in">
        
        <div style={{ background: "rgba(59, 130, 246, 0.1)", padding: "1.5rem", borderRadius: "50%", marginBottom: "2rem", boxShadow: "0 0 40px rgba(59, 130, 246, 0.2)" }}>
          <FaGlobeAmericas size={80} className="text-primary" />
        </div>

        <h1 style={{ fontSize: "clamp(3rem, 8vw, 5rem)", fontWeight: "900", lineHeight: "1.1", marginBottom: "1.5rem", maxWidth: "800px" }}>
          {t.landing.title}
        </h1>
        
        <p className="text-muted" style={{ fontSize: "1.25rem", maxWidth: "600px", marginBottom: "3rem", lineHeight: "1.6" }}>
          {t.landing.subtitle}
        </p>

        <div style={{ display: "flex", gap: "1rem", flexDirection: "column", alignItems: "center" }}>
          <Link href="/register" className="btn btn-primary" style={{ fontSize: "1.25rem", padding: "1rem 2.5rem", width: "100%", maxWidth: "300px" }}>
            {t.landing.cta}
          </Link>
          <Link href="/login" className="btn btn-outline" style={{ fontSize: "1rem", padding: "0.75rem 2.5rem", width: "100%", maxWidth: "300px", border: "none" }}>
            {t.landing.login}
          </Link>
        </div>
      </main>
    </div>
  );
}
