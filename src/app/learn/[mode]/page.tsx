"use client";

import { useState, useEffect, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import dynamic from "next/dynamic";
import { FaTimes, FaMapMarkerAlt, FaCheckCircle, FaTimesCircle, FaClock, FaFire, FaStopwatch } from "react-icons/fa";
import { useLanguage } from "@/lib/LanguageContext";

const Map = dynamic(() => import("@/components/Map"), { ssr: false });

interface Question {
  targetId: string;
  flagCode: string;
  countryName: string;
  countryNameEn: string;
  lat: number;
  lng: number;
  status?: string;
  options: { id: string; name: string; nameEn: string; isoCode: string }[];
}

function AnimatedFlameIcon({ size = 18 }: { size?: number }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 50 65" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      style={{ overflow: "visible" }}
    >
      <defs>
        <linearGradient id="flameGradOuter" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#D97706" />
          <stop offset="50%" stopColor="#EF4444" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>
        <linearGradient id="flameGradMid" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#FBBF24" />
        </linearGradient>
        <linearGradient id="flameGradCore" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#FDE047" />
          <stop offset="100%" stopColor="#FFFFFF" />
        </linearGradient>
        <style>{`
          @keyframes flameWave1 {
            0%, 100% { transform: scale(1) rotate(0deg); }
            50% { transform: scale(1.1, 0.93) rotate(-4deg); }
          }
          @keyframes flameWave2 {
            0%, 100% { transform: scale(1) rotate(0deg); }
            50% { transform: scale(0.9, 1.12) rotate(5deg); }
          }
          @keyframes flameSpark {
            0% { transform: translateY(0) scale(1); opacity: 1; }
            100% { transform: translateY(-18px) scale(0.2); opacity: 0; }
          }
          .flame-layer-back {
            animation: flameWave1 1.1s infinite ease-in-out;
            transform-origin: bottom center;
          }
          .flame-layer-front {
            animation: flameWave2 0.75s infinite ease-in-out;
            transform-origin: bottom center;
          }
          .flame-spark-1 {
            animation: flameSpark 1s infinite ease-out;
            transform-origin: center;
          }
          .flame-spark-2 {
            animation: flameSpark 0.85s infinite ease-out 0.35s;
            transform-origin: center;
          }
        `}</style>
      </defs>

      {/* Outer Flame Layer */}
      <path 
        className="flame-layer-back"
        d="M25 2 C25 2, 38 18, 38 32 C38 46, 32 58, 25 58 C18 58, 12 46, 12 32 C12 18, 25 2, 25 2 Z" 
        fill="url(#flameGradOuter)"
      />

      {/* Middle Flame Layer */}
      <path 
        className="flame-layer-front"
        d="M25 14 C25 14, 34 26, 34 36 C34 46, 30 54, 25 54 C20 54, 16 46, 16 36 C16 26, 25 14, 25 14 Z" 
        fill="url(#flameGradMid)"
      />

      {/* Core Hot Flame Layer */}
      <path 
        className="flame-layer-back"
        d="M25 28 C25 28, 30 35, 30 42 C30 48, 28 52, 25 52 C22 52, 20 48, 20 42 C20 35, 25 28, 25 28 Z" 
        fill="url(#flameGradCore)"
      />

      {/* Rising Sparks */}
      <circle className="flame-spark-1" cx="21" cy="12" r="2.5" fill="#FEF08A" />
      <circle className="flame-spark-2" cx="29" cy="8" r="2" fill="#FDE047" />
    </svg>
  );
}

