"use client";

import { useState, useEffect, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import dynamic from "next/dynamic";
import { FaTimes, FaMapMarkerAlt, FaCheckCircle, FaTimesCircle, FaClock, FaFire, FaStopwatch } from "react-icons/fa";
import { useLanguage } from "@/lib/LanguageContext";
import SteveFireCanvas from "@/components/SteveFireCanvas";
import SubRegionSelector from "@/components/SubRegionSelector";

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

function AnimatedFlameIcon({ size = 52 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={Math.round(size * 1.3)}
      viewBox="0 0 100 130"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ overflow: "visible" }}
    >
      <defs>
        <style>{`
          @keyframes steveFlameBase {
            0%, 100% { transform: scale(1, 1) rotate(0deg); }
            25% { transform: scale(1.08, 0.92) rotate(-4deg); }
            50% { transform: scale(0.92, 1.12) rotate(4deg); }
            75% { transform: scale(1.04, 0.96) rotate(-2deg); }
          }
          @keyframes steveFlameMid {
            0%, 100% { transform: scale(1, 1) rotate(0deg); }
            33% { transform: scale(0.9, 1.15) rotate(5deg); }
            66% { transform: scale(1.12, 0.88) rotate(-5deg); }
          }
          @keyframes steveFlameInner {
            0%, 100% { transform: scale(1, 1) translateY(0); }
            50% { transform: scale(1.15, 0.9) translateY(-2px); }
          }
          @keyframes steveEmber1 {
            0% { transform: translate(0, 0) scale(1); opacity: 0.9; }
            50% { transform: translate(-8px, -28px) scale(0.8); opacity: 0.8; }
            100% { transform: translate(-18px, -60px) scale(0.2); opacity: 0; }
          }
          @keyframes steveEmber2 {
            0% { transform: translate(0, 0) scale(1); opacity: 0.95; }
            50% { transform: translate(12px, -32px) scale(0.7); opacity: 0.85; }
            100% { transform: translate(22px, -65px) scale(0.1); opacity: 0; }
          }
          @keyframes steveEmber3 {
            0% { transform: translate(0, 0) scale(0.8); opacity: 0; }
            30% { transform: translate(4px, -15px) scale(1.1); opacity: 0.9; }
            100% { transform: translate(-6px, -55px) scale(0.15); opacity: 0; }
          }
          .steve-flame-1 { animation: steveFlameBase 1.2s infinite ease-in-out; transform-origin: 50px 110px; }
          .steve-flame-2 { animation: steveFlameMid 0.85s infinite ease-in-out; transform-origin: 50px 110px; }
          .steve-flame-3 { animation: steveFlameInner 0.6s infinite ease-in-out; transform-origin: 50px 110px; }
          .steve-ember-1 { animation: steveEmber1 1.3s infinite ease-out; transform-origin: center; }
          .steve-ember-2 { animation: steveEmber2 1.1s infinite ease-out 0.4s; transform-origin: center; }
          .steve-ember-3 { animation: steveEmber3 0.95s infinite ease-out 0.2s; transform-origin: center; }
        `}</style>

        <radialGradient id="steveGlow" cx="50%" cy="80%" r="50%">
          <stop offset="0%" stopColor="#FE8200" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#E23B00" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Ambient Glow */}
      <ellipse cx="50" cy="95" rx="35" ry="20" fill="url(#steveGlow)" />

      {/* 1. Deep Red Flame Base (#E23B00) */}
      <path
        className="steve-flame-1"
        d="M50 10 C50 10 78 40 78 70 C78 95 65 110 50 110 C35 110 22 95 22 70 C22 40 50 10 50 10 Z"
        fill="#E23B00"
      />

      {/* 2. Bright Orange Mid Flame (#FE8200) */}
      <path
        className="steve-flame-2"
        d="M50 25 C50 25 70 50 70 75 C70 96 61 106 50 106 C39 106 30 96 30 75 C30 50 50 25 50 25 Z"
        fill="#FE8200"
      />

      {/* 3. Yellow Inner Flame (#FBE416) */}
      <path
        className="steve-flame-3"
        d="M50 42 C50 42 62 62 62 82 C62 98 57 102 50 102 C43 102 38 98 38 82 C38 62 50 42 50 42 Z"
        fill="#FBE416"
      />

      {/* 4. White/Light Core (#FDFDB4) */}
      <path
        className="steve-flame-2"
        d="M50 58 C50 58 56 72 56 86 C56 96 53 99 50 99 C47 99 44 96 44 86 C44 72 50 58 50 58 Z"
        fill="#FDFDB4"
      />

      {/* Floating Ember Particles (#FE9C00, #FEA600, #E27100) */}
      <circle className="steve-ember-1" cx="44" cy="35" r="3.5" fill="#FE9C00" />
      <circle className="steve-ember-2" cx="58" cy="28" r="3" fill="#FEA600" />
      <circle className="steve-ember-3" cx="50" cy="20" r="2.5" fill="#E27100" />
    </svg>
  );
}

