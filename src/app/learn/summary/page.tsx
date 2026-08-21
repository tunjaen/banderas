"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FaTrophy, FaCheckCircle, FaTimesCircle, FaStar } from "react-icons/fa";
import { useLanguage } from "@/lib/LanguageContext";

export default function SummaryPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [stats, setStats] = useState<{ correct: number; total: number; xp: number } | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    const data = sessionStorage.getItem("lastSession");
    if (data) {
      const parsed = JSON.parse(data);
      setStats(parsed);
      
      // If 10 out of 10 (perfect score), trigger victory effects
      if (parsed.correct === parsed.total && parsed.total > 0) {
        setShowConfetti(true);
        playVictorySound();
      }
    } else {
      router.push("/dashboard");
    }
  }, [router]);

  const playVictorySound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 fanfare
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.5);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.12);
        osc.stop(ctx.currentTime + i * 0.12 + 0.5);
      });
    } catch (e) {
      console.error("Audio error:", e);
    }
  };

  if (!stats) return <div className="container flex-center"><h2>{t.summary.loading}</h2></div>;

  const accuracy = Math.round((stats.correct / stats.total) * 100) || 0;
  const isPerfect = stats.correct === stats.total && stats.total > 0;
  const isIslas = stats.continent === "Islas";

  return (
    <div className="container flex-center animate-fade-in" style={{ minHeight: "80vh", position: "relative" }}>
      
      {/* Visual Confetti / Pirate Emoji Rain Effect for 10/10 */}
      {showConfetti && (
        <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 99, overflow: "hidden" }}>
          {isIslas ? (
            Array.from({ length: 45 }).map((_, i) => {
              const left = Math.random() * 100;
              const delay = Math.random() * 2.5;
              const duration = 2.5 + Math.random() * 2.5;
              const pirateEmoji = ["🏴‍☠️", "🪙", "💎", "🏝️", "🦜", "⛵", "⚓"][i % 7];
              return (
                <div 
                  key={i}
                  style={{
                    position: "absolute",
                    top: "-40px",
                    left: `${left}%`,
                    fontSize: `${1.5 + Math.random() * 1.5}rem`,
                    opacity: 0.95,
                    animation: `pirate-rain ${duration}s linear ${delay}s infinite`
                  }}
                >
                  {pirateEmoji}
                </div>
              );
            })
          ) : (
            Array.from({ length: 50 }).map((_, i) => {
              const left = Math.random() * 100;
              const delay = Math.random() * 3;
              const duration = 2 + Math.random() * 3;
              const bg = ["#F59E0B", "#10B981", "#3B82F6", "#EF4444", "#A855F7"][i % 5];
              return (
                <div 
                  key={i}
                  style={{
                    position: "absolute",
                    top: "-20px",
                    left: `${left}%`,
                    width: "10px",
                    height: "14px",
                    background: bg,
                    borderRadius: "2px",
                    opacity: 0.9,
                    transform: `rotate(${Math.random() * 360}deg)`,
                    animation: `confetti-fall ${duration}s linear ${delay}s infinite`
                  }}
                />
              );
            })
          )}
          <style jsx>{`
            @keyframes confetti-fall {
              0% { transform: translateY(0) rotate(0deg); opacity: 1; }
              100% { transform: translateY(105vh) rotate(720deg); opacity: 0; }
            }
            @keyframes pirate-rain {
              0% { transform: translateY(0) rotate(0deg); opacity: 1; }
              100% { transform: translateY(105vh) rotate(360deg); opacity: 0.2; }
            }
          `}</style>
        </div>
      )}

      <div className="card" style={{ maxWidth: "500px", width: "100%", textAlign: "center", padding: "3rem 2rem", border: isPerfect ? "2px solid #F59E0B" : "1px solid rgba(255,255,255,0.1)", boxShadow: isPerfect ? "0 0 40px rgba(245, 158, 11, 0.3)" : "none" }}>
        
        {isPerfect ? (
          <div style={{ marginBottom: "1rem" }}>
            <span style={{ fontSize: "4rem" }}>🎉</span>
            <div style={{ color: "#F59E0B", fontWeight: "900", fontSize: "1.25rem", marginTop: "0.5rem" }}>
              ¡RONDA PERFECTA 10/10!
            </div>
          </div>
        ) : (
          <FaTrophy size={64} className="text-warning" style={{ margin: "0 auto 1.5rem" }} />
        )}
        
        <h1 style={{ fontSize: "2.25rem", fontWeight: "800", marginBottom: "0.5rem" }}>{t.summary.title}</h1>
        <p className="text-muted" style={{ fontSize: "1.1rem", marginBottom: "2rem" }}>
          {isPerfect ? "¡Has acertado absolutamente todas las banderas de la ronda!" : t.summary.subtitle}
        </p>

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

        <div style={{ marginTop: "2rem", padding: "1.25rem", background: "var(--color-surface)", borderRadius: "var(--radius-md)" }}>
          <p className="text-muted" style={{ marginBottom: "0.25rem" }}>{t.summary.xpGained}</p>
          <p className="text-warning" style={{ fontSize: "2rem", fontWeight: "800" }}>+{stats.xp} XP</p>
        </div>

        <button 
          className="btn btn-primary" 
          style={{ width: "100%", marginTop: "2rem", fontSize: "1.25rem", padding: "1rem" }}
          onClick={() => router.push("/dashboard")}
        >
          {t.summary.continueBtn}
        </button>
      </div>
    </div>
  );
}
