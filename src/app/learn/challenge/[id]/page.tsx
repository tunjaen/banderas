"use client";

import { useState, useEffect, useRef, use } from "react";
import { useLanguage } from "@/lib/LanguageContext";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import dynamic from "next/dynamic";
import { FaClock, FaCheck, FaTimes, FaTrophy, FaArrowRight, FaBolt, FaRunning, FaGlobeAmericas, FaSave, FaArrowLeft } from "react-icons/fa";
import SwordsIcon from "@/components/SwordsIcon";

const ChallengeDominationMap = dynamic(() => import("@/components/ChallengeDominationMap"), { ssr: false });

export default function ChallengePlayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { lang } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [challenge, setChallenge] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [allTerritoryCountries, setAllTerritoryCountries] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const [selectedOption, setSelectedOption] = useState<any>(null);
  const [score, setScore] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(10);

  const [isGameOver, setIsGameOver] = useState(false);
  const [gameResult, setGameResult] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  // Tab mode for Domination: "QUIZ" | "MAP"
  const [activeTab, setActiveTab] = useState<"QUIZ" | "MAP">("QUIZ");

  // Domination Progress state
  const [challengerHits, setChallengerHits] = useState<Record<string, number>>({});
  const [challengedHits, setChallengedHits] = useState<Record<string, number>>({});
  const [myCorrectCount, setMyCorrectCount] = useState(0);
  const [myWrongCount, setMyWrongCount] = useState(0);
  const [dominatedBanner, setDominatedBanner] = useState<string | null>(null);

  // Ref to ensure questions are loaded strictly ONCE per session and never changed by background updates
  const hasLoadedQuestionsRef = useRef(false);

  const loadChallengeData = async () => {
    try {
      const res = await fetch(`/api/challenges/${id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.challenge) {
          setChallenge(data.challenge);
          
          // Set questions and territory strictly ONCE on initial load
          if (!hasLoadedQuestionsRef.current) {
            hasLoadedQuestionsRef.current = true;
            if (data.questions && data.questions.length > 0) {
              setQuestions(data.questions);
            }
            if (data.allTerritoryCountries) {
              setAllTerritoryCountries(data.allTerritoryCountries);
            }
          }

          // Parse progress JSONs for live map updates
          try {
            if (data.challenge.challengerProgressJson) {
              const cData = JSON.parse(data.challenge.challengerProgressJson);
              setChallengerHits(cData.hits || {});
            }
            if (data.challenge.challengedProgressJson) {
              const rData = JSON.parse(data.challenge.challengedProgressJson);
              setChallengedHits(rData.hits || {});
            }
          } catch (e) {}

          if (!startTime) setStartTime(Date.now());
        }
      }
    } catch (e) {
      console.error("Error loading challenge:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChallengeData();
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
    setSelectedOption({ id: "TIMEOUT_WRONG" });
    setTimeout(() => {
      nextQuestion(score);
    }, 1200);
  };

  const handleSelectOption = (opt: any) => {
    if (selectedOption !== null) return;
    setSelectedOption(opt);

    const currentCountry = questions[currentIndex]?.country;
    if (!currentCountry) return;

    const isCorrect = opt.id === currentCountry.id;
    const newScore = isCorrect ? score + 1 : score;
    if (isCorrect) setScore(newScore);

    if (challenge?.gameMode === "DOMINATION") {
      if (isCorrect) {
        setMyCorrectCount(prev => prev + 1);
        const prevHits = challengerHits[currentCountry.id] || 0;
        const newHits = prevHits + 1;
        setChallengerHits(prev => ({ ...prev, [currentCountry.id]: newHits }));

        if (newHits === 3) {
          setDominatedBanner(`👑 ¡PAÍS DOMINADO! ${lang === 'en' ? currentCountry.nameEn : currentCountry.name} (3/3 aciertos)`);
          setTimeout(() => setDominatedBanner(null), 3000);
        }
      } else {
        setMyWrongCount(prev => prev + 1);
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
      const payload: any = {
        score: finalScore,
        timeMs: elapsedMs
      };

      if (challenge?.gameMode === "DOMINATION") {
        payload.progressData = {
          hits: challengerHits,
          correctCount: myCorrectCount,
          wrongCount: myWrongCount
        };
      }

      const res = await fetch(`/api/challenges/${id}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
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

  const saveSessionAndExit = async () => {
    setSubmitting(true);
    const elapsedMs = startTime ? Date.now() - startTime : 5000;

    try {
      await fetch(`/api/challenges/${id}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          score,
          timeMs: elapsedMs,
          progressData: {
            hits: challengerHits,
            correctCount: myCorrectCount,
            wrongCount: myWrongCount
          },
          isSessionEnd: true
        })
      });
      window.location.href = "/dashboard";
    } catch (e) {
      console.error(e);
      window.location.href = "/dashboard";
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <Navbar />
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
          <div style={{ textAlign: "center", color: "var(--color-text-muted)" }}>
            <SwordsIcon size={36} className="animate-bounce" style={{ marginBottom: "1rem", color: "var(--color-primary)" }} />
            <p style={{ fontWeight: "700" }}>Cargando terreno de dominación...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!challenge) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <Navbar />
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
          <div className="card" style={{ maxWidth: "400px", padding: "2rem", textAlign: "center" }}>
            <h2>Reto no disponible</h2>
            <p className="text-muted" style={{ marginBottom: "1.5rem" }}>Este duelo no existe o ha sido eliminado.</p>
            <Link href="/dashboard" className="btn btn-primary" style={{ width: "100%" }}>Volver al Inicio</Link>
          </div>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const targetCountry = currentQ?.country;
  const options = currentQ?.options || [];

  const isDomination = challenge.gameMode === "DOMINATION";
  const totalTerritoryCount = allTerritoryCountries.length || challenge.targetScore || 1;

  const cDominated = Object.values(challengerHits).filter(h => h >= 3).length;
  const rDominated = Object.values(challengedHits).filter(h => h >= 3).length;

  // 3-day expiration countdown calculation
  const expiresAtMs = challenge?.createdAt ? new Date(challenge.createdAt).getTime() + (3 * 24 * 60 * 60 * 1000) : Date.now();
  const remainingMs = Math.max(0, expiresAtMs - Date.now());
  const daysLeft = Math.floor(remainingMs / (1000 * 60 * 60 * 24));
  const hoursLeft = Math.floor((remainingMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minsLeft = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
  const timeString = `${daysLeft}d ${hoursLeft}h ${minsLeft}m`;

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Navbar />

      <div className="container animate-fade-in" style={{ maxWidth: "720px", margin: "0 auto", padding: "1.25rem 1rem", flex: 1 }}>
        
        {/* 3-Day Countdown Timer Banner */}
        {isDomination && challenge.status !== "COMPLETED" && (
          <div style={{ background: "rgba(245, 158, 11, 0.15)", border: "1px solid #F59E0B", color: "#F59E0B", padding: "0.75rem 1rem", borderRadius: "12px", marginBottom: "1rem", fontSize: "0.85rem", fontWeight: "800", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <FaClock /> <span>Dominación 1v1 (3 días) • Si ningún jugador termina el 100%, gana el de mayor % de aciertos.</span>
            </span>
            <span style={{ fontSize: "0.95rem", fontWeight: "900", background: "rgba(245, 158, 11, 0.25)", padding: "0.25rem 0.65rem", borderRadius: "8px", border: "1px solid rgba(245, 158, 11, 0.4)" }}>
              ⏳ Quedan {timeString}
            </span>
          </div>
        )}

        {/* Challenge Title Bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255,255,255,0.03)", padding: "0.85rem 1.15rem", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.06)", marginBottom: "1rem" }}>
          <div>
            <div style={{ fontSize: "0.75rem", fontWeight: "800", color: "#F59E0B", textTransform: "uppercase", display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <SwordsIcon /> Duelo 1v1 • {isDomination ? "Dominación (Multisesión)" : "Relámpago (10s)"}
            </div>
            <div style={{ fontWeight: "800", fontSize: "1.05rem", color: "#fff", marginTop: "0.15rem" }}>
              <span style={{ color: "#10B981" }}>{challenge.challenger.name}</span> ⚔️ <span style={{ color: "#60A5FA" }}>{challenge.challenged.name}</span>
            </div>
          </div>

          {isDomination && (
            <button
              onClick={saveSessionAndExit}
              title="Guardar aciertos acumulados y continuar en la siguiente sesión"
              className="btn btn-outline"
              style={{ padding: "0.4rem 0.75rem", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "0.35rem" }}
            >
              <FaSave size={12} /> <span>Guardar y Salir</span>
            </button>
          )}

          {!isDomination && challenge.gameMode === "LIGHTNING" && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", background: timeLeft <= 3 ? "rgba(239, 68, 68, 0.2)" : "rgba(245, 158, 11, 0.15)", color: timeLeft <= 3 ? "#EF4444" : "#F59E0B", border: `1px solid ${timeLeft <= 3 ? "#EF4444" : "#F59E0B"}`, padding: "0.4rem 0.8rem", borderRadius: "20px", fontWeight: "900", fontSize: "1rem" }}>
              <FaClock /> <span>{timeLeft}s</span>
            </div>
          )}
        </div>

        {/* Domination Dual Progress Bar Comparison */}
        {isDomination && (
          <div style={{ background: "rgba(13, 20, 16, 0.8)", border: "1px solid rgba(16, 185, 129, 0.25)", padding: "1rem", borderRadius: "16px", marginBottom: "1.25rem" }}>
            <div style={{ fontSize: "0.85rem", fontWeight: "800", color: "#fff", marginBottom: "0.75rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>👑 Comparativa de Países Dominados (3/3)</span>
              <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>Total: {totalTerritoryCount} países</span>
            </div>

            {/* Challenger Progress */}
            <div style={{ marginBottom: "0.6rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.775rem", fontWeight: "700", marginBottom: "0.25rem" }}>
                <span style={{ color: "#10B981" }}>🟢 {challenge.challenger.name}</span>
                <span style={{ color: "#10B981" }}>{cDominated} / {totalTerritoryCount} dominados</span>
              </div>
              <div style={{ width: "100%", height: "8px", background: "rgba(255,255,255,0.08)", borderRadius: "10px", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${(cDominated / totalTerritoryCount) * 100}%`, background: "#10B981", transition: "width 0.4s ease" }} />
              </div>
            </div>

            {/* Challenged Progress */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.775rem", fontWeight: "700", marginBottom: "0.25rem" }}>
                <span style={{ color: "#60A5FA" }}>🔵 {challenge.challenged.name}</span>
                <span style={{ color: "#60A5FA" }}>{rDominated} / {totalTerritoryCount} dominados</span>
              </div>
              <div style={{ width: "100%", height: "8px", background: "rgba(255,255,255,0.08)", borderRadius: "10px", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${(rDominated / totalTerritoryCount) * 100}%`, background: "#3B82F6", transition: "width 0.4s ease" }} />
              </div>
            </div>
          </div>
        )}

        {/* Tab Toggle for Domination Mode: [Quiz / Map] */}
        {isDomination && !isGameOver && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginBottom: "1.25rem" }}>
            <button
              onClick={() => setActiveTab("QUIZ")}
              style={{
                padding: "0.65rem",
                borderRadius: "10px",
                fontWeight: "800",
                fontSize: "0.9rem",
                background: activeTab === "QUIZ" ? "rgba(16, 185, 129, 0.2)" : "rgba(255,255,255,0.04)",
                border: `1px solid ${activeTab === "QUIZ" ? "#10B981" : "rgba(255,255,255,0.08)"}`,
                color: activeTab === "QUIZ" ? "#10B981" : "#fff",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.4rem"
              }}
            >
              <SwordsIcon /> <span>🎮 Preguntas ({questions.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("MAP")}
              style={{
                padding: "0.65rem",
                borderRadius: "10px",
                fontWeight: "800",
                fontSize: "0.9rem",
                background: activeTab === "MAP" ? "rgba(59, 130, 246, 0.2)" : "rgba(255,255,255,0.04)",
                border: `1px solid ${activeTab === "MAP" ? "#3B82F6" : "rgba(255,255,255,0.08)"}`,
                color: activeTab === "MAP" ? "#60A5FA" : "#fff",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.4rem"
              }}
            >
              <FaGlobeAmericas /> <span>🗺️ Mapa del Duelo</span>
            </button>
          </div>
        )}

        {!isGameOver ? (
          <>
            {activeTab === "MAP" && isDomination ? (
              <div className="card animate-fade-in" style={{ padding: "1.25rem", background: "var(--color-surface)", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.08)" }}>
                <h3 style={{ fontSize: "1.1rem", fontWeight: "800", color: "#fff", marginBottom: "0.75rem" }}>
                  🗺️ Mapa de Dominación Territorio 1v1
                </h3>
                <ChallengeDominationMap
                  challengerName={challenge.challenger.name}
                  challengedName={challenge.challenged.name}
                  challengerHits={challengerHits}
                  challengedHits={challengedHits}
                  challengerId={challenge.challengerId}
                  challengedId={challenge.challengedId}
                />
              </div>
            ) : questions.length === 0 ? (
              <div className="card" style={{ padding: "2.5rem 1.5rem", textAlign: "center" }}>
                <div style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>👑</div>
                <h3 style={{ fontSize: "1.3rem", fontWeight: "800", color: "#10B981" }}>
                  ¡Has dominado todas las banderas de este territorio!
                </h3>
                <p style={{ color: "var(--color-text-muted)", margin: "0.5rem 0 1.5rem 0" }}>
                  Has acertado 3 veces cada país. Haz clic abajo para finalizar tu intento.
                </p>
                <button onClick={() => finishGame(score)} className="btn btn-primary" style={{ width: "100%", padding: "0.85rem" }}>
                  Finalizar Duelo
                </button>
              </div>
            ) : (
              <>
                {/* Dominated Notification Popup */}
                {dominatedBanner && (
                  <div className="animate-fade-in" style={{ padding: "0.85rem 1.25rem", background: "linear-gradient(135deg, rgba(245, 158, 11, 0.25), rgba(16, 185, 129, 0.25))", border: "2px solid #F59E0B", color: "#FFF", borderRadius: "14px", fontWeight: "900", textAlign: "center", fontSize: "1rem", marginBottom: "1rem", boxShadow: "0 8px 25px rgba(245, 158, 11, 0.3)" }}>
                    {dominatedBanner}
                  </div>
                )}

                {/* Flag Image Card */}
                {targetCountry && (
                  <div className="card" style={{ padding: "2rem 1.5rem", textAlign: "center", background: "var(--color-surface)", borderRadius: "16px", marginBottom: "1.25rem", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginBottom: "0.5rem", fontWeight: "700" }}>
                      Pregunta {currentIndex + 1} de {questions.length} • {isDomination ? `Aciertos actuales: ${(challengerHits[targetCountry.id] || 0)}/3` : `Puntos: ${score}`}
                    </div>
                    <img 
                      src={`https://flagcdn.com/w640/${targetCountry.isoCode.toLowerCase()}.png`}
                      alt="Flag"
                      style={{ maxHeight: "190px", maxWidth: "100%", borderRadius: "8px", boxShadow: "0 8px 24px rgba(0,0,0,0.5)" }}
                    />
                  </div>
                )}

                {/* Answer Options */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.85rem" }}>
                  {options.map((opt: any) => {
                    const isSelected = selectedOption?.id === opt.id;
                    const isCorrect = opt.id === targetCountry?.id;
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
            )}
          </>
        ) : (
          /* Game Over Summary Screen */
          <div className="card animate-fade-in" style={{ padding: "2rem", textAlign: "center", background: "var(--color-surface)", borderRadius: "20px", border: "1px solid rgba(167, 244, 50, 0.3)", boxShadow: "0 20px 50px rgba(0,0,0,0.8)" }}>
            
            <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "linear-gradient(135deg, #10B981, #3B82F6)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem auto", color: "#fff", fontSize: "1.75rem", boxShadow: "0 8px 20px rgba(16, 185, 129, 0.4)" }}>
              <FaTrophy />
            </div>

            <h2 style={{ fontSize: "1.75rem", fontWeight: "900", color: "#fff", marginBottom: "0.5rem" }}>
              {submitting ? "Calculando precisión y resultados..." : "¡Sesión / Duelo Completado!"}
            </h2>

            <div style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", background: "rgba(167, 244, 50, 0.15)", color: "var(--color-primary)", padding: "0.3rem 0.8rem", borderRadius: "20px", fontWeight: "800", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
              🎉 Ronda Registrada
            </div>

            {gameResult?.isFinished ? (
              <div style={{ background: "rgba(255,255,255,0.03)", padding: "1.25rem", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.08)", marginBottom: "1.5rem" }}>
                <h3 style={{ fontSize: "1.2rem", fontWeight: "800", color: "#fff", marginBottom: "1rem" }}>
                  {gameResult.challenge.winnerId === "DRAW"
                    ? "🤝 ¡Empate Total por Precisión!"
                    : gameResult.challenge.winnerId === challenge.challengerId
                      ? `🏆 Ganador: ${challenge.challenger.name}`
                      : `🏆 Ganador: ${challenge.challenged.name}`}
                </h3>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div style={{ background: "rgba(255,255,255,0.03)", padding: "0.85rem", borderRadius: "10px" }}>
                    <div style={{ fontWeight: "800", color: "#10B981" }}>{challenge.challenger.name}</div>
                    <div style={{ fontSize: "1.1rem", fontWeight: "900", color: "var(--color-primary)", marginTop: "0.2rem" }}>
                      {gameResult.challenge.challengerAccuracy ? `${Math.round(gameResult.challenge.challengerAccuracy)}% Precisión` : `${gameResult.challenge.challengerScore} Países`}
                    </div>
                  </div>

                  <div style={{ background: "rgba(255,255,255,0.03)", padding: "0.85rem", borderRadius: "10px" }}>
                    <div style={{ fontWeight: "800", color: "#60A5FA" }}>{challenge.challenged.name}</div>
                    <div style={{ fontSize: "1.1rem", fontWeight: "900", color: "#60A5FA", marginTop: "0.2rem" }}>
                      {gameResult.challenge.challengedAccuracy ? `${Math.round(gameResult.challenge.challengedAccuracy)}% Precisión` : `${gameResult.challenge.challengedScore} Países`}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ padding: "1.25rem", background: "rgba(245, 158, 11, 0.1)", borderRadius: "14px", border: "1px solid rgba(245, 158, 11, 0.25)", color: "#F59E0B", marginBottom: "1.5rem" }}>
                <p style={{ fontWeight: "800", fontSize: "1rem", margin: 0 }}>
                  ⏳ Progreso de Sesión Guardado
                </p>
                <p style={{ fontSize: "0.85rem", margin: "0.4rem 0 0 0", color: "rgba(255,255,255,0.8)" }}>
                  Puedes volver a jugar en cualquier momento o al día siguiente para dominar el 100% del territorio.
                </p>
              </div>
            )}

            {/* Domination Interactive Map Summary */}
            {isDomination && (
              <div style={{ marginBottom: "1.5rem", textAlign: "left" }}>
                <h4 style={{ color: "#fff", fontWeight: "800", marginBottom: "0.5rem" }}>🗺️ Estado del Mapa Duelo:</h4>
                <ChallengeDominationMap
                  challengerName={challenge.challenger.name}
                  challengedName={challenge.challenged.name}
                  challengerHits={challengerHits}
                  challengedHits={challengedHits}
                  challengerId={challenge.challengerId}
                  challengedId={challenge.challengedId}
                />
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
