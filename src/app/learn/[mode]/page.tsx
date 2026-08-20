"use client";

import { useState, useEffect, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import dynamic from "next/dynamic";
import { FaTimes, FaMapMarkerAlt, FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import { useLanguage } from "@/lib/LanguageContext";

const Map = dynamic(() => import("@/components/Map"), { ssr: false });

interface Question {
  targetId: string;
  flagCode: string;
  countryName: string;
  countryNameEn: string;
  lat: number;
  lng: number;
  options: { id: string; name: string; nameEn: string; isoCode: string }[];
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

  // Session tracking
  const [questionCount, setQuestionCount] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [sessionXp, setSessionXp] = useState(0);

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
    setSelectedId(null);
    try {
      const url = new URL("/api/game/next", window.location.origin);
      url.searchParams.set("mode", mode);
      if (continent) url.searchParams.set("continent", continent);
      
      const res = await fetch(url.toString());
      if (res.ok) {
        const data = await res.json();
        setQuestion(data);
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

  const handleSelect = async (id: string) => {
    if (selectedId || !question) return;
    setSelectedId(id);
    
    const isCorrect = id === question.targetId;
    
    try {
      const res = await fetch("/api/game/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ countryId: question.targetId, isCorrect, mode })
      });
      const data = await res.json();
      setFeedback({ ...data, isCorrect });
      
      setQuestionCount(prev => prev + 1);
      if (isCorrect) setCorrectCount(prev => prev + 1);
      setSessionXp(prev => prev + (data.xpGained || 0));
      
    } catch (e) {
      console.error(e);
    }
  };

  if (mode === "continents" && !continent) {
    const continents = ["África", "Asia", "Europa", "América del Norte", "América del Sur", "Oceanía"];
    return (
      <div className="container" style={{ padding: "2rem" }}>
        <button onClick={() => router.push("/dashboard")} className="btn btn-outline" style={{ marginBottom: "2rem" }}>Volver</button>
        <h1 className="text-center" style={{ marginBottom: "2rem" }}>Elige un Continente</h1>
        <div className="flex justify-center flex-wrap gap-4">
          {continents.map(c => (
            <button key={c} onClick={() => router.push(`/learn/continents?continent=${encodeURIComponent(c)}`)} className="card hover-scale" style={{ width: "200px", textAlign: "center", fontSize: "1.25rem", fontWeight: "600", color: "var(--color-text)", cursor: "pointer", border: "1px solid rgba(255,255,255,0.1)" }}>
              {c}
            </button>
          ))}
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

  return (
    <div className="container" style={{ maxWidth: "800px", padding: "1rem", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <header className="flex justify-between items-center" style={{ padding: "1rem 0", marginBottom: "2rem" }}>
        <button onClick={() => router.push("/dashboard")} style={{ fontSize: "1.5rem", color: "var(--color-text-muted)" }}>
          <FaTimes />
        </button>
        <div style={{ flex: 1, margin: "0 2rem", height: "12px", background: "rgba(255,255,255,0.1)", borderRadius: "var(--radius-full)" }}>
          <div style={{ width: "50%", height: "100%", background: "var(--color-primary)", borderRadius: "var(--radius-full)" }}></div>
        </div>
        <div className="flex gap-2 items-center font-bold text-warning">
          {/* Mock streak or session score */}
        </div>
      </header>

      <main style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: "700", marginBottom: "2rem", textAlign: "center" }}>
          {mode === "spatial" ? t.quiz.spatialQ : t.quiz.flagQ}
        </h2>
        
        <div style={{ 
          position: "relative", 
          width: "100%", 
          maxWidth: "400px", 
          minHeight: "200px",
          marginBottom: "3rem", 
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
          {mode === "spatial" ? (
             <Map lat={question.lat} lng={question.lng} name="?" />
          ) : (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img 
              src={`https://flagcdn.com/w640/${question.flagCode}.png`} 
              alt="Bandera" 
              style={{ 
                maxHeight: "260px", 
                maxWidth: "100%", 
                objectFit: "contain",
                borderRadius: "var(--radius-sm)",
                boxShadow: "var(--shadow-lg)",
                border: "1px solid rgba(255,255,255,0.1)"
              }}
            />
          )}
        </div>

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
            )
          })}
        </div>
      </main>

      {/* Feedback Footer */}
      {feedback && (
        <div className="animate-fade-in" style={{
          position: "fixed", bottom: 0, left: 0, right: 0, 
          padding: "2rem",
          background: feedback.isCorrect ? "var(--color-surface)" : "var(--color-surface)",
          borderTop: `4px solid ${feedback.isCorrect ? "var(--color-success)" : "var(--color-danger)"}`,
          boxShadow: "0 -10px 40px rgba(0,0,0,0.5)",
          zIndex: 50
        }}>
          <div className="container flex justify-between items-start gap-6" style={{ maxWidth: "1000px" }}>
            <div className="flex gap-4" style={{ flex: 1 }}>
              <div style={{ color: feedback.isCorrect ? "var(--color-success)" : "var(--color-danger)", fontSize: "2.5rem", flexShrink: 0 }}>
                {feedback.isCorrect ? <FaCheckCircle /> : <FaTimesCircle />}
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: "1.75rem", fontWeight: "800", color: feedback.isCorrect ? "var(--color-success)" : "var(--color-danger)" }}>
                  {feedback.isCorrect ? t.quiz.correct : t.quiz.incorrect}
                </h3>
                <p style={{ fontSize: "1.25rem", color: "var(--color-text)", margin: "0.5rem 0" }}>
                  <strong>{lang === 'en' ? feedback.country.nameEn : feedback.country.name}</strong>
                </p>
                <p className="text-muted">{t.quiz.capital} {lang === 'en' ? feedback.country.capitalEn : feedback.country.capital}</p>
                <p className="text-muted">{t.quiz.continent} {lang === 'en' ? feedback.country.continentEn : feedback.country.continent}</p>
                <p className="text-muted font-bold mt-2" style={{ color: "var(--color-warning)" }}>+{feedback.xpGained} XP</p>
                {["SJM", "PRI", "GRL", "MAC", "PYF", "NCL", "GUF", "HKG", "BMU", "CYM"].includes(feedback.country.id) && (
                  <div style={{ marginTop: "0.5rem", padding: "0.5rem", background: "rgba(245, 158, 11, 0.1)", borderLeft: "3px solid var(--color-warning)", borderRadius: "0 var(--radius-sm) var(--radius-sm) 0" }}>
                    <p style={{ color: "var(--color-warning)", fontSize: "0.875rem", margin: 0, fontWeight: "600" }}>
                      {lang === 'en' 
                        ? "Extra Challenge: This is an overseas territory or autonomous dependency."
                        : "Reto Extra: Este es un territorio de ultramar o dependencia autónoma."}
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            {mode === "spatial" ? (
              <div style={{ width: "200px", height: "150px", borderRadius: "var(--radius-md)", overflow: "hidden", display: "flex", justifyContent: "center", alignItems: "center" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`https://flagcdn.com/w320/${feedback.country.isoCode.toLowerCase()}.png`} alt="Flag" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", borderRadius: "var(--radius-sm)", boxShadow: "var(--shadow-md)" }} />
              </div>
            ) : (
              <div style={{ width: "300px", height: "150px", borderRadius: "var(--radius-md)", overflow: "hidden", border: "2px solid rgba(255,255,255,0.1)" }}>
                 <Map lat={feedback.country.lat} lng={feedback.country.lng} name={lang === 'en' ? feedback.country.nameEn : feedback.country.name} />
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", height: "150px" }}>
              <button onClick={fetchQuestion} className="btn" style={{ 
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
