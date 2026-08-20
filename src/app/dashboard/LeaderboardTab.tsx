"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/lib/LanguageContext";
import { useRouter } from "next/navigation";
import { FaMedal, FaMapMarkerAlt, FaRocket, FaTrophy, FaCompass } from "react-icons/fa";

export default function LeaderboardTab({ currentUserId }: { currentUserId: string }) {
  const { t } = useLanguage();
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [leaderboardMode, setLeaderboardMode] = useState<"general" | "spatial">("general");

  useEffect(() => {
    fetch("/api/leaderboard")
      .then(res => res.json())
      .then(data => {
        if (data.users) setUsers(data.users);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div style={{ padding: "2rem", textAlign: "center", color: "var(--color-text-muted)" }}>{t.leaderboard?.loading || "Cargando ranking..."}</div>;
  }

  // Sort logic depending on active mode
  const sortedUsers = [...users].sort((a, b) => {
    if (leaderboardMode === "spatial") {
      const aCorrect = a.spatialCorrect || 0;
      const bCorrect = b.spatialCorrect || 0;
      if (bCorrect !== aCorrect) return bCorrect - aCorrect;
      
      const aTotal = aCorrect + (a.spatialWrong || 0);
      const bTotal = bCorrect + (b.spatialWrong || 0);
      const aAcc = aTotal > 0 ? aCorrect / aTotal : 0;
      const bAcc = bTotal > 0 ? bCorrect / bTotal : 0;
      return bAcc - aAcc;
    }
    return (b.xp || 0) - (a.xp || 0);
  });

  const getSpatialBadge = (rank: number) => {
    if (rank === 0) return { title: "Cartógrafo Galáctico", icon: "🌌", color: "#A855F7" };
    if (rank === 1) return { title: "Navegante Estelar", icon: "🚀", color: "#3B82F6" };
    if (rank === 2) return { title: "Explorador Terrestre", icon: "🌍", color: "#10B981" };
    return { title: "Cadete Espacial", icon: "👨‍🚀", color: "var(--color-text-muted)" };
  };

  const currentSpatialUserIndex = sortedUsers.findIndex(u => u.id === currentUserId);
  const currentUserSpatialData = currentSpatialUserIndex !== -1 ? sortedUsers[currentSpatialUserIndex] : null;

  return (
    <div className="card animate-fade-in" style={{ padding: "0", overflow: "hidden", background: "var(--color-surface)" }}>
      {/* Header & Mode Switcher */}
      <div style={{ padding: "1.5rem 1.5rem 1rem", borderBottom: "1px solid rgba(255,255,255,0.05)", background: leaderboardMode === "spatial" ? "rgba(59, 130, 246, 0.04)" : "rgba(167, 244, 50, 0.02)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h2 style={{ fontSize: "1.25rem", display: "flex", alignItems: "center", gap: "0.5rem", color: leaderboardMode === "spatial" ? "#3B82F6" : "var(--color-primary)" }}>
              {leaderboardMode === "spatial" ? <FaRocket /> : <FaMedal />} 
              {leaderboardMode === "spatial" ? (t.leaderboard?.spatialTitle || "Salón de la Fama Espacial") : (t.leaderboard?.title || "Ranking Global")}
            </h2>
            <p className="text-muted" style={{ fontSize: "0.875rem", marginTop: "0.25rem" }}>
              {leaderboardMode === "spatial" ? (t.leaderboard?.spatialSubtitle || "Clasificación oficial por precisión y aciertos en el Globo 3D") : (t.leaderboard?.subtitle || "Los 50 mejores jugadores por XP")}
            </p>
          </div>

          {/* Sub-tab mode selector */}
          <div style={{ display: "flex", gap: "0.5rem", background: "rgba(255,255,255,0.05)", padding: "4px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.08)" }}>
            <button
              onClick={() => setLeaderboardMode("general")}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "8px",
                fontWeight: "700",
                fontSize: "0.875rem",
                cursor: "pointer",
                background: leaderboardMode === "general" ? "var(--color-primary)" : "transparent",
                color: leaderboardMode === "general" ? "#000" : "var(--color-text-muted)",
                border: "none",
                transition: "all 0.2s"
              }}
            >
              {t.leaderboard?.tabGeneral || "🏆 General (XP)"}
            </button>
            <button
              onClick={() => setLeaderboardMode("spatial")}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "8px",
                fontWeight: "700",
                fontSize: "0.875rem",
                cursor: "pointer",
                background: leaderboardMode === "spatial" ? "#3B82F6" : "transparent",
                color: leaderboardMode === "spatial" ? "#FFF" : "var(--color-text-muted)",
                border: "none",
                transition: "all 0.2s"
              }}
            >
              {t.leaderboard?.tabSpatial || "🚀 Mapa Espacial"}
            </button>
          </div>
        </div>

        {/* Spatial Mode Highlight Banner */}
        {leaderboardMode === "spatial" && (
          <div style={{ marginTop: "1.25rem", padding: "1rem", borderRadius: "12px", background: "linear-gradient(135deg, rgba(59, 130, 246, 0.12), rgba(168, 85, 247, 0.12))", border: "1px solid rgba(59, 130, 246, 0.2)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <div style={{ background: "rgba(59, 130, 246, 0.2)", padding: "0.75rem", borderRadius: "50%", color: "#60A5FA" }}>
                <FaCompass size={24} />
              </div>
              <div>
                <div style={{ fontSize: "0.875rem", fontWeight: "700", color: "#93C5FD" }}>
                  Modo Mapa Espacial (Globo 3D)
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                  Reconoce la ubicación geográfica exacta de los países en el planeta
                </div>
              </div>
            </div>

            {currentUserSpatialData && (
              <div style={{ textAlign: "right" as const }}>
                <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>Tu Rango Espacial</div>
                <div style={{ fontSize: "1rem", fontWeight: "800", color: "#60A5FA" }}>
                  #{currentSpatialUserIndex + 1} • {currentUserSpatialData.spatialCorrect || 0} aciertos
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Leaderboard List */}
      <div style={{ display: "flex", flexDirection: "column" }}>
        {sortedUsers.map((u, i) => {
          const isCurrentUser = u.id === currentUserId;
          let rankStyle = { color: "var(--color-text-muted)", fontWeight: "bold", fontSize: "1.25rem", width: "40px", textAlign: "center" as const };
          if (i === 0) rankStyle.color = "#FFD700"; // Gold
          if (i === 1) rankStyle.color = "#C0C0C0"; // Silver
          if (i === 2) rankStyle.color = "#CD7F32"; // Bronze

          const sCorrect = u.spatialCorrect || 0;
          const sWrong = u.spatialWrong || 0;
          const sTotal = sCorrect + sWrong;
          const sAcc = sTotal > 0 ? Math.round((sCorrect / sTotal) * 100) : 0;
          const spatialBadge = getSpatialBadge(i);

          return (
            <div 
              key={u.id} 
              onClick={() => router.push(`/player/${u.id}`)}
              style={{
                display: "flex",
                alignItems: "center",
                padding: "1rem 1.5rem",
                borderBottom: "1px solid rgba(255,255,255,0.03)",
                background: isCurrentUser 
                  ? (leaderboardMode === "spatial" ? "rgba(59, 130, 246, 0.08)" : "rgba(167, 244, 50, 0.05)") 
                  : "transparent",
                cursor: "pointer",
                transition: "background 0.2s"
              }}
              onMouseOver={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
              onMouseOut={(e) => (e.currentTarget.style.background = isCurrentUser ? (leaderboardMode === "spatial" ? "rgba(59, 130, 246, 0.08)" : "rgba(167, 244, 50, 0.05)") : "transparent")}
            >
              <div style={rankStyle}>#{i + 1}</div>
              
              <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: leaderboardMode === "spatial" ? "rgba(59, 130, 246, 0.15)" : "var(--color-surface-hover)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 1rem", fontSize: "1.25rem", fontWeight: "bold", color: leaderboardMode === "spatial" ? "#60A5FA" : "var(--color-primary)" }}>
                {u.name?.charAt(0).toUpperCase() || "U"}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: "600", fontSize: "1rem", color: isCurrentUser ? (leaderboardMode === "spatial" ? "#60A5FA" : "var(--color-primary)") : "var(--color-text)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  {u.name || "Player"} {isCurrentUser && `(${t.leaderboard?.you || "Tú"})`}
                </div>
                
                {leaderboardMode === "spatial" ? (
                  <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.1rem" }}>
                    <span style={{ color: spatialBadge.color, fontWeight: "600" }}>{spatialBadge.icon} {spatialBadge.title}</span>
                    <span>• {sTotal} partidas jugadas</span>
                  </div>
                ) : (
                  <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                    {t.leaderboard?.level || "Nivel"} {u.level}
                  </div>
                )}
              </div>

              {leaderboardMode === "spatial" ? (
                <div style={{ textAlign: "right" as const, display: "flex", alignItems: "center", gap: "1rem" }}>
                  <div>
                    <div style={{ fontWeight: "800", color: "#60A5FA", fontSize: "1.1rem" }}>
                      {sCorrect} <span style={{ fontSize: "0.75rem", fontWeight: "normal", color: "var(--color-text-muted)" }}>aciertos</span>
                    </div>
                    <div style={{ fontSize: "0.75rem", color: sAcc >= 80 ? "#10B981" : sAcc >= 50 ? "#F59E0B" : "var(--color-text-muted)", fontWeight: "700" }}>
                      {sAcc}% precisión
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ fontWeight: "800", color: "var(--color-primary)", fontSize: "1.1rem" }}>
                  {u.xp} XP
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
