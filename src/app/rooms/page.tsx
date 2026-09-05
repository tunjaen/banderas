"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { useLanguage } from "@/lib/LanguageContext";
import { FaPlus, FaUsers, FaArrowRight, FaGamepad, FaLock, FaGlobeAmericas, FaFire, FaSmile } from "react-icons/fa";
import SwordsIcon from "@/components/SwordsIcon";

interface RoomSummary {
  id: string;
  code: string;
  hostId: string;
  status: string;
  maxPlayers: number;
  players: { userId: string; name: string; isReady: boolean; isHost: boolean }[];
  createdAt: string;
}

export default function RoomsHubPage() {
  const router = useRouter();
  const { lang } = useLanguage();
  const [code, setCode] = useState("");
  const [loadingCreate, setLoadingCreate] = useState(false);
  const [loadingJoin, setLoadingJoin] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeRooms, setActiveRooms] = useState<RoomSummary[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);

  const fetchActiveRooms = async () => {
    try {
      const res = await fetch("/api/rooms");
      if (res.ok) {
        const data = await res.json();
        setActiveRooms(data.rooms || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingRooms(false);
    }
  };

  useEffect(() => {
    fetchActiveRooms();
    const interval = setInterval(fetchActiveRooms, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleCreateRoom = async () => {
    setLoadingCreate(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/rooms", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.room) {
        router.push(`/rooms/${data.room.code}`);
      } else {
        setErrorMsg(data.message || "Error al crear la sala");
      }
    } catch (e) {
      setErrorMsg("Error de conexión al crear la sala");
    } finally {
      setLoadingCreate(false);
    }
  };

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setLoadingJoin(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/rooms/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() })
      });
      const data = await res.json();
      if (res.ok && data.code) {
        router.push(`/rooms/${data.code}`);
      } else {
        setErrorMsg(data.message || "No se pudo unir a la sala");
      }
    } catch (e) {
      setErrorMsg("Error al conectar con la sala");
    } finally {
      setLoadingJoin(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--color-bg)" }}>
      <Navbar />

      <main className="container animate-fade-in" style={{ maxWidth: "850px", padding: "1.5rem 1rem", flex: 1 }}>
        
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", background: "linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(59, 130, 246, 0.2))", border: "1px solid rgba(16, 185, 129, 0.4)", padding: "0.4rem 1rem", borderRadius: "20px", color: "var(--color-primary)", fontWeight: "800", fontSize: "0.85rem", marginBottom: "0.75rem" }}>
            <span>👑 Modo Batalla en Sala (2 a 4 Jugadores)</span>
          </div>
          <h1 style={{ fontSize: "2.25rem", fontWeight: "900", margin: 0, color: "#fff" }}>
            Salas Multijugador en Vivo
          </h1>
          <p className="text-muted" style={{ fontSize: "1rem", marginTop: "0.4rem", maxWidth: "600px", margin: "0.4rem auto 0 auto" }}>
            Crea una sala privada, chatea con stickers expresivos y compite en tiempo real. **¡El primero que acierte la bandera gana el punto!**
          </p>
        </div>

        {errorMsg && (
          <div className="animate-fade-in" style={{ background: "rgba(239, 68, 68, 0.15)", border: "1px solid #EF4444", color: "#EF4444", padding: "0.85rem 1.25rem", borderRadius: "12px", marginBottom: "1.5rem", fontWeight: "700", textAlign: "center" }}>
            ⚠️ {errorMsg}
          </div>
        )}

        {/* Action Cards: Create Room vs Join Room */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.25rem", marginBottom: "2.5rem" }}>
          
          {/* Card 1: Create New Room */}
          <div className="card" style={{ padding: "1.75rem", background: "linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(13, 20, 16, 0.95))", border: "1px solid rgba(16, 185, 129, 0.3)", borderRadius: "16px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <div style={{ width: "52px", height: "52px", borderRadius: "14px", background: "linear-gradient(135deg, #10B981, #059669)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem", color: "#fff", marginBottom: "1rem", boxShadow: "0 6px 18px rgba(16, 185, 129, 0.3)" }}>
                <FaPlus />
              </div>
              <h2 style={{ fontSize: "1.4rem", fontWeight: "800", color: "#fff", marginBottom: "0.4rem" }}>
                Crear Nueva Sala
              </h2>
              <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)", lineHeight: "1.5", marginBottom: "1.5rem" }}>
                Sé el anfitrión (Host), obtén tu código de sala y convoca hasta 4 jugadores con chat y verificación en verde.
              </p>
            </div>

            <button
              onClick={handleCreateRoom}
              disabled={loadingCreate}
              className="btn btn-primary hover-scale"
              style={{ width: "100%", padding: "0.95rem", fontSize: "1.05rem", borderRadius: "12px", gap: "0.5rem" }}
            >
              {loadingCreate ? (
                <span>Creando sala...</span>
              ) : (
                <>
                  <span>👑 Crear Sala (Anfitrión)</span>
                  <FaArrowRight />
                </>
              )}
            </button>
          </div>

          {/* Card 2: Join via Code */}
          <div className="card" style={{ padding: "1.75rem", background: "linear-gradient(135deg, rgba(59, 130, 246, 0.08), rgba(13, 20, 16, 0.95))", border: "1px solid rgba(59, 130, 246, 0.3)", borderRadius: "16px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <div style={{ width: "52px", height: "52px", borderRadius: "14px", background: "linear-gradient(135deg, #3B82F6, #2563EB)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem", color: "#fff", marginBottom: "1rem", boxShadow: "0 6px 18px rgba(59, 130, 246, 0.3)" }}>
                <FaUsers />
              </div>
              <h2 style={{ fontSize: "1.4rem", fontWeight: "800", color: "#fff", marginBottom: "0.4rem" }}>
                Unirse con Código
              </h2>
              <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)", lineHeight: "1.5", marginBottom: "1rem" }}>
                ¿Tienes el código de sala de un amigo? Ingrésalo a continuación para entrar de inmediato.
              </p>
            </div>

            <form onSubmit={handleJoinRoom} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="EJEMPLO: R-4921"
                maxLength={6}
                style={{
                  width: "100%",
                  padding: "0.85rem 1rem",
                  background: "rgba(0,0,0,0.3)",
                  border: "1.5px solid rgba(59, 130, 246, 0.4)",
                  borderRadius: "10px",
                  color: "#fff",
                  fontSize: "1.1rem",
                  fontWeight: "800",
                  letterSpacing: "2px",
                  textAlign: "center",
                  textTransform: "uppercase"
                }}
              />

              <button
                type="submit"
                disabled={loadingJoin || !code.trim()}
                className="btn"
                style={{
                  width: "100%",
                  padding: "0.95rem",
                  fontSize: "1.05rem",
                  borderRadius: "12px",
                  background: "#3B82F6",
                  color: "#fff",
                  fontWeight: "800",
                  opacity: code.trim() ? 1 : 0.6,
                  cursor: code.trim() ? "pointer" : "not-allowed"
                }}
              >
                {loadingJoin ? "Entrando..." : "🎮 Unirme a la Sala"}
              </button>
            </form>
          </div>

        </div>

        {/* Public Rooms List */}
        <div style={{ background: "rgba(13, 20, 16, 0.8)", border: "1px solid rgba(255,255,255,0.08)", padding: "1.5rem", borderRadius: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
            <h3 style={{ fontSize: "1.2rem", fontWeight: "800", color: "#fff", margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ display: "inline-block", width: "10px", height: "10px", borderRadius: "50%", background: "#10B981", boxShadow: "0 0 10px #10B981" }}></span>
              <span>Salas Abiertas en Espera</span>
            </h3>
            <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", fontWeight: "600" }}>
              Se actualiza automáticamente
            </span>
          </div>

          {loadingRooms ? (
            <div style={{ padding: "2rem", textAlign: "center", color: "var(--color-text-muted)" }}>
              Cargando salas disponibles...
            </div>
          ) : activeRooms.length === 0 ? (
            <div style={{ padding: "2.5rem 1rem", textAlign: "center", background: "rgba(255,255,255,0.02)", borderRadius: "12px", border: "1px dashed rgba(255,255,255,0.08)" }}>
              <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>🏟️</div>
              <h4 style={{ color: "#fff", fontWeight: "700", margin: 0 }}>No hay salas públicas abiertas en este momento</h4>
              <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", marginTop: "0.25rem" }}>
                ¡Sé el primero en hacer clic en **Crear Nueva Sala** arriba e invita a tus amigos!
              </p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "0.85rem" }}>
              {activeRooms.map((r) => {
                const isFull = r.players.length >= r.maxPlayers;
                const readyCount = r.players.filter(p => p.isReady).length;

                return (
                  <div
                    key={r.id}
                    onClick={() => !isFull && router.push(`/rooms/${r.code}`)}
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: "12px",
                      padding: "1rem",
                      cursor: isFull ? "default" : "pointer",
                      transition: "all 0.2s",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      gap: "0.75rem"
                    }}
                    className={isFull ? "" : "hover-scale"}
                  >
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                        <span style={{ fontWeight: "900", fontSize: "1.1rem", color: "var(--color-primary)", letterSpacing: "1px" }}>
                          {r.code}
                        </span>
                        <span style={{ fontSize: "0.75rem", fontWeight: "800", padding: "0.15rem 0.5rem", borderRadius: "12px", background: isFull ? "rgba(239, 68, 68, 0.2)" : "rgba(16, 185, 129, 0.2)", color: isFull ? "#EF4444" : "#10B981" }}>
                          {isFull ? "Llena" : `${r.players.length}/${r.maxPlayers} Jugadores`}
                        </span>
                      </div>

                      <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
                        Anfitrión: <strong style={{ color: "#fff" }}>{r.players.find(p => p.isHost)?.name || "Jugador"}</strong>
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "#10B981", fontWeight: "700", marginTop: "0.2rem" }}>
                        💚 {readyCount}/{r.players.length} listos en verde
                      </div>
                    </div>

                    <button
                      disabled={isFull}
                      className="btn btn-outline"
                      style={{
                        padding: "0.45rem",
                        fontSize: "0.8rem",
                        borderRadius: "8px",
                        width: "100%",
                        borderColor: isFull ? "rgba(255,255,255,0.1)" : "var(--color-primary)",
                        color: isFull ? "var(--color-text-muted)" : "var(--color-primary)"
                      }}
                    >
                      {isFull ? "Sala Llena" : "Entrar a la Sala →"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
