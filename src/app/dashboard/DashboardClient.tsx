"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  FaFire, 
  FaStar, 
  FaGlobe, 
  FaTrophy, 
  FaMapMarkerAlt, 
  FaChartBar, 
  FaMedal, 
  FaBolt, 
  FaCheckCircle, 
  FaBookOpen, 
  FaQuestionCircle, 
  FaChevronDown, 
  FaChevronUp, 
  FaStopwatch, 
  FaTimes,
  FaCompass,
  FaRedo,
  FaMapMarkedAlt,
  FaFlag
} from "react-icons/fa";
import LogoutButton from "./LogoutButton";
import LanguageSelector from "@/components/LanguageSelector";
import Navbar from "@/components/Navbar";
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
  const { t, lang } = useLanguage();
  const [activeTab, setActiveTab] = useState("progress");
  const [isProgressExpanded, setIsProgressExpanded] = useState(false);
  const [showIslandModal, setShowIslandModal] = useState(false);

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
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Global Responsive Navbar */}
      <Navbar user={user} />

      <div className="container animate-fade-in" style={{ padding: "1.5rem 1rem", maxWidth: "1200px", flex: 1 }}>
        
        {/* Welcome Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h1 style={{ fontSize: "1.75rem", fontWeight: "800", margin: 0 }}>
              {t.dashboard.title}, {user.name?.split(" ")[0] || "Jugador"} 👋
            </h1>
            <p className="text-muted" style={{ fontSize: "0.95rem", marginTop: "0.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ background: "rgba(167, 244, 50, 0.15)", color: "var(--color-primary)", padding: "0.15rem 0.5rem", borderRadius: "6px", fontWeight: "700", fontSize: "0.85rem" }}>
                {t.dashboard.level} {user.level}
              </span>
              <span>• {user.xp} XP total</span>
            </p>
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
                padding: "0.4rem 0.85rem",
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
        </div>

        {/* Navigation Tabs (Mi Progreso vs Ranking Global) */}
        <div style={{ display: "flex", gap: "1.5rem", marginBottom: "1.5rem", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "0.25rem" }}>
          <button 
            onClick={() => setActiveTab("progress")}
            style={{ 
              fontSize: "1.05rem", fontWeight: "700", display: "flex", alignItems: "center", gap: "0.5rem",
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
              fontSize: "1.05rem", fontWeight: "700", display: "flex", alignItems: "center", gap: "0.5rem",
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
            {/* Main Progress Card (UNFOLDED / EXPANDED by default) */}
            <div className="card" style={{ marginBottom: "2rem", padding: "1.25rem", background: "var(--color-surface)", border: "1px solid rgba(255,255,255,0.08)" }}>
              
              {/* Accordion Summary Header */}
              <div 
                onClick={() => setIsProgressExpanded(!isProgressExpanded)}
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", userSelect: "none" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                  <FaBolt className="text-warning" size={16} />
                  <span style={{ fontWeight: "700", fontSize: "1.05rem" }}>{t.dashboard.levelProgress || "Nivel"} {user.level}</span>
                  <span style={{ fontSize: "0.8rem", color: "var(--color-primary)", fontWeight: "700", background: "rgba(167, 244, 50, 0.12)", padding: "0.15rem 0.5rem", borderRadius: "6px" }}>
                    {levelProgressPercent}% completado
                  </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <span style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", fontWeight: "600" }}>
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

              {/* Level XP Progress Bar */}
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

              {/* Expanded Progress Body */}
              {isProgressExpanded && (
                <div className="animate-fade-in" style={{ marginTop: "1.25rem", paddingTop: "1rem", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                  
                  {/* Coverage & Mastery Row */}
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

                  {/* Status Breakdown Chips */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: "700" }}>
                        Desglose por Estado de Memoria
                      </span>
                    </div>

                    <div style={{ width: "100%", height: "8px", background: "rgba(255,255,255,0.06)", borderRadius: "var(--radius-full)", overflow: "hidden", display: "flex", marginBottom: "0.75rem" }}>
                      {domPct > 0 && <div style={{ width: `${domPct}%`, background: "#10B981" }} title={`Dominados: ${masteredCount}`} />}
                      {famPct > 0 && <div style={{ width: `${famPct}%`, background: "#F59E0B" }} title={`Familiar: ${familiarCount}`} />}
                      {lrnPct > 0 && <div style={{ width: `${lrnPct}%`, background: "#3B82F6" }} title={`Aprendiendo: ${learningCount}`} />}
                      {unsPct > 0 && <div style={{ width: `${unsPct}%`, background: "rgba(255,255,255,0.15)" }} title={`Por Descubrir: ${unseenCount}`} />}
                    </div>

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

            {/* Main Game Mode Categories */}
            
            {/* Category 1: Modo Conquista (Hero Featured Card) */}
            <div style={{ marginBottom: "2rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                <span style={{ fontSize: "1.25rem" }}>⚔️</span>
                <h2 style={{ fontSize: "1.35rem", fontWeight: "900", margin: 0 }}>
                  {lang === 'en' ? "Conquest Mode" : "Modo Conquista"}
                </h2>
              </div>

              <Link 
                href="/learn/continents" 
                className="hover-scale"
                style={{ 
                  textDecoration: "none", 
                  display: "block", 
                  padding: "1.75rem",
                  borderRadius: "16px",
                  background: "linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(16, 185, 129, 0.15))",
                  border: "2px solid rgba(59, 130, 246, 0.4)",
                  boxShadow: "0 8px 30px rgba(59, 130, 246, 0.15)",
                  position: "relative",
                  overflow: "hidden"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
                  <div style={{ maxWidth: "600px" }}>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", background: "rgba(59, 130, 246, 0.2)", color: "#60A5FA", padding: "0.2rem 0.6rem", borderRadius: "20px", fontSize: "0.8rem", fontWeight: "800", marginBottom: "0.75rem" }}>
                      <FaCompass /> {lang === 'en' ? "Recommended Mode" : "Modo Principal de Juego"}
                    </div>
                    <h3 style={{ fontSize: "1.5rem", fontWeight: "900", color: "#fff", margin: 0 }}>
                      {lang === 'en' ? "Conquer Continents & Sub-regions" : "Conquista Continentes y Sub-regiones"}
                    </h3>
                    <p style={{ fontSize: "0.95rem", color: "var(--color-text-muted)", marginTop: "0.5rem", lineHeight: "1.5" }}>
                      {lang === 'en' 
                        ? "Select specific continents or smaller sub-region blocks with difficulty ratings (Easy, Medium, Hard) to master flags step by step." 
                        : "Elige continentes o bloques territoriales más pequeños clasificados por dificultad (Fácil, Medio, Difícil) para dominar banderas paso a paso."}
                    </p>
                  </div>

                  <div 
                    style={{ 
                      background: "#3B82F6", 
                      color: "#fff", 
                      fontWeight: "800", 
                      padding: "0.85rem 1.75rem", 
                      borderRadius: "12px",
                      fontSize: "1.05rem",
                      boxShadow: "0 4px 14px rgba(59, 130, 246, 0.4)",
                      whiteSpace: "nowrap"
                    }}
                  >
                    {lang === 'en' ? "Choose Region →" : "Elegir Región →"}
                  </div>
                </div>
              </Link>
            </div>

            {/* Category 2: Otros Retos */}
            <div style={{ marginBottom: "2rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                <span style={{ fontSize: "1.25rem" }}>🔥</span>
                <h2 style={{ fontSize: "1.35rem", fontWeight: "900", margin: 0 }}>
                  {lang === 'en' ? "Other Special Challenges" : "Otros Retos Especiales"}
                </h2>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem" }}>
                
                {/* Repasar Errores */}
                <Link href="/learn/weaknesses" className="card hover-scale" style={{ textDecoration: "none", display: "block", padding: "1.25rem", border: "1px solid rgba(239, 68, 68, 0.3)", background: "linear-gradient(135deg, rgba(239, 68, 68, 0.08), var(--color-surface))" }}>
                  <FaRedo size={26} className="text-danger" style={{ marginBottom: "0.75rem" }} />
                  <h3 style={{ fontSize: "1.1rem", color: "#EF4444", fontWeight: "800" }}>{t.dashboard.modes.weaknesses.title}</h3>
                  <p className="text-muted" style={{ fontSize: "0.85rem", marginTop: "0.25rem" }}>{t.dashboard.modes.weaknesses.desc}</p>
                </Link>

                {/* Reto Espacial / Mapa */}
                <Link href="/learn/spatial" className="card hover-scale" style={{ textDecoration: "none", display: "block", padding: "1.25rem", border: "1px solid rgba(16, 185, 129, 0.3)", background: "linear-gradient(135deg, rgba(16, 185, 129, 0.08), var(--color-surface))" }}>
                  <FaMapMarkerAlt size={26} className="text-success" style={{ marginBottom: "0.75rem" }} />
                  <h3 style={{ fontSize: "1.1rem", color: "#10B981", fontWeight: "800" }}>{t.dashboard.modes.spatial.title}</h3>
                  <p className="text-muted" style={{ fontSize: "0.85rem", marginTop: "0.25rem" }}>{t.dashboard.modes.spatial.desc}</p>
                </Link>

                {/* Todo el Mundo */}
                <Link href="/learn/world" className="card hover-scale" style={{ textDecoration: "none", display: "block", padding: "1.25rem" }}>
                  <FaGlobe size={26} className="text-primary" style={{ marginBottom: "0.75rem" }} />
                  <h3 style={{ fontSize: "1.1rem", fontWeight: "800" }}>{t.dashboard.modes.world.title}</h3>
                  <p className="text-muted" style={{ fontSize: "0.85rem", marginTop: "0.25rem" }}>{t.dashboard.modes.world.desc}</p>
                </Link>

                {/* Cazatesoros de Islas */}
                <Link href="/learn/continents?continent=Islas" className="card hover-scale" style={{ textDecoration: "none", display: "block", padding: "1.25rem", border: "1px solid rgba(245, 158, 11, 0.3)", background: "linear-gradient(135deg, rgba(245, 158, 11, 0.08), var(--color-surface))" }}>
                  <span style={{ fontSize: "1.75rem", display: "block", marginBottom: "0.5rem" }}>🏴‍☠️</span>
                  <h3 style={{ fontSize: "1.1rem", color: "#F59E0B", fontWeight: "800" }}>Cazatesoros de Islas</h3>
                  <p className="text-muted" style={{ fontSize: "0.85rem", marginTop: "0.25rem" }}>Domina las islas y territorios dependientes del mundo.</p>
                </Link>

              </div>
            </div>

            {/* Quick Access Tools: Tu Mapa Global & Directorio de Banderas */}
            <div style={{ marginBottom: "2rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                <span style={{ fontSize: "1.25rem" }}>🛠️</span>
                <h2 style={{ fontSize: "1.35rem", fontWeight: "900", margin: 0 }}>
                  {lang === 'en' ? "Exploration & Tools" : "Exploración y Directorio"}
                </h2>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1rem" }}>
                
                {/* Tu Mapa Global */}
                <Link href="/map" className="card hover-scale" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "1rem", padding: "1.25rem", background: "var(--color-surface)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "rgba(59, 130, 246, 0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#3B82F6" }}>
                    <FaMapMarkedAlt size={24} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: "1.1rem", fontWeight: "800", margin: 0 }}>{t.dashboard.modes.global.title}</h3>
                    <p className="text-muted" style={{ fontSize: "0.8rem", marginTop: "0.2rem" }}>{t.dashboard.modes.global.desc}</p>
                  </div>
                </Link>

                {/* Ver Todas las Banderas */}
                <Link href="/flags" className="card hover-scale" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "1rem", padding: "1.25rem", background: "var(--color-surface)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "rgba(168, 85, 247, 0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#A855F7" }}>
                    <FaFlag size={24} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: "1.1rem", fontWeight: "800", margin: 0 }}>{t.dashboard.modes.allFlags?.title || "Ver todas las banderas"}</h3>
                    <p className="text-muted" style={{ fontSize: "0.8rem", marginTop: "0.2rem" }}>{t.dashboard.modes.allFlags?.desc || "Explora el directorio completo y filtra por región."}</p>
                  </div>
                </Link>

              </div>
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
    </div>
  );
}
