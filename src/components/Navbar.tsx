"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  FaGlobe, 
  FaFire, 
  FaStopwatch, 
  FaBars, 
  FaTimes
} from "react-icons/fa";
import LogoutButton from "@/app/dashboard/LogoutButton";
import LanguageSelector from "@/components/LanguageSelector";
import { useLanguage } from "@/lib/LanguageContext";

interface NavbarProps {
  user?: {
    name?: string | null;
    level?: number;
    xp?: number;
    currentStreak?: number;
  };
}

export default function Navbar({ user }: NavbarProps) {
  const { t, lang } = useLanguage();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isTimerEnabled, setIsTimerEnabled] = useState(false);
  const [onlineCount, setOnlineCount] = useState<number>(0);
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);
  const [showOnlineModal, setShowOnlineModal] = useState(false);
  const [pendingChallengesCount, setPendingChallengesCount] = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem("app-timer-enabled");
    if (saved === "true") setIsTimerEnabled(true);

    const fetchOnline = async () => {
      try {
        const res = await fetch("/api/online");
        if (res.ok) {
          const data = await res.json();
          setOnlineCount(data.count ?? 0);
          setOnlineUsers(data.users || []);
        }

        const chRes = await fetch("/api/challenges");
        if (chRes.ok) {
          const chData = await chRes.json();
          setPendingChallengesCount(chData.pendingCount || 0);
        }
      } catch (e) {
        console.error("Error fetching online status:", e);
      }
    };

    fetchOnline();
    const interval = setInterval(fetchOnline, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const toggleTimer = () => {
    const next = !isTimerEnabled;
    setIsTimerEnabled(next);
    localStorage.setItem("app-timer-enabled", String(next));
  };

  return (
    <>
      <header 
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          background: "rgba(13, 17, 23, 0.85)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          width: "100%"
        }}
      >
        <div 
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "0.75rem 1rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "0.5rem"
          }}
        >
          {/* Brand Logo */}
          <Link 
            href="/dashboard" 
            style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: "0.5rem", 
              textDecoration: "none",
              color: "#fff",
              flexShrink: 0
            }}
          >
            <div 
              style={{
                width: "38px",
                height: "38px",
                borderRadius: "10px",
                background: "linear-gradient(135deg, #10B981, #3B82F6)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)",
                flexShrink: 0
              }}
            >
              <FaGlobe size={22} color="#fff" />
            </div>
            <div className="brand-text">
              <span style={{ fontWeight: "800", fontSize: "1.1rem", letterSpacing: "-0.02em" }}>
                Banderas<span style={{ color: "var(--color-primary)" }}>Mundo</span>
              </span>
              {user?.level && (
                <span 
                  style={{
                    display: "inline-block",
                    marginLeft: "0.4rem",
                    fontSize: "0.7rem",
                    fontWeight: "800",
                    background: "rgba(167, 244, 50, 0.15)",
                    color: "var(--color-primary)",
                    padding: "0.1rem 0.4rem",
                    borderRadius: "4px"
                  }}
                >
                  Niv. {user.level}
                </span>
              )}
            </div>
          </Link>

          {/* Right Controls: Timer, Streak, Lang, Logout & Mobile Toggle */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            {/* Pending Challenges Badge */}
            {pendingChallengesCount > 0 && (
              <Link
                href="/dashboard"
                title="Retos pendientes por responder"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.3rem",
                  background: "rgba(239, 68, 68, 0.15)",
                  color: "#EF4444",
                  border: "1px solid rgba(239, 68, 68, 0.4)",
                  padding: "0.35rem 0.65rem",
                  borderRadius: "var(--radius-full)",
                  fontSize: "0.825rem",
                  fontWeight: "800",
                  textDecoration: "none"
                }}
              >
                <span>⚔️ ({pendingChallengesCount})</span>
              </Link>
            )}

            {/* Online Indicator Badge */}
            <button
              onClick={() => setShowOnlineModal(true)}
              title={lang === 'en' ? "Click to see online players" : "Haz clic para ver jugadores en línea"}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                background: "rgba(16, 185, 129, 0.12)",
                color: "#10B981",
                border: "1px solid rgba(16, 185, 129, 0.3)",
                padding: "0.35rem 0.65rem",
                borderRadius: "var(--radius-full)",
                fontSize: "0.825rem",
                fontWeight: "800",
                cursor: "pointer",
                transition: "all 0.2s"
              }}
            >
              <span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", background: "#10B981", boxShadow: "0 0 8px #10B981" }}></span>
              <span>{onlineCount} {lang === 'en' ? 'online' : 'online'}</span>
            </button>

            {/* Streak Counter */}
            {user?.currentStreak !== undefined && (
              <div 
                title={`${user.currentStreak} días seguidos jugando`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.3rem",
                  background: "rgba(239, 68, 68, 0.1)",
                  border: "1px solid rgba(239, 68, 68, 0.25)",
                  color: "#EF4444",
                  padding: "0.35rem 0.65rem",
                  borderRadius: "var(--radius-full)",
                  fontSize: "0.825rem",
                  fontWeight: "800"
                }}
              >
                <FaFire size={13} />
                <span>{user.currentStreak}d</span>
              </div>
            )}

            {/* Timer Toggle Button */}
            <button
              onClick={toggleTimer}
              title={isTimerEnabled ? (t.dashboard.timerOn || "Temporizador Activado (10s)") : (t.dashboard.timerOff || "Temporizador Desactivado")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.3rem",
                background: isTimerEnabled ? "rgba(245, 158, 11, 0.15)" : "rgba(255,255,255,0.05)",
                color: isTimerEnabled ? "#F59E0B" : "var(--color-text-muted)",
                border: `1px solid ${isTimerEnabled ? "rgba(245, 158, 11, 0.4)" : "rgba(255,255,255,0.08)"}`,
                padding: "0.35rem 0.65rem",
                borderRadius: "var(--radius-full)",
                fontSize: "0.825rem",
                fontWeight: "700",
                cursor: "pointer",
                transition: "all 0.2s"
              }}
            >
              <FaStopwatch size={13} style={{ opacity: isTimerEnabled ? 1 : 0.4 }} />
              <span>{isTimerEnabled ? "10s" : "OFF"}</span>
            </button>

            {/* Language Selector */}
            <div className="desktop-controls">
              <LanguageSelector />
            </div>

            {/* Logout Button */}
            <div className="desktop-controls">
              <LogoutButton text={t.dashboard.logout} />
            </div>

            {/* Mobile Options Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="mobile-menu-btn"
              aria-label="Abrir Opciones"
              style={{
                display: "none",
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#fff",
                width: "38px",
                height: "38px",
                borderRadius: "10px",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer"
              }}
            >
              {isMobileMenuOpen ? <FaTimes size={18} /> : <FaBars size={18} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Options Drawer */}
      {isMobileMenuOpen && (
        <div 
          className="animate-fade-in"
          style={{
            position: "fixed",
            top: "60px",
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999,
            background: "rgba(13, 20, 16, 0.98)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            padding: "1.25rem 1rem",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
            overflowY: "auto",
            borderTop: "1px solid rgba(255,255,255,0.08)"
          }}
        >
          {/* User Profile Header */}
          {user && (
            <div 
              style={{ 
                background: "rgba(255,255,255,0.05)", 
                padding: "0.85rem 1rem", 
                borderRadius: "12px", 
                border: "1px solid rgba(255,255,255,0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between"
              }}
            >
              <div>
                <div style={{ fontWeight: "800", fontSize: "0.95rem", color: "#fff" }}>
                  {user.name || "Jugador"}
                </div>
                <div style={{ fontSize: "0.8rem", color: "var(--color-primary)", fontWeight: "700", marginTop: "0.1rem" }}>
                  Nivel {user.level || 1} • {user.xp || 0} XP
                </div>
              </div>
              <LanguageSelector />
            </div>
          )}

          {/* Navigation Links */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <Link
              href="/dashboard"
              onClick={() => setIsMobileMenuOpen(false)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                padding: "0.85rem 1rem",
                borderRadius: "10px",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.06)",
                color: "#fff",
                fontWeight: "700",
                fontSize: "0.95rem",
                textDecoration: "none"
              }}
            >
              <span style={{ fontSize: "1.2rem" }}>🏠</span>
              <span>Dashboard</span>
            </Link>

            <Link
              href="/learn/continents"
              onClick={() => setIsMobileMenuOpen(false)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                padding: "0.85rem 1rem",
                borderRadius: "10px",
                background: "rgba(16, 185, 129, 0.1)",
                border: "1px solid rgba(16, 185, 129, 0.25)",
                color: "#10B981",
                fontWeight: "700",
                fontSize: "0.95rem",
                textDecoration: "none"
              }}
            >
              <span style={{ fontSize: "1.2rem" }}>⚔️</span>
              <span>Modo Conquista (Continentes)</span>
            </Link>

            <Link
              href="/learn/weaknesses"
              onClick={() => setIsMobileMenuOpen(false)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                padding: "0.85rem 1rem",
                borderRadius: "10px",
                background: "rgba(239, 68, 68, 0.1)",
                border: "1px solid rgba(239, 68, 68, 0.25)",
                color: "#EF4444",
                fontWeight: "700",
                fontSize: "0.95rem",
                textDecoration: "none"
              }}
            >
              <span style={{ fontSize: "1.2rem" }}>🎯</span>
              <span>Repasar Errores</span>
            </Link>

            <Link
              href="/map"
              onClick={() => setIsMobileMenuOpen(false)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                padding: "0.85rem 1rem",
                borderRadius: "10px",
                background: "rgba(59, 130, 246, 0.1)",
                border: "1px solid rgba(59, 130, 246, 0.25)",
                color: "#60A5FA",
                fontWeight: "700",
                fontSize: "0.95rem",
                textDecoration: "none"
              }}
            >
              <span style={{ fontSize: "1.2rem" }}>🌐</span>
              <span>Tu Mapa Global</span>
            </Link>

            <Link
              href="/flags"
              onClick={() => setIsMobileMenuOpen(false)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                padding: "0.85rem 1rem",
                borderRadius: "10px",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.06)",
                color: "#fff",
                fontWeight: "700",
                fontSize: "0.95rem",
                textDecoration: "none"
              }}
            >
              <span style={{ fontSize: "1.2rem" }}>📖</span>
              <span>Ver todas las Banderas</span>
            </Link>

            <Link
              href="/dashboard?tab=ranking"
              onClick={() => setIsMobileMenuOpen(false)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                padding: "0.85rem 1rem",
                borderRadius: "10px",
                background: "rgba(245, 158, 11, 0.1)",
                border: "1px solid rgba(245, 158, 11, 0.25)",
                color: "#F59E0B",
                fontWeight: "700",
                fontSize: "0.95rem",
                textDecoration: "none"
              }}
            >
              <span style={{ fontSize: "1.2rem" }}>🏆</span>
              <span>Ranking Global</span>
            </Link>
          </div>

          <div style={{ marginTop: "auto", paddingTop: "0.5rem" }}>
            <LogoutButton text={t.dashboard.logout} />
          </div>
        </div>
      )}

      {/* Responsive CSS */}
      <style jsx global>{`
        @media (max-width: 640px) {
          .brand-text {
            display: none !important;
          }
          .desktop-controls {
            display: none !important;
          }
          .mobile-menu-btn {
            display: flex !important;
          }
        }
      `}</style>

      {/* Online Players Modal */}
      {showOnlineModal && (
        <div 
          onClick={() => setShowOnlineModal(false)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999999,
            background: "rgba(10, 15, 12, 0.85)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem"
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="animate-fade-in"
            style={{
              maxWidth: "460px",
              width: "100%",
              maxHeight: "85vh",
              overflowY: "auto",
              background: "#16221B",
              borderRadius: "16px",
              border: "1px solid rgba(16, 185, 129, 0.3)",
              padding: "1.5rem",
              position: "relative",
              boxShadow: "0 20px 50px rgba(0,0,0,0.8)"
            }}
          >
            <button 
              onClick={() => setShowOnlineModal(false)}
              style={{ position: "absolute", top: "1rem", right: "1rem", background: "rgba(255,255,255,0.08)", border: "none", color: "#fff", width: "32px", height: "32px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
            >
              <FaTimes />
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
              <span style={{ display: "inline-block", width: "10px", height: "10px", borderRadius: "50%", background: "#10B981", boxShadow: "0 0 10px #10B981" }}></span>
              <h3 style={{ fontSize: "1.25rem", fontWeight: "800", color: "#fff", margin: 0 }}>
                {lang === 'en' ? "Online Players" : "Jugadores en Línea"} ({onlineUsers.length})
              </h3>
            </div>

            <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", marginBottom: "1.25rem" }}>
              {lang === 'en'
                ? "Active players navigating or playing right now:"
                : "Jugadores activos en la plataforma en este momento:"}
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {onlineUsers.length === 0 ? (
                <div style={{ padding: "2rem", textAlign: "center", color: "var(--color-text-muted)" }}>
                  {lang === 'en' ? "No active players right now" : "No hay jugadores en línea en este momento"}
                </div>
              ) : (
                onlineUsers.map((u) => (
                  <div
                    key={u.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      background: "rgba(255, 255, 255, 0.04)",
                      border: "1px solid rgba(255, 255, 255, 0.08)",
                      padding: "0.85rem 1rem",
                      borderRadius: "12px",
                      gap: "0.75rem"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <div
                        style={{
                          width: "36px",
                          height: "36px",
                          borderRadius: "50%",
                          background: "linear-gradient(135deg, #10B981, #3B82F6)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: "800",
                          color: "#fff",
                          fontSize: "0.9rem"
                        }}
                      >
                        {u.name ? u.name.charAt(0).toUpperCase() : "P"}
                      </div>

                      <div>
                        <div style={{ fontWeight: "800", fontSize: "0.95rem", color: "#fff", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                          <span>{u.name || "Jugador"}</span>
                          <span style={{ fontSize: "0.65rem", background: "rgba(16, 185, 129, 0.2)", color: "#10B981", padding: "0.1rem 0.4rem", borderRadius: "4px", fontWeight: "700" }}>🟢 En vivo</span>
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "0.1rem" }}>
                          Nivel {u.level || 1} • {u.xp || 0} XP • {u.currentStreak || 0}d racha
                        </div>
                      </div>
                    </div>

                    <Link
                      href={`/player/${u.id}`}
                      onClick={() => setShowOnlineModal(false)}
                      className="btn btn-outline"
                      style={{
                        padding: "0.35rem 0.75rem",
                        fontSize: "0.75rem",
                        borderRadius: "8px",
                        textTransform: "none",
                        letterSpacing: "normal"
                      }}
                    >
                      {lang === 'en' ? "Profile" : "Ver Perfil"}
                    </Link>
                  </div>
                ))
              )}
            </div>

            <button
              onClick={() => setShowOnlineModal(false)}
              className="btn btn-primary"
              style={{ width: "100%", marginTop: "1.25rem", padding: "0.75rem" }}
            >
              {lang === 'en' ? "Close" : "Cerrar"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
