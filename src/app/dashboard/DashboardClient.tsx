"use client";

import { useState } from "react";
import Link from "next/link";
import { FaFire, FaStar, FaGlobe, FaTrophy, FaMapMarkerAlt, FaChartBar, FaMedal, FaCheckCircle, FaBookOpen, FaQuestionCircle, FaBolt } from "react-icons/fa";
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
  unseenCount = 244
}: { 
  user: any; 
  totalCountries?: number;
  masteredCount?: number; 
  familiarCount?: number;
  learningCount?: number; 
  unseenCount?: number;
}) {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState("progress");

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

  return (
    <div className="container animate-fade-in" style={{ padding: "2rem", maxWidth: "1200px" }}>
      <header className="flex justify-between items-center" style={{ marginBottom: "2.5rem" }}>
        <div>
          <h1 style={{ fontSize: "2rem", fontWeight: "800" }}>{t.dashboard.title}, {user.name?.split(" ")[0] || "User"} 👋</h1>
          <p className="text-muted" style={{ fontSize: "1.125rem", marginTop: "0.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ background: "rgba(167, 244, 50, 0.15)", color: "var(--color-primary)", padding: "0.2rem 0.6rem", borderRadius: "8px", fontWeight: "700", fontSize: "0.875rem" }}>
              {t.dashboard.level} {user.level}
            </span>
            <span>• {user.xp} XP total</span>
          </p>
        </div>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <LanguageSelector />
          <div className="flex gap-2 items-center" style={{ background: "var(--color-surface)", padding: "0.5rem 1rem", borderRadius: "var(--radius-full)", border: "1px solid rgba(255,255,255,0.05)" }}>
            <FaFire className="text-danger" />
            <span style={{ fontWeight: "600" }}>{user.currentStreak} {t.profile?.days || "días"}</span>
          </div>
          <LogoutButton text={t.dashboard.logout} />
        </div>
      </header>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "1.5rem", marginBottom: "2rem", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "0.5rem" }}>
        <button 
          onClick={() => setActiveTab("progress")}
          style={{ 
            fontSize: "1.125rem", fontWeight: "600", display: "flex", alignItems: "center", gap: "0.5rem",
            color: activeTab === "progress" ? "var(--color-primary)" : "var(--color-text-muted)",
            borderBottom: activeTab === "progress" ? "3px solid var(--color-primary)" : "3px solid transparent",
            paddingBottom: "0.5rem",
            marginBottom: "-0.5rem",
            background: "none",
            borderLeft: "none", borderRight: "none", borderTop: "none",
            cursor: "pointer"
          }}
        >
          <FaChartBar /> {t.dashboard.tabs?.progress || "Mi Progreso"}
        </button>
        <button 
          onClick={() => setActiveTab("ranking")}
          style={{ 
            fontSize: "1.125rem", fontWeight: "600", display: "flex", alignItems: "center", gap: "0.5rem",
            color: activeTab === "ranking" ? "var(--color-primary)" : "var(--color-text-muted)",
            borderBottom: activeTab === "ranking" ? "3px solid var(--color-primary)" : "3px solid transparent",
            paddingBottom: "0.5rem",
            marginBottom: "-0.5rem",
            background: "none",
            borderLeft: "none", borderRight: "none", borderTop: "none",
            cursor: "pointer"
          }}
        >
          <FaMedal /> {t.dashboard.tabs?.ranking || "Ranking Global"}
        </button>
      </div>

      {activeTab === "progress" ? (
        <>
          {/* Main Progress Container */}
          <div className="card" style={{ marginBottom: "2.5rem", padding: "2rem", background: "var(--color-surface)" }}>
            
            {/* Level XP Progress Bar */}
            <div style={{ marginBottom: "2rem", paddingBottom: "1.5rem", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="flex justify-between items-center mb-2">
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <FaBolt className="text-warning" />
                  <span style={{ fontWeight: "700", fontSize: "1.1rem" }}>{t.dashboard.levelProgress || "Progreso del Nivel"} {user.level}</span>
                </div>
                <span style={{ fontSize: "0.875rem", color: "var(--color-text-muted)", fontWeight: "600" }}>
                  {xpInLevel} / {xpNeededInLevel} XP ({levelProgressPercent}%)
                </span>
              </div>
              <div style={{ width: "100%", height: "14px", background: "rgba(255,255,255,0.08)", borderRadius: "var(--radius-full)", overflow: "hidden" }}>
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
              <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "0.5rem" }}>
                {xpNeededInLevel - xpInLevel} XP restantes para alcanzar el Nivel {user.level + 1}
              </p>
            </div>

            {/* Global Mastery & Coverage Dual Bars */}
            <div style={{ marginBottom: "2rem" }}>
              <h2 style={{ fontSize: "1.25rem", marginBottom: "1.25rem", fontWeight: "700" }}>{t.dashboard.globalProgress}</h2>
              
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem" }}>
                {/* Knowledge Coverage Bar */}
                <div style={{ background: "rgba(255,255,255,0.03)", padding: "1.25rem", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <div className="flex justify-between items-center mb-2">
                    <span style={{ fontWeight: "600", fontSize: "0.95rem" }}>{t.dashboard.knowledgeCoverage || "Cobertura de Conocimiento"}</span>
                    <span style={{ fontWeight: "800", color: "#3B82F6" }}>{coveragePercent}%</span>
                  </div>
                  <div style={{ width: "100%", height: "10px", background: "rgba(255,255,255,0.08)", borderRadius: "var(--radius-full)", overflow: "hidden", marginBottom: "0.5rem" }}>
                    <div style={{ height: "100%", width: `${coveragePercent}%`, background: "#3B82F6", borderRadius: "var(--radius-full)", transition: "width 0.8s ease-in-out" }} />
                  </div>
                  <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                    {totalExplored} de {totalCountries} países practicados al menos una vez
                  </p>
                </div>

                {/* Total Mastery Bar */}
                <div style={{ background: "rgba(255,255,255,0.03)", padding: "1.25rem", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <div className="flex justify-between items-center mb-2">
                    <span style={{ fontWeight: "600", fontSize: "0.95rem" }}>{t.dashboard.mastered || "Dominio Total"}</span>
                    <span style={{ fontWeight: "800", color: "var(--color-primary)" }}>{masteredPercent}%</span>
                  </div>
                  <div style={{ width: "100%", height: "10px", background: "rgba(255,255,255,0.08)", borderRadius: "var(--radius-full)", overflow: "hidden", marginBottom: "0.5rem" }}>
                    <div style={{ height: "100%", width: `${masteredPercent}%`, background: "var(--color-primary)", borderRadius: "var(--radius-full)", transition: "width 0.8s ease-in-out" }} />
                  </div>
                  <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                    {masteredCount} de {totalCountries} banderas memorizadas a largo plazo
                  </p>
                </div>
              </div>
            </div>

            {/* Detailed 4-Status Cards */}
            <div>
              <h3 style={{ fontSize: "1rem", color: "var(--color-text-muted)", marginBottom: "1rem", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: "700" }}>
                Desglose por Estado de Memoria
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "1rem" }}>
                
                {/* Dominados */}
                <div style={{ background: "rgba(167, 244, 50, 0.06)", border: "1px solid rgba(167, 244, 50, 0.2)", padding: "1rem", borderRadius: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--color-primary)", marginBottom: "0.5rem" }}>
                    <FaCheckCircle size={16} />
                    <span style={{ fontSize: "0.85rem", fontWeight: "700" }}>{t.dashboard.mastered || "Dominados"}</span>
                  </div>
                  <div style={{ fontSize: "1.5rem", fontWeight: "800" }}>{masteredCount}</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "0.2rem" }}>
                    {masteredPercent}% del total
                  </div>
                </div>

                {/* Familiar */}
                <div style={{ background: "rgba(245, 158, 11, 0.06)", border: "1px solid rgba(245, 158, 11, 0.2)", padding: "1rem", borderRadius: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#F59E0B", marginBottom: "0.5rem" }}>
                    <FaStar size={16} />
                    <span style={{ fontSize: "0.85rem", fontWeight: "700" }}>{t.dashboard.familiar || "Familiar"}</span>
                  </div>
                  <div style={{ fontSize: "1.5rem", fontWeight: "800" }}>{familiarCount}</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "0.2rem" }}>
                    Aciertos constantes
                  </div>
                </div>

                {/* Aprendiendo */}
                <div style={{ background: "rgba(59, 130, 246, 0.06)", border: "1px solid rgba(59, 130, 246, 0.2)", padding: "1rem", borderRadius: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#3B82F6", marginBottom: "0.5rem" }}>
                    <FaBookOpen size={16} />
                    <span style={{ fontSize: "0.85rem", fontWeight: "700" }}>{t.dashboard.learning || "Aprendiendo"}</span>
                  </div>
                  <div style={{ fontSize: "1.5rem", fontWeight: "800" }}>{learningCount}</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "0.2rem" }}>
                    En estudio activo
                  </div>
                </div>

                {/* Por Descubrir */}
                <div style={{ background: "rgba(255, 255, 255, 0.03)", border: "1px solid rgba(255, 255, 255, 0.08)", padding: "1rem", borderRadius: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--color-text-muted)", marginBottom: "0.5rem" }}>
                    <FaQuestionCircle size={16} />
                    <span style={{ fontSize: "0.85rem", fontWeight: "700" }}>{t.dashboard.unseen || "Por Descubrir"}</span>
                  </div>
                  <div style={{ fontSize: "1.5rem", fontWeight: "800", color: "var(--color-text-muted)" }}>{unseenCount}</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "0.2rem" }}>
                    Sin repeticiones
                  </div>
                </div>

              </div>
            </div>

          </div>

          <h2 style={{ fontSize: "1.5rem", marginBottom: "1.5rem", fontWeight: "800" }}>{t.dashboard.startSession}</h2>
          <div className="flex gap-4" style={{ flexWrap: "wrap" }}>
            <Link href="/learn/world" className="card" style={{ flex: "1", minWidth: "200px", textDecoration: "none", display: "block" }}>
              <FaGlobe size={32} className="text-primary" style={{ marginBottom: "1rem" }} />
              <h3>{t.dashboard.modes.world.title}</h3>
              <p className="text-muted" style={{ fontSize: "0.875rem", marginTop: "0.5rem" }}>{t.dashboard.modes.world.desc}</p>
            </Link>
            <Link href="/learn/continents" className="card" style={{ flex: "1", minWidth: "200px", textDecoration: "none", display: "block" }}>
              <FaStar size={32} className="text-warning" style={{ marginBottom: "1rem" }} />
              <h3>{t.dashboard.modes.continents.title}</h3>
              <p className="text-muted" style={{ fontSize: "0.875rem", marginTop: "0.5rem" }}>{t.dashboard.modes.continents.desc}</p>
            </Link>
            <Link href="/learn/weaknesses" className="card" style={{ flex: "1", minWidth: "200px", textDecoration: "none", display: "block" }}>
              <FaTrophy size={32} className="text-danger" style={{ marginBottom: "1rem" }} />
              <h3>{t.dashboard.modes.weaknesses.title}</h3>
              <p className="text-muted" style={{ fontSize: "0.875rem", marginTop: "0.5rem" }}>{t.dashboard.modes.weaknesses.desc}</p>
            </Link>
            <Link href="/learn/spatial" className="card" style={{ flex: "1", minWidth: "200px", textDecoration: "none", display: "block" }}>
              <FaMapMarkerAlt size={32} className="text-success" style={{ marginBottom: "1rem" }} />
              <h3>{t.dashboard.modes.spatial.title}</h3>
              <p className="text-muted" style={{ fontSize: "0.875rem", marginTop: "0.5rem" }}>{t.dashboard.modes.spatial.desc}</p>
            </Link>
            <Link href="/map" className="card" style={{ flex: "1", minWidth: "200px", textDecoration: "none", display: "block", background: "linear-gradient(135deg, var(--color-surface), var(--color-surface-hover))" }}>
              <FaGlobe size={32} className="text-primary" style={{ marginBottom: "1rem" }} />
              <h3>{t.dashboard.modes.global.title}</h3>
              <p className="text-muted" style={{ fontSize: "0.875rem", marginTop: "0.5rem" }}>{t.dashboard.modes.global.desc}</p>
            </Link>
          </div>
        </>
      ) : (
        <LeaderboardTab currentUserId={user.id} />
      )}
    </div>
  );
}