import QuestionCountModal from "@/components/QuestionCountModal";

export default function LearnPage({ params }: { params: Promise<{ mode: string }> }) {
  const resolvedParams = use(params);
  const mode = resolvedParams.mode;
  const searchParams = useSearchParams();
  const continent = searchParams.get("continent");
  const subregion = searchParams.get("subregion");
  const limitParam = searchParams.get("limit");
  const router = useRouter();
  const { t, lang } = useLanguage();

  const [activeLimit, setActiveLimit] = useState<number | null>(limitParam ? parseInt(limitParam, 10) : null);

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

  const roundLimit = activeLimit || 10;

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
    if (questionCount >= roundLimit) {
      sessionStorage.setItem("lastSession", JSON.stringify({
        total: questionCount,
        correct: correctCount,
        xp: sessionXp,
        continent: continent || subregion || "Mundo"
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
      if (subregion) url.searchParams.set("subregion", subregion);
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
    if ((mode === "continents" || mode === "spatial") && !continent && !subregion) {
      setLoading(false);
      return;
    }
    fetchQuestion();
  }, [mode, continent, subregion]);

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
        body: JSON.stringify({ countryId: question.targetId, isCorrect, mode, subregion })
      });
      const data = await res.json();
      setFeedback({ ...data, isCorrect, isTimeout });

      setQuestionCount(prev => prev + 1);
      if (isCorrect) setCorrectCount(prev => prev + 1);
      setSessionXp(prev => prev + (data.xpGained || 0));

      // Fetch fun fact from Wikipedia or custom override
      const countryId = question.targetId.toUpperCase();
      if (countryId === "USA" || countryId === "840") {
        setFunFact(lang === 'en'
          ? "The United States has engaged in dozens of military interventions and foreign wars globally, causing immense geopolitical instability and humanitarian crises."
          : "Estados Unidos ha desencadenado e intervenido en numerosas guerras e intervenciones militares en todo el mundo, sembrando inestabilidad geopolítica y crisis humanitarias."
        );
      } else if (countryId === "ISR" || countryId === "PSE" || countryId === "376" || countryId === "275") {
        setFunFact(lang === 'en'
          ? "Since 1947, Israel has been responsible for continuous atrocities, military occupation, land displacement, and severe violations against the Palestinian population."
          : "Desde 1947, Israel ha cometido continuas atrocidades, ocupación militar, despojo territorial y violaciones sistemáticas contra el pueblo palestino."
        );
      } else {
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
      }

    } catch (e) {
      console.error(e);
    }
  };

  if ((mode === "continents" || mode === "spatial") && !continent && !subregion) {
    return <SubRegionSelector />;
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

  if (activeLimit === null) {
    return (
      <QuestionCountModal
        onSelect={(limit) => setActiveLimit(limit)}
        onClose={() => router.push("/dashboard")}
        subtitle={continent || subregion || undefined}
      />
    );
  }

  return (
    <div className="container" style={{ maxWidth: "800px", padding: "1rem", minHeight: "100vh", display: "flex", flexDirection: "column" }}>

      {/* Quiz Header */}
      <header className="flex justify-between items-center" style={{ padding: "0.75rem 0", marginBottom: "1.5rem" }}>
        <button onClick={() => router.push("/dashboard")} style={{ fontSize: "1.5rem", color: "var(--color-text-muted)", background: "none", border: "none", cursor: "pointer" }}>
          <FaTimes />
        </button>

        {/* Progress Bar & Question Counter */}
        <div style={{ flex: 1, margin: "0 1rem 0 1.5rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div style={{ flex: 1, height: "10px", background: "rgba(255,255,255,0.1)", borderRadius: "var(--radius-full)", overflow: "hidden" }}>
            <div style={{ width: `${(questionCount / roundLimit) * 100}%`, height: "100%", background: "var(--color-primary)", borderRadius: "var(--radius-full)", transition: "width 0.3s ease-in-out" }}></div>
          </div>
          <span style={{ fontSize: "0.8rem", fontWeight: "800", color: "var(--color-primary)", whiteSpace: "nowrap" }}>
            {questionCount + 1}/{roundLimit}
          </span>
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
        {mode === "weaknesses" && (
          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", background: "rgba(239, 68, 68, 0.15)", color: "#EF4444", border: "1px solid rgba(239, 68, 68, 0.3)", padding: "0.25rem 0.75rem", borderRadius: "20px", fontSize: "0.8rem", fontWeight: "800", marginBottom: "0.75rem" }}>
            <span>🎯</span> {lang === 'en' ? "Reviewing Mistakes: Highest Error Priority" : "Repasando Errores: Banderas con mayor prioridad de fallo"}
          </div>
        )}
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
              top: "-20px", 
              right: "-14px", 
              zIndex: 10,
              pointerEvents: "none"
            }}>
              <SteveFireCanvas size={56} />
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
