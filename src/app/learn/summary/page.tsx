"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FaTrophy, FaCheckCircle, FaTimesCircle, FaStar } from "react-icons/fa";
import { useLanguage } from "@/lib/LanguageContext";

export default function SummaryPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [stats, setStats] = useState<{ correct: number; total: number; xp: number } | null>(null);

  useEffect(() => {
    const data = sessionStorage.getItem("lastSession");
    if (data) {
      setStats(JSON.parse(data));
    } else {
      router.push("/dashboard");
    }
  }, [router]);

  if (!stats) return <div className="container flex-center"><h2>{t.summary.loading}</h2></div>;

  const accuracy = Math.round((stats.correct / stats.total) * 100) || 0;

  return (
    <div className="container flex-center animate-fade-in" style={{ minHeight: "80vh" }}>
      <div className="card" style={{ maxWidth: "500px", width: "100%", textAlign: "center", padding: "3rem 2rem" }}>
        
        <FaTrophy size={64} className="text-warning" style={{ margin: "0 auto 1.5rem" }} />
        
        <h1 style={{ fontSize: "2.5rem", fontWeight: "800", marginBottom: "0.5rem" }}>{t.summary.title}</h1>
        <p className="text-muted" style={{ fontSize: "1.25rem", marginBottom: "2.5rem" }}>{t.summary.subtitle}</p>

        <div className="flex flex-col gap-4" style={{ textAlign: "left" }}>
          <div style={{ background: "rgba(16, 185, 129, 0.1)", padding: "1rem", borderRadius: "var(--radius-md)", display: "flex", alignItems: "center", gap: "1rem" }}>
            <FaCheckCircle size={32} className="text-success" />
            <div>
              <p className="text-muted" style={{ fontSize: "0.875rem" }}>{t.summary.correct}</p>
              <p style={{ fontSize: "1.5rem", fontWeight: "700" }}>{stats.correct}</p>
            </div>
          </div>
          
          <div style={{ background: "rgba(239, 68, 68, 0.1)", padding: "1rem", borderRadius: "var(--radius-md)", display: "flex", alignItems: "center", gap: "1rem" }}>
            <FaTimesCircle size={32} className="text-danger" />
            <div>
              <p className="text-muted" style={{ fontSize: "0.875rem" }}>{t.summary.incorrect}</p>
              <p style={{ fontSize: "1.5rem", fontWeight: "700" }}>{stats.total - stats.correct}</p>
            </div>
          </div>
          
          <div style={{ background: "rgba(59, 130, 246, 0.1)", padding: "1rem", borderRadius: "var(--radius-md)", display: "flex", alignItems: "center", gap: "1rem" }}>
            <FaStar size={32} className="text-primary" />
            <div>
              <p className="text-muted" style={{ fontSize: "0.875rem" }}>{t.summary.accuracy}</p>
              <p style={{ fontSize: "1.5rem", fontWeight: "700" }}>{accuracy}%</p>
            </div>
          </div>
        </div>

        <div style={{ marginTop: "2rem", padding: "1.5rem", background: "var(--color-surface)", borderRadius: "var(--radius-md)" }}>
          <p className="text-muted" style={{ marginBottom: "0.5rem" }}>{t.summary.xpGained}</p>
          <p className="text-warning" style={{ fontSize: "2rem", fontWeight: "800" }}>+{stats.xp} XP</p>
        </div>

        <button 
          className="btn btn-primary" 
          style={{ width: "100%", marginTop: "2.5rem", fontSize: "1.25rem", padding: "1rem" }}
          onClick={() => router.push("/dashboard")}
        >
          {t.summary.continueBtn}
        </button>
      </div>
    </div>
  );
}
