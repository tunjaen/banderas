"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { FaFire, FaStar, FaGlobe, FaTrophy, FaMapMarkerAlt, FaChartBar, FaMedal, FaBolt, FaCheckCircle, FaBookOpen, FaQuestionCircle, FaChevronDown, FaChevronUp, FaStopwatch, FaTimes } from "react-icons/fa";
import LogoutButton from "./LogoutButton";
import LanguageSelector from "@/components/LanguageSelector";
import { useLanguage } from "@/lib/LanguageContext";
import LeaderboardTab from "./LeaderboardTab";

export default function DashboardClient({ 
  user, 
  totalCountries = 244,
  masteredCount = 0, 
  familiarCount = 0,
  learningCount = 0,
  unseenCount = 244,
  isIslandExpert = false
}: { 
  user: any; 
  totalCountries?: number;
  masteredCount?: number; 
  familiarCount?: number;
  learningCount?: number; 
  unseenCount?: number;
  isIslandExpert?: boolean;
}) {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState("progress");
  const [isProgressExpanded, setIsProgressExpanded] = useState(true);
  const [isTimerEnabled, setIsTimerEnabled] = useState(false);
  const [showIslandModal, setShowIslandModal] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("app-timer-enabled");
    if (saved === "true") setIsTimerEnabled(true);
  }, []);

  const toggleTimer = () => {
    const next = !isTimerEnabled;
    setIsTimerEnabled(next);
    localStorage.setItem("app-timer-enabled", String(next));
  };

  // XP & Level calculations
  const lvl = user.level || 1;
  const prevLevelXp = (lvl - 1) * lvl * 50;
  const nextLevelXp = lvl * (lvl + 1) * 50;
  const xpInLevel = Math.max(0, user.xp - prevLevelXp);
  const xpNeededInLevel = Math.max(1, nextLevelXp - prevLevelXp);
  const levelProgressPercent = Math.min(100, Math.round((xpInLevel / xpNeededInLevel) * 100));

  // Global Mastery & Coverage calculations
  const masteredPercent = Math.round((masteredCount / totalCountries) * 100);
  const totalExplored = masteredCount + familiarCount + learningCount;
  const coveragePercent = Math.round((totalExplored / totalCountries) * 100);

  // Segmented bar percentages for status breakdown
  const domPct = (masteredCount / totalCountries) * 100;
  const famPct = (familiarCount / totalCountries) * 100;
  const lrnPct = (learningCount / totalCountries) * 100;
  const unsPct = Math.max(0, 100 - (domPct + famPct + lrnPct));

  return (
    <div className="container animate-fade-in" style={{ padding: "1.5rem 1rem", maxWidth: "1200px" }}>
      
      {/* Responsive Header */}
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: "800", margin: 0 }}>{t.dashboard.title}, {user.name?.split(" ")[0] || "User"} 👋</h1>
          <p className="text-muted" style={{ fontSize: "0.95rem", marginTop: "0.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ background: "rgba(167, 244, 50, 0.15)", color: "var(--color-primary)", padding: "0.15rem 0.5rem", borderRadius: "6px", fontWeight: "700", fontSize: "0.85rem" }}>
              {t.dashboard.level} {user.level}
            </span>
            <span>• {user.xp} XP total</span>
          </p>
        </div>
        
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
          <button
            onClick={toggleTimer}
            title={isTimerEnabled ? (t.dashboard.timerOn || "Temporizador Activado (10s)") : (t.dashboard.timerOff || "Temporizador Desactivado")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.35rem",
              background: isTimerEnabled ? "rgba(245, 158, 11, 0.15)" : "var(--color-surface)",
              color: isTimerEnabled ? "#F59E0B" : "var(--color-text-muted)",
              border: `1px solid ${isTimerEnabled ? "rgba(245, 158, 11, 0.4)" : "rgba(255,255,255,0.05)"}`,
              padding: "0.4rem 0.75rem",
              borderRadius: "var(--radius-full)",
              fontSize: "0.85rem",
              fontWeight: "700",
              cursor: "pointer",
              transition: "all 0.2s"
            }}
          >
            <FaStopwatch size={14} style={{ opacity: isTimerEnabled ? 1 : 0.4 }} />
            <span>{isTimerEnabled ? "10s" : "OFF"}</span>
          </button>
          <LanguageSelector />
          <div className="flex gap-2 items-center" style={{ background: "var(--color-surface)", padding: "0.4rem 0.75rem", borderRadius: "var(--radius-full)", border: "1px solid rgba(255,255,255,0.05)" }}>
            <FaFire className="text-danger" size={14} />
            <span style={{ fontWeight: "600", fontSize: "0.85rem" }}>{user.currentStreak} {t.profile?.days || "días"}</span>
          </div>
          {isIslandExpert && (
            <button
              onClick={() => setShowIslandModal(true)}
              title="Experto en Islas"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                background: "linear-gradient(135deg, rgba(245, 158, 11, 0.25), rgba(217, 119, 6, 0.15))",
                color: "#F59E0B",
                border: "1px solid #F59E0B",
                padding: "0.4rem 0.75rem",
                borderRadius: "var(--radius-full)",
                fontSize: "0.85rem",
                fontWeight: "800",
                cursor: "pointer",
                boxShadow: "0 2px 10px rgba(245, 158, 11, 0.3)"
              }}
            >
              <span>🏴‍☠️</span>
              <span>Experto en Islas</span>
            </button>
          )}
          <LogoutButton text={t.dashboard.logout} />
        </div>
      </header>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "1.5rem", marginBottom: "1.5rem", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "0.25rem" }}>
        <button 
          onClick={() => setActiveTab("progress")}
          style={{ 
            fontSize: "1rem", fontWeight: "600", display: "flex", alignItems: "center", gap: "0.5rem",
            color: activeTab === "progress" ? "var(--color-primary)" : "var(--color-text-muted)",
            borderBottom: activeTab === "progress" ? "3px solid var(--color-primary)" : "3px solid transparent",
            paddingBottom: "0.4rem",
            marginBottom: "-0.4rem",
            background: "none", borderLeft: "none", borderRight: "none", borderTop: "none", cursor: "pointer"
          }}
        >
          <FaChartBar /> {t.dashboard.tabs?.progress || "Mi Progreso"}
        </button>
        <button 
          onClick={() => setActiveTab("ranking")}
          style={{ 
            fontSize: "1rem", fontWeight: "600", display: "flex", alignItems: "center", gap: "0.5rem",
            color: activeTab === "ranking" ? "var(--color-primary)" : "var(--color-text-muted)",
            borderBottom: activeTab === "ranking" ? "3px solid var(--color-primary)" : "3px solid transparent",
            paddingBottom: "0.4rem",
            marginBottom: "-0.4rem",
            background: "none", borderLeft: "none", borderRight: "none", borderTop: "none", cursor: "pointer"
          }}
        >
          <FaMedal /> {t.dashboard.tabs?.ranking || "Ranking Global"}
        </button>
      </div>

      {activeTab === "progress" ? (
        <>
          {/* Collapsible Main Progress Card */}
          <div className="card" style={{ marginBottom: "2rem", padding: "1.25rem", background: "var(--color-surface)" }}>
            
            {/* 1. Accordion Summary Header (Always visible & clickable) */}
            <div 
              onClick={() => setIsProgressExpanded(!isProgressExpanded)}
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", userSelect: "none" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                <FaBolt className="text-warning" size={16} />
                <span style={{ fontWeight: "700", fontSize: "1rem" }}>{t.dashboard.levelProgress || "Nivel"} {user.level}</span>
                <span style={{ fontSize: "0.8rem", color: "var(--color-primary)", fontWeight: "700", background: "rgba(167, 244, 50, 0.12)", padding: "0.15rem 0.5rem", borderRadius: "6px" }}>
                  {levelProgressPercent}% completado
                </span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", fontWeight: "600" }}>
                  {xpInLevel} / {xpNeededInLevel} XP
                </span>
                <div 
                  style={{ 
                    background: "rgba(255,255,255,0.08)", 
                    borderRadius: "50%", 
                    width: "28px", 
                    height: "28px", 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center", 
                    color: "var(--color-text)" 
                  }}
                >
                  {isProgressExpanded ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
                </div>
              </div>
            </div>

            {/* Level XP Progress Bar (Always visible) */}
            <div style={{ width: "100%", height: "6px", background: "rgba(255,255,255,0.08)", borderRadius: "var(--radius-full)", overflow: "hidden", marginTop: "0.75rem" }}>
              <div 
                style={{ 
                  height: "100%", 
                  width: `${levelProgressPercent}%`, 
                  background: "linear-gradient(90deg, #F59E0B, #10B981)", 
                  borderRadius: "var(--radius-full)", 
                  transition: "width 0.8s ease-in-out" 
                }} 
              />
            </div>

            {/* Collapsible Details Body */}
            {isProgressExpanded && (
              <div className="animate-fade-in" style={{ marginTop: "1.25rem", pt: "1rem", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                
                {/* 2. Global Progress & Coverage Row */}
                <div style={{ marginBottom: "1.25rem" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
                    
                    {/* Knowledge Coverage */}
                    <div style={{ background: "rgba(255,255,255,0.02)", padding: "0.75rem 1rem", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.04)" }}>
                      <div className="flex justify-between items-center mb-1">
                        <span style={{ fontSize: "0.85rem", fontWeight: "600", color: "var(--color-text)" }}>
                          {t.dashboard.knowledgeCoverage || "Cobertura de Conocimiento"}
                        </span>
                        <span style={{ fontSize: "0.85rem", fontWeight: "800", color: "#3B82F6" }}>
                          {coveragePercent}% <span style={{ fontSize: "0.75rem", fontWeight: "normal", color: "var(--color-text-muted)" }}>({totalExplored}/{totalCountries})</span>
                        </span>
                      </div>
                      <div style={{ width: "100%", height: "6px", background: "rgba(255,255,255,0.08)", borderRadius: "var(--radius-full)", overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${coveragePercent}%`, background: "#3B82F6", borderRadius: "var(--radius-full)", transition: "width 0.8s ease-in-out" }} />
                      </div>
                    </div>

                    {/* Total Mastery */}
                    <div style={{ background: "rgba(255,255,255,0.02)", padding: "0.75rem 1rem", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.04)" }}>
                      <div className="flex justify-between items-center mb-1">
                        <span style={{ fontSize: "0.85rem", fontWeight: "600", color: "var(--color-text)" }}>
                          {t.dashboard.mastered || "Dominio Total"}
                        </span>
                        <span style={{ fontSize: "0.85rem", fontWeight: "800", color: "var(--color-primary)" }}>
                          {masteredPercent}% <span style={{ fontSize: "0.75rem", fontWeight: "normal", color: "var(--color-text-muted)" }}>({masteredCount}/{totalCountries})</span>
                        </span>
                      </div>
                      <div style={{ width: "100%", height: "6px", background: "rgba(255,255,255,0.08)", borderRadius: "var(--radius-full)", overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${masteredPercent}%`, background: "var(--color-primary)", borderRadius: "var(--radius-full)", transition: "width 0.8s ease-in-out" }} />
                      </div>
                    </div>

                  </div>
                </div>

                {/* 3. Memory Status Breakdown (Segmented Bar + Status Chips) */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: "700" }}>
                      Desglose por Estado de Memoria
                    </span>
                  </div>

                  {/* Segmented Bar */}
                  <div style={{ width: "100%", height: "8px", background: "rgba(255,255,255,0.06)", borderRadius: "var(--radius-full)", overflow: "hidden", display: "flex", marginBottom: "0.75rem" }}>
                    {domPct > 0 && <div style={{ width: `${domPct}%`, background: "#10B981" }} title={`Dominados: ${masteredCount}`} />}
                    {famPct > 0 && <div style={{ width: `${famPct}%`, background: "#F59E0B" }} title={`Familiar: ${familiarCount}`} />}
                    {lrnPct > 0 && <div style={{ width: `${lrnPct}%`, background: "#3B82F6" }} title={`Aprendiendo: ${learningCount}`} />}
                    {unsPct > 0 && <div style={{ width: `${unsPct}%`, background: "rgba(255,255,255,0.15)" }} title={`Por Descubrir: ${unseenCount}`} />}
                  </div>

                  {/* Responsive Status Chips */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "0.5rem" }}>
                    
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.8rem", background: "rgba(16, 185, 129, 0.08)", padding: "0.4rem 0.6rem", borderRadius: "6px", border: "1px solid rgba(16, 185, 129, 0.2)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                        <FaCheckCircle className="text-success" size={12} />
                        <span style={{ fontWeight: "600", color: "#10B981" }}>{t.dashboard.mastered || "Dominados"}</span>
                      </div>
                      <span style={{ fontWeight: "800" }}>{masteredCount}</span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.8rem", background: "rgba(245, 158, 11, 0.08)", padding: "0.4rem 0.6rem", borderRadius: "6px", border: "1px solid rgba(245, 158, 11, 0.2)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                        <FaStar className="text-warning" size={12} />
                        <span style={{ fontWeight: "600", color: "#F59E0B" }}>{t.dashboard.familiar || "Familiar"}</span>
                      </div>
                      <span style={{ fontWeight: "800" }}>{familiarCount}</span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.8rem", background: "rgba(59, 130, 246, 0.08)", padding: "0.4rem 0.6rem", borderRadius: "6px", border: "1px solid rgba(59, 130, 246, 0.2)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                        <FaBookOpen style={{ color: "#3B82F6" }} size={12} />
                        <span style={{ fontWeight: "600", color: "#3B82F6" }}>{t.dashboard.learning || "Aprendiendo"}</span>
                      </div>
                      <span style={{ fontWeight: "800" }}>{learningCount}</span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.8rem", background: "rgba(255, 255, 255, 0.03)", padding: "0.4rem 0.6rem", borderRadius: "6px", border: "1px solid rgba(255, 255, 255, 0.08)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                        <FaQuestionCircle style={{ color: "var(--color-text-muted)" }} size={12} />
                        <span style={{ fontWeight: "600", color: "var(--color-text-muted)" }}>{t.dashboard.unseen || "Por Descubrir"}</span>
                      </div>
                      <span style={{ fontWeight: "800", color: "var(--color-text-muted)" }}>{unseenCount}</span>
                    </div>

                  </div>

                </div>

              </div>
            )}

          </div>

          <h2 style={{ fontSize: "1.25rem", marginBottom: "1rem", fontWeight: "800" }}>{t.dashboard.startSession}</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "1rem" }}>
            <Link href="/learn/world" className="card" style={{ textDecoration: "none", display: "block", padding: "1.25rem" }}>
              <FaGlobe size={28} className="text-primary" style={{ marginBottom: "0.75rem" }} />
              <h3 style={{ fontSize: "1.1rem" }}>{t.dashboard.modes.world.title}</h3>
              <p className="text-muted" style={{ fontSize: "0.8rem", marginTop: "0.25rem" }}>{t.dashboard.modes.world.desc}</p>
            </Link>
            <Link href="/learn/continents" className="card" style={{ textDecoration: "none", display: "block", padding: "1.25rem" }}>
              <FaStar size={28} className="text-warning" style={{ marginBottom: "0.75rem" }} />
              <h3 style={{ fontSize: "1.1rem" }}>{t.dashboard.modes.continents.title}</h3>
              <p className="text-muted" style={{ fontSize: "0.8rem", marginTop: "0.25rem" }}>{t.dashboard.modes.continents.desc}</p>
            </Link>
            <Link href="/learn/weaknesses" className="card" style={{ textDecoration: "none", display: "block", padding: "1.25rem" }}>
              <FaTrophy size={28} className="text-danger" style={{ marginBottom: "0.75rem" }} />
              <h3 style={{ fontSize: "1.1rem" }}>{t.dashboard.modes.weaknesses.title}</h3>
              <p className="text-muted" style={{ fontSize: "0.8rem", marginTop: "0.25rem" }}>{t.dashboard.modes.weaknesses.desc}</p>
            </Link>
            <Link href="/learn/spatial" className="card" style={{ textDecoration: "none", display: "block", padding: "1.25rem" }}>
              <FaMapMarkerAlt size={28} className="text-success" style={{ marginBottom: "0.75rem" }} />
              <h3 style={{ fontSize: "1.1rem" }}>{t.dashboard.modes.spatial.title}</h3>
              <p className="text-muted" style={{ fontSize: "0.8rem", marginTop: "0.25rem" }}>{t.dashboard.modes.spatial.desc}</p>
            </Link>
            <Link href="/flags" className="card" style={{ textDecoration: "none", display: "block", padding: "1.25rem", background: "linear-gradient(135deg, rgba(168, 85, 247, 0.1), var(--color-surface))", border: "1px solid rgba(168, 85, 247, 0.2)" }}>
              <FaGlobe size={28} style={{ color: "#A855F7", marginBottom: "0.75rem" }} />
              <h3 style={{ fontSize: "1.1rem" }}>{t.dashboard.modes.allFlags?.title || "Ver todas las banderas"}</h3>
              <p className="text-muted" style={{ fontSize: "0.8rem", marginTop: "0.25rem" }}>{t.dashboard.modes.allFlags?.desc || "Explora el directorio completo y filtra por región."}</p>
            </Link>
            <Link href="/map" className="card" style={{ textDecoration: "none", display: "block", padding: "1.25rem", background: "linear-gradient(135deg, var(--color-surface), var(--color-surface-hover))" }}>
              <FaGlobe size={28} className="text-primary" style={{ marginBottom: "0.75rem" }} />
              <h3 style={{ fontSize: "1.1rem" }}>{t.dashboard.modes.global.title}</h3>
              <p className="text-muted" style={{ fontSize: "0.8rem", marginTop: "0.25rem" }}>{t.dashboard.modes.global.desc}</p>
            </Link>
          </div>
        </>
      ) : (
        <LeaderboardTab currentUserId={user.id} />
      )}

      {/* Pirate Expert Badge Interactive Modal */}
      {showIslandModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)", zIndex: 9999, display: "flex", justifyContent: "center", alignItems: "center", padding: "1rem" }}>
          <div className="card animate-scale-up" style={{ maxWidth: "420px", width: "100%", padding: "2rem", textAlign: "center", border: "2px solid #F59E0B", boxShadow: "0 0 35px rgba(245, 158, 11, 0.4)", position: "relative" }}>
            <button 
              onClick={() => setShowIslandModal(false)}
              style={{ position: "absolute", top: "12px", right: "12px", background: "none", border: "none", color: "var(--color-text-muted)", cursor: "pointer", fontSize: "1.2rem" }}
            >
              <FaTimes />
            </button>
            <div style={{ fontSize: "4rem", marginBottom: "0.5rem" }}>🏴‍☠️</div>
            <h3 style={{ fontSize: "1.5rem", fontWeight: "800", color: "#F59E0B", marginBottom: "0.75rem" }}>
              Cazatesoros de Islas
            </h3>
            <p style={{ fontSize: "1.05rem", fontWeight: "600", color: "var(--color-text)", lineHeight: "1.5", marginBottom: "1.5rem" }}>
              ¡Esta persona es una experta cazatesoros en todas las islas del mundo! 🪙💎
            </p>
            <button 
              onClick={() => setShowIslandModal(false)}
              className="btn btn-primary"
              style={{ background: "#F59E0B", color: "#000", fontWeight: "800", width: "100%" }}
            >
              ¡Entendido, Capitán! 🦜
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
