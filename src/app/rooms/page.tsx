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

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedScope, setSelectedScope] = useState("Mundo");
  const [selectedQuestionCount, setSelectedQuestionCount] = useState(10);

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
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scope: selectedScope,
          totalQuestions: selectedQuestionCount
        })
      });
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
              onClick={() => setShowCreateModal(true)}
              disabled={loadingCreate}
              className="btn btn-primary hover-scale"
              style={{ width: "100%", padding: "0.95rem", fontSize: "1.05rem", borderRadius: "12px", gap: "0.5rem" }}
            >
              <span>👑 Configurar y Crear Sala (Anfitrión)</span>
              <FaArrowRight />
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
                ¿Tienes el código de sala de 4 caracteres (ej. 8K2X) de un amigo? Ingrésalo a continuación para entrar de inmediato.
              </p>
            </div>

            <form onSubmit={handleJoinRoom} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="EJEMPLO: 8K2X"
                maxLength={4}
                style={{
                  width: "100%",
                  padding: "0.85rem 1rem",
                  background: "rgba(0,0,0,0.3)",
                  border: "1.5px solid rgba(59, 130, 246, 0.4)",
                  borderRadius: "10px",
                  color: "#fff",
                  fontSize: "1.3rem",
                  fontWeight: "900",
                  letterSpacing: "3px",
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
                ¡Sé el primero en hacer clic en **Configurar y Crear Sala** arriba e invita a tus amigos!
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
                        <span style={{ fontWeight: "900", fontSize: "1.2rem", color: "var(--color-primary)", letterSpacing: "2px" }}>
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

      {/* Custom Creation Modal */}
      {showCreateModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 99999, background: "rgba(10, 15, 12, 0.85)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div className="card animate-fade-in" style={{ maxWidth: "480px", width: "100%", padding: "1.75rem", background: "#16221B", border: "1px solid rgba(16, 185, 129, 0.4)", borderRadius: "20px", position: "relative", boxShadow: "0 20px 50px rgba(0,0,0,0.8)" }}>
            <button
              onClick={() => setShowCreateModal(false)}
              style={{ position: "absolute", top: "1.25rem", right: "1.25rem", background: "none", border: "none", color: "var(--color-text-muted)", cursor: "pointer", fontSize: "1.2rem" }}
            >
              ✕
            </button>

            <h2 style={{ fontSize: "1.5rem", fontWeight: "900", color: "#fff", marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span>👑 Configurar Nueva Sala</span>
            </h2>
            <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)", marginBottom: "1.5rem" }}>
              Elige el continente y la cantidad de preguntas para la batalla multijugador.
            </p>

            {/* Scope / Continent Selector */}
            <div style={{ marginBottom: "1.25rem" }}>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "800", color: "#fff", marginBottom: "0.5rem" }}>
                🗺️ Selecciona Región / Continente:
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                {["Mundo", "Europa", "África", "Asia", "América", "Oceanía", "Islas"].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSelectedScope(s)}
                    style={{
                      padding: "0.65rem 0.85rem",
                      borderRadius: "10px",
                      fontSize: "0.9rem",
                      fontWeight: "800",
                      background: selectedScope === s ? "rgba(16, 185, 129, 0.2)" : "rgba(255,255,255,0.04)",
                      border: `1.5px solid ${selectedScope === s ? "#10B981" : "rgba(255,255,255,0.08)"}`,
                      color: selectedScope === s ? "#10B981" : "#fff",
                      cursor: "pointer"
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Total Questions Selector */}
            <div style={{ marginBottom: "1.75rem" }}>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "800", color: "#fff", marginBottom: "0.5rem" }}>
                🎯 Cantidad de Preguntas:
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.5rem" }}>
                {[10, 15, 25, 50].map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setSelectedQuestionCount(q)}
                    style={{
                      padding: "0.65rem",
                      borderRadius: "10px",
                      fontSize: "0.9rem",
                      fontWeight: "900",
                      background: selectedQuestionCount === q ? "rgba(59, 130, 246, 0.25)" : "rgba(255,255,255,0.04)",
                      border: `1.5px solid ${selectedQuestionCount === q ? "#3B82F6" : "rgba(255,255,255,0.08)"}`,
                      color: selectedQuestionCount === q ? "#60A5FA" : "#fff",
                      cursor: "pointer"
                    }}
                  >
                    {q} Qs
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => { setShowCreateModal(false); handleCreateRoom(); }}
              disabled={loadingCreate}
              className="btn btn-primary"
              style={{ width: "100%", padding: "0.95rem", fontSize: "1.05rem", borderRadius: "12px" }}
            >
              {loadingCreate ? "Creando..." : "🚀 ¡Crear y Entrar a la Sala!"}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
