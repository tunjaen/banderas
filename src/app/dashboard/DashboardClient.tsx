"use client";

import { useState } from "react";
import Link from "next/link";
import { FaFire, FaStar, FaGlobe, FaTrophy, FaMapMarkerAlt, FaChartBar, FaMedal } from "react-icons/fa";
import LogoutButton from "./LogoutButton";
import LanguageSelector from "@/components/LanguageSelector";
import { useLanguage } from "@/lib/LanguageContext";
import LeaderboardTab from "./LeaderboardTab";

export default function DashboardClient({ 
  user, 
  masteredCount, 
  learningCount 
}: { 
  user: any; 
  masteredCount: number; 
  learningCount: number; 
}) {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState("progress");

  const progressPercent = Math.round((masteredCount / 244) * 100);

  return (
    <div className="container animate-fade-in" style={{ padding: "2rem", maxWidth: "1200px" }}>
      <header className="flex justify-between items-center" style={{ marginBottom: "3rem" }}>
        <div>
          <h1 style={{ fontSize: "2rem", fontWeight: "800" }}>{t.dashboard.title}, {user.name?.split(" ")[0] || "User"} 👋</h1>
          <p className="text-muted" style={{ fontSize: "1.25rem", marginTop: "0.25rem" }}>
            {t.dashboard.level} {user.level} - {user.xp} XP
          </p>
        </div>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <LanguageSelector />
          <div className="flex gap-4 items-center" style={{ background: "var(--color-surface)", padding: "0.5rem 1rem", borderRadius: "var(--radius-full)" }}>
            <FaFire className="text-danger" />
            <span style={{ fontWeight: "600" }}>{user.currentStreak} días</span>
          </div>
          <LogoutButton text={t.dashboard.logout} />
        </div>
      </header>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "1rem", marginBottom: "2rem", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "0.5rem" }}>
        <button 
          onClick={() => setActiveTab("progress")}
          style={{ 
            fontSize: "1.125rem", fontWeight: "600", display: "flex", alignItems: "center", gap: "0.5rem",
            color: activeTab === "progress" ? "var(--color-primary)" : "var(--color-text-muted)",
            borderBottom: activeTab === "progress" ? "2px solid var(--color-primary)" : "2px solid transparent",
            paddingBottom: "0.5rem",
            marginBottom: "-0.5rem"
          }}
        >
          <FaChartBar /> {t.dashboard.tabs?.progress || "My Progress"}
        </button>
        <button 
          onClick={() => setActiveTab("ranking")}
          style={{ 
            fontSize: "1.125rem", fontWeight: "600", display: "flex", alignItems: "center", gap: "0.5rem",
            color: activeTab === "ranking" ? "var(--color-primary)" : "var(--color-text-muted)",
            borderBottom: activeTab === "ranking" ? "2px solid var(--color-primary)" : "2px solid transparent",
            paddingBottom: "0.5rem",
            marginBottom: "-0.5rem"
          }}
        >
          <FaMedal /> {t.dashboard.tabs?.ranking || "Global Ranking"}
        </button>
      </div>

      {activeTab === "progress" ? (
        <>
          {/* Stats Card */}
          <div className="card" style={{ marginBottom: "3rem", padding: "2rem" }}>
        <div className="flex justify-between items-center mb-4">
          <h2 style={{ fontSize: "1.25rem" }}>{t.dashboard.globalProgress}</h2>
          <span className="text-primary" style={{ fontWeight: "700", fontSize: "1.25rem" }}>{progressPercent}%</span>
        </div>
        
        <div style={{ width: "100%", height: "12px", background: "rgba(255,255,255,0.1)", borderRadius: "var(--radius-full)", overflow: "hidden", marginBottom: "1.5rem" }}>
          <div style={{ height: "100%", width: `${progressPercent}%`, background: "var(--color-primary)", borderRadius: "var(--radius-full)", transition: "width 1s ease-in-out" }}></div>
        </div>

        <div className="flex gap-6">
          <div>
            <p className="text-muted" style={{ fontSize: "0.875rem" }}>{t.dashboard.mastered}</p>
            <p style={{ fontSize: "1.25rem", fontWeight: "700" }}>{masteredCount} / 244</p>
          </div>
          <div>
            <p className="text-muted" style={{ fontSize: "0.875rem" }}>{t.dashboard.learning}</p>
            <p style={{ fontSize: "1.25rem", fontWeight: "700" }}>{learningCount}</p>
          </div>
        </div>
      </div>

      <h2 style={{ fontSize: "1.5rem", marginBottom: "1.5rem" }}>{t.dashboard.startSession}</h2>
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
