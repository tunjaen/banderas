"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/lib/LanguageContext";
import { useRouter } from "next/navigation";
import { FaMedal, FaChevronDown, FaChevronUp } from "react-icons/fa";

export default function LeaderboardTab({ currentUserId }: { currentUserId: string }) {
  const { t } = useLanguage();
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLeaderboardExpanded, setIsLeaderboardExpanded] = useState(true);

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

  const currentUserIndex = users.findIndex(u => u.id === currentUserId);
  const displayedUsers = isLeaderboardExpanded ? users : users.slice(0, 5);

  return (
    <div className="card animate-fade-in" style={{ padding: "0", overflow: "hidden", background: "var(--color-surface)" }}>
      
      {/* Clickable Header with Accordion Toggle */}
      <div 
        onClick={() => setIsLeaderboardExpanded(!isLeaderboardExpanded)}
        style={{ 
          padding: "1.25rem 1.5rem", 
          borderBottom: isLeaderboardExpanded ? "1px solid rgba(255,255,255,0.05)" : "none", 
          background: "rgba(167, 244, 50, 0.02)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          cursor: "pointer",
          userSelect: "none"
        }}
      >
        <div>
          <h2 style={{ fontSize: "1.25rem", display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--color-primary)", margin: 0 }}>
            <FaMedal /> {t.leaderboard?.title || "Ranking Global"}
          </h2>
          <p className="text-muted" style={{ fontSize: "0.85rem", marginTop: "0.25rem", margin: 0 }}>
            {t.leaderboard?.subtitle || "Los 50 mejores jugadores por XP"}
            {currentUserIndex !== -1 && ` • Tu puesto: #${currentUserIndex + 1}`}
          </p>
        </div>

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
          {isLeaderboardExpanded ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column" }}>
        {displayedUsers.map((u, i) => {
          const isCurrentUser = u.id === currentUserId;
          let rankStyle = { color: "var(--color-text-muted)", fontWeight: "bold", fontSize: "1.1rem", width: "36px", textAlign: "center" as const };
          if (i === 0) rankStyle.color = "#FFD700"; // Gold
          if (i === 1) rankStyle.color = "#C0C0C0"; // Silver
          if (i === 2) rankStyle.color = "#CD7F32"; // Bronze

          return (
            <div 
              key={u.id} 
              onClick={() => router.push(`/player/${u.id}`)}
              style={{
                display: "flex",
                alignItems: "center",
                padding: "0.85rem 1.25rem",
                borderBottom: "1px solid rgba(255,255,255,0.03)",
                background: isCurrentUser ? "rgba(167, 244, 50, 0.05)" : "transparent",
                cursor: "pointer",
                transition: "background 0.2s"
              }}
              onMouseOver={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
              onMouseOut={(e) => (e.currentTarget.style.background = isCurrentUser ? "rgba(167, 244, 50, 0.05)" : "transparent")}
            >
              <div style={rankStyle}>#{i + 1}</div>
              
              <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "var(--color-surface-hover)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 0.75rem", fontSize: "1.1rem", fontWeight: "bold", color: "var(--color-primary)" }}>
                {u.name?.charAt(0).toUpperCase() || "U"}
              </div>

              <div style={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
                <div style={{ fontWeight: "600", fontSize: "0.95rem", color: isCurrentUser ? "var(--color-primary)" : "var(--color-text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {u.name || "Player"} {isCurrentUser && `(${t.leaderboard?.you || "Tú"})`}
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                  {t.leaderboard?.level || "Nivel"} {u.level}
                </div>
              </div>

              <div style={{ fontWeight: "800", color: "var(--color-primary)", fontSize: "1rem", marginLeft: "0.5rem" }}>
                {u.xp} XP
              </div>
            </div>
          );
        })}

        {!isLeaderboardExpanded && users.length > 5 && (
          <button
            onClick={() => setIsLeaderboardExpanded(true)}
            style={{
              padding: "0.75rem",
              background: "rgba(255,255,255,0.03)",
              border: "none",
              color: "var(--color-primary)",
              fontWeight: "700",
              fontSize: "0.85rem",
              cursor: "pointer",
              textAlign: "center"
            }}
          >
            Ver ranking completo ({users.length} jugadores) ↓
          </button>
        )}
      </div>
    </div>
  );
}
