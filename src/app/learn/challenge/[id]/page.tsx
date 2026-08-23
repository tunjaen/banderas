"use client";

import { useState, useEffect, use } from "react";
import { useLanguage } from "@/lib/LanguageContext";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import { FaClock, FaCheck, FaTimes, FaTrophy, FaArrowRight, FaBolt, FaRunning } from "react-icons/fa";
import SwordsIcon from "@/components/SwordsIcon";

export default function ChallengePlayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { lang } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [challenge, setChallenge] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const [selectedOption, setSelectedOption] = useState<any>(null);
  const [score, setScore] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(10);

  const [isGameOver, setIsGameOver] = useState(false);
  const [gameResult, setGameResult] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  // Domination Tracking: { [countryId]: hitsCount }
  const [countryHits, setCountryHits] = useState<{ [id: string]: number }>({});
  const [dominatedBanner, setDominatedBanner] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/challenges/${id}`)
      .then(res => res.json())
      .then(data => {
        if (data.challenge && data.questions) {
          setChallenge(data.challenge);
          setQuestions(data.questions);
          setStartTime(Date.now());
        }
        setLoading(false);
      })
      .catch(e => {
        console.error(e);
        setLoading(false);
      });
  }, [id]);

  // 10s Timer for LIGHTNING mode per question
  useEffect(() => {
    if (loading || isGameOver || !challenge || challenge.gameMode !== "LIGHTNING" || selectedOption !== null) {
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleTimeOut();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [loading, isGameOver, currentIndex, selectedOption, challenge]);

  const handleTimeOut = () => {
    if (selectedOption !== null) return;
    // Mark as wrong answer on timeout
    setSelectedOption({ id: "TIMEOUT_WRONG" });
    setTimeout(() => {
      nextQuestion(score);
    }, 1200);
  };

  const handleSelectOption = (opt: any) => {
    if (selectedOption !== null) return;
    setSelectedOption(opt);

    const currentCountry = questions[currentIndex].country;
    const isCorrect = opt.id === currentCountry.id;
    const newScore = isCorrect ? score + 1 : score;
    if (isCorrect) setScore(newScore);

    // Domination tracking: 3 correct answers required to dominate a country
    if (isCorrect && (challenge?.gameMode === "DOMINATION" || challenge?.gameMode === "MARATHON")) {
      const prevHits = countryHits[currentCountry.id] || 0;
      const newHits = prevHits + 1;
      setCountryHits(prev => ({ ...prev, [currentCountry.id]: newHits }));

      if (newHits === 3) {
        setDominatedBanner(`👑 ¡PAÍS DOMINADO! ${lang === 'en' ? currentCountry.nameEn : currentCountry.name} (3/3 aciertos)`);
        setTimeout(() => setDominatedBanner(null), 3000);
      }
    }

    setTimeout(() => {
      nextQuestion(newScore);
    }, 1200);
  };

  const nextQuestion = (currentScore: number) => {
    setSelectedOption(null);
    setTimeLeft(10);

    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(prev => prev + 1);
    } else {
      finishGame(currentScore);
    }
  };

  const finishGame = async (finalScore: number) => {
    setIsGameOver(true);
    setSubmitting(true);

    const elapsedMs = startTime ? Date.now() - startTime : 15000;

    try {
      const res = await fetch(`/api/challenges/${id}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          score: finalScore,
          timeMs: elapsedMs
        })
      });

      if (res.ok) {
        const data = await res.json();
        setGameResult(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <Navbar />
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
          <div style={{ textAlign: "center", color: "var(--color-text-muted)" }}>
            <SwordsIcon size={36} className="animate-bounce" style={{ marginBottom: "1rem", color: "var(--color-primary)" }} />
            <p style={{ fontWeight: "700" }}>Preparando terreno del duelo...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!challenge || questions.length === 0) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <Navbar />
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
          <div className="card" style={{ maxWidth: "400px", padding: "2rem", textAlign: "center" }}>
            <h2>Reto no disponible</h2>
            <p className="text-muted" style={{ marginBottom: "1.5rem" }}>Este duelo no existe o ha sido cancelado.</p>
            <Link href="/dashboard" className="btn btn-primary" style={{ width: "100%" }}>Volver al Inicio</Link>
          </div>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const targetCountry = currentQ?.country;
  const options = currentQ?.options || [];

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Navbar />

      <div className="container animate-fade-in" style={{ maxWidth: "680px", margin: "0 auto", padding: "1.5rem 1rem", flex: 1 }}>
        
        {!isGameOver ? (
          <>
            {/* Dominated Popup Notification */}
            {dominatedBanner && (
              <div className="animate-fade-in" style={{ padding: "0.85rem 1.25rem", background: "linear-gradient(135deg, rgba(245, 158, 11, 0.25), rgba(16, 185, 129, 0.25))", border: "2px solid #F59E0B", color: "#FFF", borderRadius: "14px", fontWeight: "900", textAlign: "center", fontSize: "1rem", marginBottom: "1rem", boxShadow: "0 8px 25px rgba(245, 158, 11, 0.3)" }}>
                {dominatedBanner}
              </div>
            )}

            {/* Challenge Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255,255,255,0.03)", padding: "1rem 1.25rem", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.06)", marginBottom: "1.5rem" }}>
              <div>
                <div style={{ fontSize: "0.75rem", fontWeight: "800", color: "#F59E0B", textTransform: "uppercase", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <SwordsIcon /> Duelo 1v1 • {challenge.gameMode === "LIGHTNING" ? "Relámpago (10s)" : "Dominación"}
                </div>
                <div style={{ fontWeight: "800", fontSize: "1.05rem", color: "#fff", marginTop: "0.15rem" }}>
                  {challenge.challenger.name} ⚔️ {challenge.challenged.name}
                </div>
              </div>

              {challenge.gameMode === "LIGHTNING" && (
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", background: timeLeft <= 3 ? "rgba(239, 68, 68, 0.2)" : "rgba(245, 158, 11, 0.15)", color: timeLeft <= 3 ? "#EF4444" : "#F59E0B", border: `1px solid ${timeLeft <= 3 ? "#EF4444" : "#F59E0B"}`, padding: "0.4rem 0.8rem", borderRadius: "20px", fontWeight: "900", fontSize: "1rem" }}>
                  <FaClock /> <span>{timeLeft}s</span>
                </div>
              )}
            </div>

            {/* Question / Domination Progress Bar */}
            {challenge.gameMode === "LIGHTNING" ? (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "var(--color-text-muted)", marginBottom: "0.5rem", fontWeight: "700" }}>
                  <span>Pregunta {currentIndex + 1} de {questions.length}</span>
                  <span>Aciertos: {score}</span>
                </div>
                <div style={{ width: "100%", height: "6px", background: "rgba(255,255,255,0.08)", borderRadius: "10px", overflow: "hidden", marginBottom: "1.5rem" }}>
                  <div style={{ height: "100%", width: `${((currentIndex + 1) / questions.length) * 100}%`, background: "linear-gradient(90deg, #F59E0B, #10B981)", transition: "width 0.4s ease" }} />
                </div>
              </>
            ) : (
              <>
                {(() => {
                  const uniqueCountryCount = new Set(questions.map(q => q.country.id)).size;
                  const dominatedCount = Object.values(countryHits).filter(h => h >= 3).length;
                  const remainingToDominate = Math.max(0, uniqueCountryCount - dominatedCount);
                  const currentHitsForCountry = countryHits[targetCountry.id] || 0;

                  return (
                    <div style={{ background: "rgba(59, 130, 246, 0.08)", border: "1px solid rgba(59, 130, 246, 0.2)", padding: "0.85rem 1rem", borderRadius: "12px", marginBottom: "1.5rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", fontWeight: "800", color: "#60A5FA", marginBottom: "0.4rem" }}>
                        <span>👑 Países Dominados (3/3): {dominatedCount} de {uniqueCountryCount}</span>
                        <span>Quedan {remainingToDominate} por dominar</span>
                      </div>
                      <div style={{ width: "100%", height: "8px", background: "rgba(255,255,255,0.08)", borderRadius: "10px", overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${(dominatedCount / Math.max(1, uniqueCountryCount)) * 100}%`, background: "linear-gradient(90deg, #3B82F6, #10B981)", transition: "width 0.4s ease" }} />
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "0.4rem", display: "flex", justifyContent: "space-between" }}>
                        <span>Progreso de esta bandera: {currentHitsForCountry}/3 aciertos</span>
                        <span>Pregunta {currentIndex + 1} de {questions.length}</span>
                      </div>
                    </div>
                  );
                })()}
              </>
            )}

            {/* Flag Image Card */}
            <div className="card" style={{ padding: "2rem 1.5rem", textAlign: "center", background: "var(--color-surface)", borderRadius: "16px", marginBottom: "1.5rem", border: "1px solid rgba(255,255,255,0.08)" }}>
              <img 
                src={`https://flagcdn.com/w640/${targetCountry.isoCode.toLowerCase()}.png`}
                alt="Flag"
                style={{ maxHeight: "190px", maxWidth: "100%", borderRadius: "8px", boxShadow: "0 8px 24px rgba(0,0,0,0.5)" }}
              />
            </div>

            {/* Answer Options */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.85rem" }}>
              {options.map((opt: any) => {
                const isSelected = selectedOption?.id === opt.id;
                const isCorrect = opt.id === targetCountry.id;
                let bg = "rgba(255,255,255,0.04)";
                let border = "rgba(255,255,255,0.08)";

                if (selectedOption !== null) {
                  if (isCorrect) {
                    bg = "rgba(16, 185, 129, 0.2)";
                    border = "#10B981";
                  } else if (isSelected) {
                    bg = "rgba(239, 68, 68, 0.2)";
                    border = "#EF4444";
                  }
                }

                return (
                  <button
                    key={opt.id}
                    onClick={() => handleSelectOption(opt)}
                    disabled={selectedOption !== null}
                    style={{
                      padding: "1rem",
                      borderRadius: "12px",
                      background: bg,
                      border: `1.5px solid ${border}`,
                      color: "#fff",
                      fontWeight: "700",
                      fontSize: "0.95rem",
                      cursor: selectedOption !== null ? "default" : "pointer",
                      textAlign: "center",
                      transition: "all 0.2s ease-in-out"
                    }}
                  >
                    {lang === 'en' ? opt.nameEn : opt.name}
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          /* Game Over Summary Screen */
          <div className="card animate-fade-in" style={{ padding: "2rem", textAlign: "center", background: "var(--color-surface)", borderRadius: "20px", border: "1px solid rgba(167, 244, 50, 0.3)", boxShadow: "0 20px 50px rgba(0,0,0,0.8)" }}>
            
            <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "linear-gradient(135deg, #10B981, #3B82F6)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem auto", color: "#fff", fontSize: "1.75rem", boxShadow: "0 8px 20px rgba(16, 185, 129, 0.4)" }}>
              <FaTrophy />
            </div>

            <h2 style={{ fontSize: "1.75rem", fontWeight: "900", color: "#fff", marginBottom: "0.5rem" }}>
              {submitting ? "Calculando resultados del Duelo..." : "¡Duelo Completado!"}
            </h2>

            <div style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", background: "rgba(167, 244, 50, 0.15)", color: "var(--color-primary)", padding: "0.3rem 0.8rem", borderRadius: "20px", fontWeight: "800", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
              🎉 +{gameResult?.xpAwarded || 10} XP Ganados
            </div>

            {gameResult?.isFinished ? (
              <div style={{ background: "rgba(255,255,255,0.03)", padding: "1.25rem", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.08)", marginBottom: "1.5rem" }}>
                <h3 style={{ fontSize: "1.2rem", fontWeight: "800", color: "#fff", marginBottom: "1rem" }}>
                  {gameResult.challenge.winnerId === "DRAW"
                    ? "🤝 ¡Empate Total!"
                    : gameResult.challenge.winnerId === challenge.challengerId
                      ? `🏆 Ganador: ${challenge.challenger.name}`
                      : `🏆 Ganador: ${challenge.challenged.name}`}
                </h3>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div style={{ background: "rgba(255,255,255,0.03)", padding: "0.85rem", borderRadius: "10px" }}>
                    <div style={{ fontWeight: "800", color: "#fff" }}>{challenge.challenger.name}</div>
                    <div style={{ fontSize: "1.1rem", fontWeight: "900", color: "var(--color-primary)", marginTop: "0.2rem" }}>
                      {gameResult.challenge.challengerScore} / {questions.length}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                      {Math.round((gameResult.challenge.challengerTimeMs || 0) / 1000)}s
                    </div>
                  </div>

                  <div style={{ background: "rgba(255,255,255,0.03)", padding: "0.85rem", borderRadius: "10px" }}>
                    <div style={{ fontWeight: "800", color: "#fff" }}>{challenge.challenged.name}</div>
                    <div style={{ fontSize: "1.1rem", fontWeight: "900", color: "#60A5FA", marginTop: "0.2rem" }}>
                      {gameResult.challenge.challengedScore} / {questions.length}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                      {Math.round((gameResult.challenge.challengedTimeMs || 0) / 1000)}s
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ padding: "1.25rem", background: "rgba(245, 158, 11, 0.1)", borderRadius: "14px", border: "1px solid rgba(245, 158, 11, 0.25)", color: "#F59E0B", marginBottom: "1.5rem" }}>
                <p style={{ fontWeight: "800", fontSize: "1rem", margin: 0 }}>
                  ⏳ Puntuación Guardada ({score} aciertos)
                </p>
                <p style={{ fontSize: "0.85rem", margin: "0.4rem 0 0 0", color: "rgba(255,255,255,0.8)" }}>
                  Esperando que tu rival complete su ronda para decretar al ganador.
                </p>
              </div>
            )}

            <Link href="/dashboard" className="btn btn-primary" style={{ width: "100%", padding: "0.85rem", fontSize: "1rem" }}>
              Volver al Inicio <FaArrowRight style={{ marginLeft: "0.4rem" }} />
            </Link>

          </div>
        )}

      </div>
    </div>
  );
}