export default function LearnPage({ params }: { params: Promise<{ mode: string }> }) {
  const resolvedParams = use(params);
  const mode = resolvedParams.mode;
  const searchParams = useSearchParams();
  const continent = searchParams.get("continent");
  const router = useRouter();
  const { t, lang } = useLanguage();

  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<any>(null);
  const [funFact, setFunFact] = useState<string | null>(null);

  // Session tracking & anti-repeat history
  const [questionCount, setQuestionCount] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [sessionXp, setSessionXp] = useState(0);
  const [sessionHistory, setSessionHistory] = useState<string[]>([]);

  // 10-Second Countdown Timer & Nav Toggle
  const [isTimerEnabled, setIsTimerEnabled] = useState(false);
  const [timeLeft, setTimeLeft] = useState(10);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("app-timer-enabled");
    if (saved === "true") setIsTimerEnabled(true);
  }, []);

  const toggleTimer = () => {
    const next = !isTimerEnabled;
    setIsTimerEnabled(next);
    localStorage.setItem("app-timer-enabled", String(next));
  };

  const fetchQuestion = async () => {
    if (questionCount >= 10) {
      sessionStorage.setItem("lastSession", JSON.stringify({
        total: questionCount,
        correct: correctCount,
        xp: sessionXp
      }));
      router.push("/learn/summary");
      return;
    }

    setLoading(true);
    setFeedback(null);
    setFunFact(null);
    setSelectedId(null);
    setIsSubmitting(false);
    setTimeLeft(10);

    try {
      const url = new URL("/api/game/next", window.location.origin);
      url.searchParams.set("mode", mode);
      if (continent) url.searchParams.set("continent", continent);
      if (sessionHistory.length > 0) url.searchParams.set("exclude", sessionHistory.join(","));
      
      const res = await fetch(url.toString());
      if (res.ok) {
        const data = await res.json();
        setQuestion(data);
        setSessionHistory(prev => [...prev, data.targetId]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (mode === "continents" && !continent) {
      setLoading(false);
      return;
    }
    fetchQuestion();
  }, [mode, continent]);

  // Timer interval effect (blocked immediately if timer disabled, feedback active, or answer submitting)
  useEffect(() => {
    if (!isTimerEnabled || loading || !question || feedback || selectedId !== null || isSubmitting) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSelect("TIMEOUT_FAILED");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isTimerEnabled, loading, question, feedback, selectedId, isSubmitting]);

  const handleSelect = async (id: string) => {
    if (selectedId || isSubmitting || !question) return;
    setSelectedId(id);
    setIsSubmitting(true);
    
    const isTimeout = id === "TIMEOUT_FAILED";
    const isCorrect = !isTimeout && id === question.targetId;
    
    try {
      const res = await fetch("/api/game/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ countryId: question.targetId, isCorrect, mode })
      });
      const data = await res.json();
      setFeedback({ ...data, isCorrect, isTimeout });
      
      setQuestionCount(prev => prev + 1);
      if (isCorrect) setCorrectCount(prev => prev + 1);
      setSessionXp(prev => prev + (data.xpGained || 0));

      // Fetch fun fact from Wikipedia
      try {
        const term = lang === 'en' ? question.countryNameEn : question.countryName;
        const wikiLang = lang === 'en' ? 'en' : 'es';
        const wikiRes = await fetch(`https://${wikiLang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(term)}`);
        if (wikiRes.ok) {
          const wikiData = await wikiRes.json();
          if (wikiData.extract) {
            const sentences = wikiData.extract.split(/(?<=[.!?])\s+/);
            setFunFact(sentences.slice(0, 2).join(' '));
          }
        }
      } catch (err) {
        console.error("Error fetching fun fact:", err);
      }
      
    } catch (e) {
      console.error(e);
    }
  };

  if ((mode === "continents" || mode === "spatial") && !continent) {
    const categories = [
      { id: "Mundo", name: "Mundo", nameEn: "World", icon: "🌍", color: "rgba(16, 185, 129, 0.12)", border: "rgba(16, 185, 129, 0.5)" },
      { id: "África", name: "África", nameEn: "Africa", icon: "🌍" },
      { id: "Asia", name: "Asia", nameEn: "Asia", icon: "🌏" },
      { id: "Europa", name: "Europa", nameEn: "Europe", icon: "🌍" },
      { id: "América del Norte", name: "América del Norte", nameEn: "North America", icon: "🌎" },
      { id: "América del Sur", name: "América del Sur", nameEn: "South America", icon: "🌎" },
      { id: "Oceanía", name: "Oceanía", nameEn: "Oceania", icon: "🌏" },
      { id: "Islas", name: "Islas", nameEn: "Islands", icon: "🏝️", color: "rgba(14, 165, 233, 0.12)", border: "rgba(14, 165, 233, 0.5)" },
    ];

    return (
      <div className="container animate-fade-in" style={{ padding: "1.5rem 1rem", maxWidth: "800px" }}>
        <button onClick={() => router.push("/dashboard")} className="btn btn-outline" style={{ marginBottom: "1.5rem" }}>
          {lang === 'en' ? "← Back" : "← Volver"}
        </button>
        <h1 className="text-center" style={{ marginBottom: "1.5rem", fontSize: "1.75rem", fontWeight: "800" }}>
          {lang === 'en' ? "Choose a Region or Category" : "Elige una Región o Categoría"}
        </h1>
        
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "1rem" }}>
          {categories.map(c => {
            const label = lang === 'en' ? c.nameEn : c.name;
            return (
              <button 
                key={c.id} 
                onClick={() => router.push(`/learn/${mode}?continent=${encodeURIComponent(c.id)}`)} 
                className="card hover-scale" 
                style={{ 
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "1.25rem 0.5rem", 
                  textAlign: "center", 
                  fontSize: "0.95rem", 
                  fontWeight: "700", 
                  color: "var(--color-text)", 
                  cursor: "pointer", 
                  border: `1px solid ${c.border || "rgba(255,255,255,0.1)"}`,
                  background: c.color || "var(--color-surface)",
                  borderRadius: "var(--radius-md)",
                  gap: "0.5rem"
                }}
              >
                <span style={{ fontSize: "2rem" }}>{c.icon}</span>
                <span style={{ wordBreak: "break-word", lineHeight: "1.2" }}>{label}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="container flex justify-center items-center" style={{ minHeight: "80vh" }}><div className="animate-pulse" style={{ fontSize: "2rem" }}>Cargando...</div></div>;
  }

  if (!question) {
    return (
      <div className="container text-center" style={{ padding: "4rem 1rem" }}>
        <h2>No hay más preguntas disponibles</h2>
        <button onClick={() => router.push("/dashboard")} className="btn btn-primary" style={{ marginTop: "2rem" }}>Volver al Inicio</button>
      </div>
    );
  }

  const isMastered = question.status === "Dominado";

  return (
    <div className="container" style={{ maxWidth: "800px", padding: "1rem", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      
      {/* Quiz Header */}
      <header className="flex justify-between items-center" style={{ padding: "0.75rem 0", marginBottom: "1.5rem" }}>
        <button onClick={() => router.push("/dashboard")} style={{ fontSize: "1.5rem", color: "var(--color-text-muted)", background: "none", border: "none", cursor: "pointer" }}>
          <FaTimes />
        </button>

        {/* Progress Bar */}
        <div style={{ flex: 1, margin: "0 1.5rem", height: "10px", background: "rgba(255,255,255,0.1)", borderRadius: "var(--radius-full)", overflow: "hidden" }}>
          <div style={{ width: `${(questionCount / 10) * 100}%`, height: "100%", background: "var(--color-primary)", borderRadius: "var(--radius-full)", transition: "width 0.3s ease-in-out" }}></div>
        </div>

        {/* Countdown Timer Toggle Button */}
        <button
          onClick={toggleTimer}
          title={isTimerEnabled ? (t.dashboard.timerOn || "Temporizador Activado (10s)") : (t.dashboard.timerOff || "Temporizador Desactivado")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
            fontSize: "0.95rem",
            fontWeight: "800",
            color: isTimerEnabled ? (timeLeft <= 3 ? "#EF4444" : "#F59E0B") : "var(--color-text-muted)",
            background: isTimerEnabled ? "rgba(245,158,11,0.12)" : "rgba(255,255,255,0.06)",
            padding: "0.3rem 0.75rem",
            borderRadius: "20px",
            border: `1px solid ${isTimerEnabled ? (timeLeft <= 3 ? "rgba(239,68,68,0.4)" : "rgba(245,158,11,0.3)") : "rgba(255,255,255,0.08)"}`,
            cursor: "pointer",
            transition: "all 0.2s"
          }}
        >
          <FaStopwatch size={14} style={{ opacity: isTimerEnabled ? 1 : 0.4 }} className={isTimerEnabled && timeLeft <= 3 ? "animate-pulse" : ""} />
          <span>{isTimerEnabled ? `${timeLeft}s` : "OFF"}</span>
        </button>
      </header>

      <main style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: "700", marginBottom: "1.5rem", textAlign: "center" }}>
          {mode === "spatial" ? t.quiz.spatialQ : t.quiz.flagQ}
        </h2>
        
        {/* Question Container / Flag Display */}
        <div style={{ 
          position: "relative", 
          width: "100%", 
          maxWidth: "400px", 
          minHeight: "200px",
          marginBottom: "2.5rem", 
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          ...(mode === "spatial" ? {
            aspectRatio: "3/2", 
            borderRadius: "var(--radius-md)", 
            overflow: "hidden", 
            boxShadow: "var(--shadow-lg)", 
            border: "2px solid rgba(255,255,255,0.1)"
          } : {})
        }}>
          
          {/* Flaming Flag Badge for Mastered Countries */}
          {isMastered && (
            <div style={{ 
              position: "absolute", 
              top: "-18px", 
              right: "-14px", 
              zIndex: 10,
              filter: "drop-shadow(0 4px 10px rgba(239,68,68,0.7))"
            }}>
              <AnimatedFlameIcon size={38} />
            </div>
          )}

          {mode === "spatial" ? (
             <Map lat={question.lat} lng={question.lng} name="?" />
          ) : (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img 
              src={`https://flagcdn.com/w640/${question.flagCode.toLowerCase()}.png`} 
              alt="Bandera" 
              style={{ 
                maxHeight: "240px", 
                maxWidth: "100%", 
                objectFit: "contain",
                borderRadius: "var(--radius-sm)",
                boxShadow: "var(--shadow-lg)",
                border: "1px solid rgba(255,255,255,0.1)"
              }}
            />
          )}
        </div>

        {/* Option Buttons */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", width: "100%" }}>
          {question.options.map(opt => {
            const isSelected = selectedId === opt.id;
            const isTarget = opt.id === question.targetId;
            let bgColor = "var(--color-surface)";
            let borderColor = "rgba(255,255,255,0.05)";
            
            if (feedback) {
              if (isTarget) {
                bgColor = "rgba(16, 185, 129, 0.2)";
                borderColor = "var(--color-success)";
              } else if (isSelected && !isTarget) {
                bgColor = "rgba(239, 68, 68, 0.2)";
                borderColor = "var(--color-danger)";
              }
            } else if (isSelected) {
              borderColor = "var(--color-primary)";
            }

            return (
              <button 
                key={opt.id}
                onClick={() => handleSelect(opt.id)}
                disabled={!!feedback}
                style={{
                  padding: "1rem",
                  borderRadius: "var(--radius-md)",
                  background: bgColor,
                  border: `2px solid ${borderColor}`,
                  fontSize: "1rem",
                  fontWeight: "600",
                  color: "var(--color-text)",
                  transition: "all var(--transition-fast)",
                  cursor: feedback ? "default" : "pointer"
                }}
              >
                {lang === 'en' ? opt.nameEn : opt.name}
              </button>
            );
          })}
        </div>
      </main>

      {/* Feedback Footer Modal (with Fix for Spatial Mode Text Overlay) */}
      {feedback && (
        <div className="animate-fade-in" style={{
          position: "fixed", bottom: 0, left: 0, right: 0, 
          padding: "1.75rem",
          background: "#0d1117",
          borderTop: `4px solid ${feedback.isCorrect ? "var(--color-success)" : "var(--color-danger)"}`,
          boxShadow: "0 -10px 40px rgba(0,0,0,0.8)",
          zIndex: 100,
          maxHeight: "100vh",
          overflowY: "auto"
        }}>
          <div className="container flex md-flex-col md-items-center md-text-center justify-between items-start gap-6" style={{ maxWidth: "1000px" }}>
            <div className="flex md-flex-col md-items-center gap-4" style={{ flex: 1 }}>
              <div style={{ color: feedback.isCorrect ? "var(--color-success)" : "var(--color-danger)", fontSize: "2.5rem", flexShrink: 0 }}>
                {feedback.isCorrect ? <FaCheckCircle /> : <FaTimesCircle />}
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: "1.75rem", fontWeight: "800", color: feedback.isCorrect ? "var(--color-success)" : "var(--color-danger)" }}>
                  {feedback.isTimeout ? "¡Tiempo agotado!" : feedback.isCorrect ? t.quiz.correct : t.quiz.incorrect}
                </h3>
                <p style={{ fontSize: "1.25rem", color: "var(--color-text)", margin: "0.5rem 0" }}>
                  <strong>{lang === 'en' ? (feedback.country?.nameEn || question.countryNameEn) : (feedback.country?.name || question.countryName)}</strong>
                </p>
                <p className="text-muted" style={{ margin: "0.2rem 0" }}>{t.quiz.capital} {lang === 'en' ? (feedback.country?.capitalEn || "") : (feedback.country?.capital || "")}</p>
                <p className="text-muted" style={{ margin: "0.2rem 0" }}>{t.quiz.continent} {lang === 'en' ? (feedback.country?.continentEn || "") : (feedback.country?.continent || "")}</p>
                
                {feedback.xpGained > 0 ? (
                  <p className="text-muted font-bold mt-2" style={{ color: "var(--color-warning)", margin: "0.4rem 0 0" }}>+{feedback.xpGained} XP</p>
                ) : (
                  <p className="text-muted font-bold mt-2" style={{ color: "var(--color-text-muted)", margin: "0.4rem 0 0" }}>0 XP (Bandera Dominada)</p>
                )}

                {feedback.country?.id && ["SJM", "PRI", "GRL", "MAC", "PYF", "NCL", "GUF", "HKG", "BMU", "CYM"].includes(feedback.country.id) && (
                  <div style={{ marginTop: "0.5rem", padding: "0.5rem", background: "rgba(245, 158, 11, 0.1)", borderLeft: "3px solid var(--color-warning)", borderRadius: "0 var(--radius-sm) var(--radius-sm) 0" }}>
                    <p style={{ color: "var(--color-warning)", fontSize: "0.875rem", margin: 0, fontWeight: "600" }}>
                      {lang === 'en' 
                        ? "Extra Challenge: This is an overseas territory or autonomous dependency."
                        : "Reto Extra: Este es un territorio de ultramar o dependencia autónoma."}
                    </p>
                  </div>
                )}
                
                {funFact && (
                  <div className="animate-fade-in" style={{ marginTop: "0.75rem", padding: "0.75rem", background: "rgba(255,255,255,0.05)", borderRadius: "var(--radius-md)", border: "1px solid rgba(255,255,255,0.1)" }}>
                    <p style={{ fontSize: "0.75rem", fontWeight: "bold", color: "var(--color-primary)", marginBottom: "0.25rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      {lang === 'en' ? "💡 Did you know?" : "💡 ¿Sabías que...?"}
                    </p>
                    <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", lineHeight: "1.4", margin: 0 }}>
                      {funFact}
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            {mode === "spatial" ? (
              <div style={{ width: "200px", height: "140px", borderRadius: "var(--radius-md)", overflow: "hidden", display: "flex", justifyContent: "center", alignItems: "center" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`https://flagcdn.com/w320/${(feedback.country?.isoCode || question.flagCode).toLowerCase()}.png`} alt="Flag" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", borderRadius: "var(--radius-sm)", boxShadow: "var(--shadow-md)" }} />
              </div>
            ) : (
              <div style={{ width: "280px", height: "140px", borderRadius: "var(--radius-md)", overflow: "hidden", border: "2px solid rgba(255,255,255,0.1)" }}>
                 <Map lat={feedback.country?.lat || question.lat} lng={feedback.country?.lng || question.lng} name={lang === 'en' ? (feedback.country?.nameEn || question.countryNameEn) : (feedback.country?.name || question.countryName)} />
              </div>
            )}

            <div className="md-w-full md-h-auto" style={{ display: "flex", flexDirection: "column", justifyContent: "center", height: "140px" }}>
              <button onClick={fetchQuestion} className="btn md-w-full" style={{ 
                background: feedback.isCorrect ? "var(--color-success)" : "var(--color-danger)",
                color: "white", fontSize: "1.25rem", padding: "1rem 2.5rem", borderRadius: "var(--radius-full)",
                boxShadow: "0 4px 14px rgba(0,0,0,0.25)"
              }}>
                {t.quiz.continueBtn}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
