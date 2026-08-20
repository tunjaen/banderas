"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/lib/LanguageContext";
import { useRouter } from "next/navigation";
import { FaMedal } from "react-icons/fa";

export default function LeaderboardTab({ currentUserId }: { currentUserId: string }) {
  const { t } = useLanguage();
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="card animate-fade-in" style={{ padding: "0", overflow: "hidden", background: "var(--color-surface)" }}>
      <div style={{ padding: "1.5rem", borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(167, 244, 50, 0.02)" }}>
        <h2 style={{ fontSize: "1.25rem", display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--color-primary)" }}>
          <FaMedal /> {t.leaderboard?.title || "Ranking Global"}
        </h2>
        <p className="text-muted" style={{ fontSize: "0.875rem", marginTop: "0.25rem" }}>
          {t.leaderboard?.subtitle || "Los 50 mejores jugadores por XP"}
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column" }}>
        {users.map((u, i) => {
          const isCurrentUser = u.id === currentUserId;
          let rankStyle = { color: "var(--color-text-muted)", fontWeight: "bold", fontSize: "1.25rem", width: "40px", textAlign: "center" as const };
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
                padding: "1rem 1.5rem",
                borderBottom: "1px solid rgba(255,255,255,0.03)",
                background: isCurrentUser ? "rgba(167, 244, 50, 0.05)" : "transparent",
                cursor: "pointer",
                transition: "background 0.2s"
              }}
              onMouseOver={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
              onMouseOut={(e) => (e.currentTarget.style.background = isCurrentUser ? "rgba(167, 244, 50, 0.05)" : "transparent")}
            >
              <div style={rankStyle}>#{i + 1}</div>
              
              <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "var(--color-surface-hover)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 1rem", fontSize: "1.25rem", fontWeight: "bold", color: "var(--color-primary)" }}>
                {u.name?.charAt(0).toUpperCase() || "U"}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: "600", fontSize: "1rem", color: isCurrentUser ? "var(--color-primary)" : "var(--color-text)" }}>
                  {u.name || "Player"} {isCurrentUser && `(${t.leaderboard?.you || "Tú"})`}
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                  {t.leaderboard?.level || "Nivel"} {u.level}
                </div>
              </div>

              <div style={{ fontWeight: "800", color: "var(--color-primary)", fontSize: "1.1rem" }}>
                {u.xp} XP
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
