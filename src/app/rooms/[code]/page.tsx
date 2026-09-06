"use client";

import { useState, useEffect, useRef, use } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { useLanguage } from "@/lib/LanguageContext";
import { FaCrown, FaCheckCircle, FaPaperPlane, FaTrophy, FaArrowRight, FaCopy, FaCheck, FaTimes, FaGlobe, FaCog, FaUndo } from "react-icons/fa";
import SwordsIcon from "@/components/SwordsIcon";

const EMOJI_STICKERS = ["🔥", "👑", "⚔️", "🥳", "🎯", "💣", "🤪", "🍿", "🚀", "💡", "💩", "💙", "👏", "😎", "🏆", "😱"];

const ROOM_TERRITORY_GROUPS = [
  {
    title: "🌐 Global",
    items: [
      { id: "Mundo", label: "Todo el Mundo (244 Países)", isContinent: true }
    ]
  },
  {
    title: "🌍 África",
    items: [
      { id: "África", label: "Toda África (54 Países)", isContinent: true },
      { id: "Africa_NorthWest", label: "África Septentrional y Occidental" },
      { id: "Africa_East", label: "África Oriental" },
      { id: "Africa_CentralSouth", label: "África Central y Austral" }
    ]
  },
  {
    title: "🇪🇺 Europa",
    items: [
      { id: "Europa", label: "Toda Europa (49 Países)", isContinent: true },
      { id: "Europe_WestNorth", label: "Europa Occidental y del Norte" },
      { id: "Europe_South", label: "Europa del Sur y Mediterráneo" },
      { id: "Europe_East", label: "Europa Oriental y Central" }
    ]
  },
  {
    title: "🌏 Asia",
    items: [
      { id: "Asia", label: "Toda Asia (48 Países)", isContinent: true },
      { id: "Asia_EastSE", label: "Asia Oriental y Sudeste Asiático" },
      { id: "Asia_SouthCentral", label: "Asia del Sur y Central" },
      { id: "Asia_MiddleEast", label: "Oriente Medio y Cercano Oriente" }
    ]
  },
  {
    title: "🌎 América",
    items: [
      { id: "América", label: "Toda América (35 Países)", isContinent: true },
      { id: "America_NorthCentral", label: "América del Norte y Central" },
      { id: "America_Caribbean", label: "Caribe y Antillas" },
      { id: "America_South", label: "América del Sur" }
    ]
  },
  {
    title: "🏝️ Oceanía e Islas",
    items: [
      { id: "Oceanía", label: "Toda Oceanía (14 Países)", isContinent: true },
      { id: "Islas", label: "Cazatesoros de Islas (77 Países)" }
    ]
  }
];

interface Player {
  id: string;
  userId: string;
  name: string;
  image?: string;
  isReady: boolean;
  isHost: boolean;
  score: number;
  lastAnsweredQuestionIndex: number;
}

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  emoji: string;
  timestamp: number;
}

export default function RoomPlayPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const router = useRouter();
  const { lang } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [room, setRoom] = useState<any>(null);
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const [isMeHost, setIsMeHost] = useState(false);
  const [isMeReady, setIsMeReady] = useState(false);

  const [chatInput, setChatInput] = useState("");
  const [copiedCode, setCopiedCode] = useState(false);

  // Game state
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isAnswering, setIsAnswering] = useState(false);
  const [pointBanner, setPointBanner] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(10);
  const [isTimedOut, setIsTimedOut] = useState(false);
  const [simultaneousTimeLeft, setSimultaneousTimeLeft] = useState<number | null>(null);

  // Modals state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [onlinePlayers, setOnlinePlayers] = useState<any[]>([]);
  const [loadingOnline, setLoadingOnline] = useState(false);
  const [invitedUserIds, setInvitedUserIds] = useState<Record<string, boolean>>({});

  // Host Edit Settings state
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [editScopes, setEditScopes] = useState<string[]>([]);
  const [editQuestionCount, setEditQuestionCount] = useState<number>(10);
  const [savingSettings, setSavingSettings] = useState(false);
  const [resettingRoom, setResettingRoom] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const prevQuestionIndexRef = useRef<number>(-1);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const simultaneousTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hasAutoJoined = useRef(false);
  const isReadyTogglingRef = useRef(false);

  // Auto-join room when arriving via invitation link
  const autoJoinRoom = async () => {
    if (hasAutoJoined.current) return;
    hasAutoJoined.current = true;
    try {
      await fetch("/api/rooms/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code })
      });
    } catch (e) {
      console.error("Auto-join error:", e);
    }
  };

  const fetchRoomState = async () => {
    try {
      const res = await fetch(`/api/rooms/${code}`);
      if (res.ok) {
        const data = await res.json();
        setRoom(data.room);
        setCurrentQuestion(data.currentQuestion);
        setMessages(data.messages || []);
        setCurrentUserId(data.currentUserId);
        setIsMeHost(data.isMeHost);
        if (!isReadyTogglingRef.current) {
          setIsMeReady(data.isMeReady);
        }

        // Reset selected option & timer when question advances
        if (data.room.currentQuestionIndex !== prevQuestionIndexRef.current) {
          prevQuestionIndexRef.current = data.room.currentQuestionIndex;
          setSelectedOptionId(null);
          setIsAnswering(false);
          setIsTimedOut(false);
          setTimeLeft(10);
          setSimultaneousTimeLeft(null);
        }

        // Check if current question was claimed
        if (data.currentQuestion?.claimedBy && data.currentQuestion.claimedBy.name) {
          const winnerName = data.currentQuestion.claimedBy.name;
          const isWinnerMe = data.currentQuestion.claimedBy.userId === data.currentUserId;
          if (!isWinnerMe) {
            setPointBanner(`⚡ ¡${winnerName} acertó la bandera primero! Responde antes de que expire el tiempo para acierto simultáneo.`);
          }
        }
      } else if (res.status === 404) {
        router.push("/rooms");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    autoJoinRoom().then(() => fetchRoomState());
    const interval = setInterval(fetchRoomState, 1000);
    return () => clearInterval(interval);
  }, [code]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // 10-Second Main Timer Effect
  useEffect(() => {
    if (!room || room.status !== "PLAYING" || selectedOptionId !== null || isTimedOut) {
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current as NodeJS.Timeout);
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [room?.status, room?.currentQuestionIndex, selectedOptionId, isTimedOut]);

  // 2.5-Second Simultaneous Answer Countdown Effect
  useEffect(() => {
    if (
      !currentQuestion?.claimedBy ||
      selectedOptionId !== null ||
      isTimedOut ||
      currentQuestion.claimedBy.userId === currentUserId
    ) {
      setSimultaneousTimeLeft(null);
      if (simultaneousTimerRef.current) clearInterval(simultaneousTimerRef.current);
      return;
    }

    const claimedAt = currentQuestion.claimedBy.claimedAt || Date.now();
    const updateSimTimer = () => {
      const elapsed = Date.now() - claimedAt;
      const remainingMs = Math.max(0, 2500 - elapsed);
      const remainingSec = Math.round((remainingMs / 1000) * 10) / 10;
      setSimultaneousTimeLeft(remainingSec);

      if (remainingMs <= 0) {
        if (simultaneousTimerRef.current) clearInterval(simultaneousTimerRef.current);
        handleTimeout();
      }
    };

    updateSimTimer();
    simultaneousTimerRef.current = setInterval(updateSimTimer, 100);

    return () => {
      if (simultaneousTimerRef.current) clearInterval(simultaneousTimerRef.current);
    };
  }, [currentQuestion?.claimedBy, selectedOptionId, isTimedOut, currentUserId]);

  const handleTimeout = async () => {
    if (isTimedOut || selectedOptionId !== null) return;
    setIsTimedOut(true);
    setPointBanner("⏰ ¡Tiempo agotado! Tu respuesta fue inhabilitada (sin penalización).");

    try {
      await fetch(`/api/rooms/${code}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionIndex: room.currentQuestionIndex,
          isTimeout: true
        })
      });
      fetchRoomState();
    } catch (e) {
      console.error("Error sending timeout:", e);
    }
  };

  const openInviteModal = async () => {
    setShowInviteModal(true);
    setLoadingOnline(true);
    try {
      const res = await fetch("/api/online");
      if (res.ok) {
        const data = await res.json();
        setOnlinePlayers(data.users || []);
      }
    } catch (e) {
      console.error("Error fetching online players:", e);
    } finally {
      setLoadingOnline(false);
    }
  };

  const handleSendInvite = async (targetUserId: string) => {
    try {
      const res = await fetch(`/api/rooms/${code}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId })
      });
      if (res.ok) {
        setInvitedUserIds(prev => ({ ...prev, [targetUserId]: true }));
      }
    } catch (e) {
      console.error("Error sending room invite:", e);
    }
  };

  const openSettingsModal = () => {
    const currentScope = room?.scope || "Mundo";
    setEditScopes(currentScope.split(",").map((s: string) => s.trim()).filter(Boolean));
    setEditQuestionCount(room?.totalQuestions || 10);
    setShowSettingsModal(true);
  };

  const toggleEditScope = (scopeId: string) => {
    if (editScopes.includes(scopeId)) {
      if (editScopes.length === 1) return; // keep at least 1
      setEditScopes(editScopes.filter(s => s !== scopeId));
    } else {
      if (scopeId === "Mundo") {
        setEditScopes(["Mundo"]);
      } else {
        const withoutWorld = editScopes.filter(s => s !== "Mundo");
        setEditScopes([...withoutWorld, scopeId]);
      }
    }
  };

  const handleSaveSettings = async () => {
    if (editScopes.length === 0) return;
    setSavingSettings(true);
    try {
      const res = await fetch(`/api/rooms/${code}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scope: editScopes.join(","),
          totalQuestions: editQuestionCount
        })
      });
      if (res.ok) {
        setShowSettingsModal(false);
        fetchRoomState();
      } else {
        const d = await res.json();
        alert(d.message || "Error al actualizar ajustes");
      }
    } catch (e) {
      console.error("Error saving settings:", e);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleResetRoom = async () => {
    setResettingRoom(true);
    try {
      const res = await fetch(`/api/rooms/${code}/reset`, {
        method: "POST"
      });
      if (res.ok) {
        fetchRoomState();
      } else {
        const d = await res.json();
        alert(d.message || "Error al reiniciar la sala");
      }
    } catch (e) {
      console.error("Error resetting room:", e);
    } finally {
      setResettingRoom(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleToggleReady = async () => {
    if (isReadyTogglingRef.current) return;
    isReadyTogglingRef.current = true;
    setIsMeReady((prev) => !prev);

    try {
      const res = await fetch(`/api/rooms/${code}/ready`, { method: "POST" });
      if (res.ok) {
        await fetchRoomState();
      } else {
        setIsMeReady((prev) => !prev);
      }
    } catch (e) {
      console.error("Error toggling ready state:", e);
      setIsMeReady((prev) => !prev);
    } finally {
      setTimeout(() => {
        isReadyTogglingRef.current = false;
      }, 1200);
    }
  };

  const handleStartGame = async () => {
    try {
      const res = await fetch(`/api/rooms/${code}/start`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || "No se pudo iniciar el juego");
      } else {
        fetchRoomState();
      }
    } catch (e) {
      console.error("Error starting game:", e);
    }
  };

  const handleSendChat = async (emojiToSend?: string) => {
    const text = chatInput.trim();
    const emoji = emojiToSend || "";
    if (!text && !emoji) return;

    setChatInput("");
    try {
      await fetch(`/api/rooms/${code}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, emoji })
      });
      fetchRoomState();
    } catch (e) {
      console.error("Error sending chat:", e);
    }
  };

  const handleSelectOption = async (optionId: string) => {
    if (isAnswering || selectedOptionId !== null || !currentQuestion || isTimedOut) return;

    setSelectedOptionId(optionId);
    setIsAnswering(true);

    try {
      const res = await fetch(`/api/rooms/${code}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          countryId: optionId,
          questionIndex: room.currentQuestionIndex
        })
      });

      const data = await res.json();
      if (data.isCorrect && data.isFirst) {
        setPointBanner(`⚡ ¡Fuiste el más rápido! (+1 punto)`);
      } else if (data.isCorrect && data.isSimultaneous) {
        setPointBanner(`✨ ¡Acierto simultáneo! (+1 punto)`);
      } else if (!data.isCorrect) {
        setPointBanner(`💥 ¡Error! +1 punto otorgado a tus oponentes.`);
      }

      fetchRoomState();
    } catch (e) {
      console.error("Error submitting answer:", e);
    } finally {
      setIsAnswering(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--color-bg)" }}>
        <Navbar />
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ textAlign: "center", color: "var(--color-text-muted)" }}>
            <SwordsIcon size={40} className="animate-bounce" style={{ marginBottom: "1rem", color: "var(--color-primary)" }} />
            <p style={{ fontWeight: "800", fontSize: "1.1rem" }}>Conectando a la Sala {code}...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!room) return null;

  const players: Player[] = room.players || [];
  const unreadyPlayers = players.filter(p => !p.isReady);
  const canHostStart = isMeHost && players.length >= 2 && unreadyPlayers.length === 0;

  const isPlaying = room.status === "PLAYING";
  const isFinished = room.status === "FINISHED";
  const isWaiting = room.status === "WAITING";

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--color-bg)" }}>
      <Navbar />

      <main className="container animate-fade-in" style={{ maxWidth: "1000px", padding: "1rem", flex: 1, display: "flex", flexDirection: "column" }}>
        
        {/* Top Room Header Bar */}
        <div style={{ background: "rgba(13, 20, 16, 0.9)", border: "1px solid rgba(255,255,255,0.08)", padding: "0.75rem 1rem", borderRadius: "16px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.6rem", marginBottom: "1rem" }}>
          <div>
            <div style={{ fontSize: "0.75rem", color: "var(--color-primary)", fontWeight: "800", textTransform: "uppercase", display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap" }}>
              <span>👑 Sala Multijugador</span>
              <span>•</span>
              <span style={{ color: "#fff" }}>📍 {room.scope || "Mundo"}</span>
              <span>•</span>
              <span style={{ color: "#fff" }}>🎯 {room.totalQuestions} Preguntas</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.15rem" }}>
              <span style={{ fontSize: "1.25rem", fontWeight: "900", color: "#fff", letterSpacing: "1px" }}>
                Código: <span style={{ color: "var(--color-primary)" }}>{room.code}</span>
              </span>
              <button
                onClick={handleCopyCode}
                title="Copiar código de sala"
                style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", padding: "0.25rem 0.5rem", borderRadius: "8px", fontSize: "0.75rem", fontWeight: "700", display: "flex", alignItems: "center", gap: "0.3rem", cursor: "pointer" }}
              >
                {copiedCode ? <FaCheck color="#10B981" /> : <FaCopy />}
                <span>{copiedCode ? "¡Copiado!" : "Copiar"}</span>
              </button>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
            {isWaiting && isMeHost && (
              <button
                onClick={openSettingsModal}
                style={{ background: "rgba(245, 158, 11, 0.15)", color: "#F59E0B", border: "1px solid rgba(245, 158, 11, 0.4)", padding: "0.4rem 0.75rem", borderRadius: "20px", fontSize: "0.8rem", fontWeight: "800", display: "flex", alignItems: "center", gap: "0.35rem", cursor: "pointer" }}
              >
                <FaCog /> <span>Editar Ajustes</span>
              </button>
            )}

            {isWaiting && (
              <button
                onClick={openInviteModal}
                style={{ background: "linear-gradient(135deg, #3B82F6, #1D4ED8)", color: "#fff", border: "none", padding: "0.4rem 0.75rem", borderRadius: "20px", fontSize: "0.8rem", fontWeight: "800", display: "flex", alignItems: "center", gap: "0.35rem", cursor: "pointer", boxShadow: "0 0 12px rgba(59, 130, 246, 0.4)" }}
              >
                <span>📩 Invitar</span>
              </button>
            )}

            <span style={{ fontSize: "0.8rem", fontWeight: "800", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", padding: "0.4rem 0.75rem", borderRadius: "20px", color: "#fff" }}>
              👥 {players.length}/4
            </span>
            <button
              onClick={() => router.push("/rooms")}
              className="btn btn-outline"
              style={{ padding: "0.35rem 0.75rem", fontSize: "0.8rem" }}
            >
              Salir
            </button>
          </div>
        </div>

        {/* Floating Point Notification Banner */}
        {pointBanner && isPlaying && (
          <div className="animate-scale-up" style={{ position: "fixed", top: "75px", left: "50%", transform: "translateX(-50%)", zIndex: 9999, padding: "0.75rem 1.25rem", background: "linear-gradient(135deg, rgba(16, 185, 129, 0.95), rgba(59, 130, 246, 0.95))", border: "2px solid #10B981", color: "#FFF", borderRadius: "30px", fontWeight: "900", fontSize: "0.95rem", boxShadow: "0 10px 35px rgba(16, 185, 129, 0.5)", backdropFilter: "blur(10px)", pointerEvents: "none", maxWidth: "92vw", textAlign: "center" }}>
            {pointBanner}
          </div>
        )}

        {/* MAIN BODY: LOBBY vs GAME vs FINISHED */}
        {isWaiting && (
          <div className="lobby-container" style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "1rem", flex: 1 }}>
            
            {/* Left Column: Player Cards & Ready Action */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              
              {/* Ready / Start Control Card */}
              <div className="card" style={{ padding: "1.25rem", background: "rgba(13, 20, 16, 0.85)", border: "1px solid rgba(16, 185, 129, 0.3)", borderRadius: "16px", textAlign: "center" }}>
                <h3 style={{ fontSize: "1.15rem", fontWeight: "800", color: "#fff", marginBottom: "0.4rem" }}>
                  Estado de la Sala: <span style={{ color: "var(--color-primary)" }}>En Espera</span>
                </h3>
                <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", marginBottom: "1rem" }}>
                  Para iniciar la partida, todos los jugadores unidos deben pulsar el botón de preparación y ponerse en **verde (¡LISTO!)**.
                </p>

                <div style={{ display: "flex", justifyContent: "center", gap: "0.75rem", flexWrap: "wrap" }}>
                  {/* Ready Toggle Button */}
                  <button
                    onClick={handleToggleReady}
                    style={{
                      padding: "0.85rem 1.5rem",
                      borderRadius: "12px",
                      fontSize: "1rem",
                      fontWeight: "900",
                      background: isMeReady ? "linear-gradient(135deg, #10B981, #059669)" : "rgba(245, 158, 11, 0.15)",
                      color: isMeReady ? "#fff" : "#F59E0B",
                      border: `2px solid ${isMeReady ? "#10B981" : "#F59E0B"}`,
                      boxShadow: isMeReady ? "0 0 20px rgba(16, 185, 129, 0.5)" : "none",
                      cursor: "pointer",
                      transition: "all 0.2s ease-in-out",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.4rem"
                    }}
                  >
                    <span>{isMeReady ? "💚 ¡ESTOY LISTO!" : "🟡 PONERME LISTO"}</span>
                  </button>

                  {/* Host Start Button */}
                  {isMeHost && (
                    <button
                      onClick={handleStartGame}
                      disabled={!canHostStart}
                      className="btn btn-primary"
                      style={{
                        padding: "0.85rem 1.5rem",
                        borderRadius: "12px",
                        fontSize: "1rem",
                        fontWeight: "900",
                        opacity: canHostStart ? 1 : 0.4,
                        cursor: canHostStart ? "pointer" : "not-allowed",
                        boxShadow: canHostStart ? "0 0 20px rgba(167, 244, 50, 0.5)" : "none"
                      }}
                    >
                      <span>🚀 ¡EMPEZAR BATALLA!</span>
                    </button>
                  )}
                </div>

                {isMeHost && !canHostStart && (
                  <p style={{ fontSize: "0.785rem", color: "#F59E0B", fontWeight: "700", marginTop: "0.75rem" }}>
                    {players.length < 2
                      ? "⚠️ Esperando que se una al menos 1 jugador más..."
                      : "⚠️ Esperando que todos los jugadores se pongan en verde (¡LISTO!) para iniciar."}
                  </p>
                )}
              </div>

              {/* 2-4 Player Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: "0.75rem" }}>
                {Array.from({ length: 4 }).map((_, idx) => {
                  const p = players[idx];

                  if (!p) {
                    return (
                      <div
                        key={`empty_${idx}`}
                        style={{
                          background: "rgba(255,255,255,0.02)",
                          border: "2px dashed rgba(255,255,255,0.08)",
                          borderRadius: "16px",
                          padding: "1.25rem 0.75rem",
                          textAlign: "center",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          minHeight: "130px"
                        }}
                      >
                        <div style={{ fontSize: "1.6rem", opacity: 0.3, marginBottom: "0.3rem" }}>👤</div>
                        <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", fontWeight: "600" }}>
                          Slot Libre #{idx + 1}
                        </span>
                        <button
                          onClick={openInviteModal}
                          style={{ marginTop: "0.4rem", background: "rgba(59, 130, 246, 0.2)", border: "1px solid rgba(59, 130, 246, 0.4)", color: "#60A5FA", padding: "0.2rem 0.5rem", borderRadius: "8px", fontSize: "0.725rem", fontWeight: "700", cursor: "pointer" }}
                        >
                          + Invitar
                        </button>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={p.id}
                      style={{
                        background: p.isReady ? "rgba(16, 185, 129, 0.1)" : "rgba(255,255,255,0.03)",
                        border: `2px solid ${p.isReady ? "#10B981" : "rgba(255,255,255,0.08)"}`,
                        borderRadius: "16px",
                        padding: "1rem 0.75rem",
                        textAlign: "center",
                        position: "relative",
                        boxShadow: p.isReady ? "0 0 15px rgba(16, 185, 129, 0.2)" : "none",
                        transition: "all 0.3s ease"
                      }}
                    >
                      {p.isHost && (
                        <span style={{ position: "absolute", top: "8px", right: "8px", color: "#F59E0B", fontSize: "1rem" }} title="Anfitrión de la sala">
                          <FaCrown />
                        </span>
                      )}

                      {/* Avatar */}
                      <div
                        style={{
                          width: "48px",
                          height: "48px",
                          borderRadius: "50%",
                          background: p.isReady ? "linear-gradient(135deg, #10B981, #059669)" : "linear-gradient(135deg, #3B82F6, #1D4ED8)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          margin: "0 auto 0.5rem auto",
                          fontWeight: "900",
                          fontSize: "1.25rem",
                          color: "#fff",
                          boxShadow: p.isReady ? "0 0 12px #10B981" : "none"
                        }}
                      >
                        {p.name ? p.name.charAt(0).toUpperCase() : "P"}
                      </div>

                      <div style={{ fontWeight: "800", fontSize: "0.9rem", color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {p.name} {p.userId === currentUserId ? "(Tú)" : ""}
                      </div>

                      {/* Ready Badge */}
                      <div style={{ marginTop: "0.5rem" }}>
                        {p.isReady ? (
                          <span style={{ background: "#10B981", color: "#000", fontWeight: "900", fontSize: "0.7rem", padding: "0.2rem 0.6rem", borderRadius: "12px", display: "inline-flex", alignItems: "center", gap: "0.25rem", boxShadow: "0 0 8px #10B981" }}>
                            <FaCheckCircle /> ¡LISTO!
                          </span>
                        ) : (
                          <span style={{ background: "rgba(245, 158, 11, 0.2)", color: "#F59E0B", fontWeight: "800", fontSize: "0.7rem", padding: "0.2rem 0.6rem", borderRadius: "12px", border: "1px solid rgba(245, 158, 11, 0.4)" }}>
                            🟡 En Espera
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>

            {/* Right Column: Lobby Chat */}
            <div className="chat-container" style={{ background: "rgba(13, 20, 16, 0.9)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", display: "flex", flexDirection: "column", height: "480px", overflow: "hidden" }}>
              
              <div style={{ padding: "0.75rem 1rem", borderBottom: "1px solid rgba(255,255,255,0.08)", background: "rgba(0,0,0,0.2)", fontWeight: "800", fontSize: "0.9rem", color: "#fff", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <span>💬 Chat de Sala</span>
              </div>

              {/* Chat Messages */}
              <div style={{ flex: 1, padding: "0.75rem", overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {messages.map((m) => {
                  const isSys = m.senderId === "system";
                  const isMe = m.senderId === currentUserId;

                  if (isSys) {
                    return (
                      <div key={m.id} style={{ textAlign: "center", fontSize: "0.75rem", color: "var(--color-primary)", background: "rgba(167, 244, 50, 0.08)", padding: "0.35rem 0.6rem", borderRadius: "10px", border: "1px solid rgba(167, 244, 50, 0.15)" }}>
                        {m.emoji && <span style={{ marginRight: "0.3rem" }}>{m.emoji}</span>}
                        {m.text}
                      </div>
                    );
                  }

                  return (
                    <div
                      key={m.id}
                      style={{
                        alignSelf: isMe ? "flex-end" : "flex-start",
                        maxWidth: "85%",
                        background: isMe ? "rgba(16, 185, 129, 0.2)" : "rgba(255,255,255,0.06)",
                        border: `1px solid ${isMe ? "rgba(16, 185, 129, 0.4)" : "rgba(255,255,255,0.1)"}`,
                        borderRadius: "12px",
                        padding: "0.45rem 0.65rem"
                      }}
                    >
                      <div style={{ fontSize: "0.68rem", fontWeight: "800", color: isMe ? "#10B981" : "#60A5FA", marginBottom: "0.1rem" }}>
                        {m.senderName}
                      </div>
                      <div style={{ fontSize: "0.85rem", color: "#fff", wordBreak: "break-word" }}>
                        {m.emoji && <span style={{ fontSize: "1.1rem", marginRight: "0.3rem" }}>{m.emoji}</span>}
                        {m.text}
                      </div>
                    </div>
                  );
                })}
                <div ref={chatEndRef} />
              </div>

              {/* Emoji Sticker Bar */}
              <div style={{ padding: "0.35rem 0.5rem", background: "rgba(0,0,0,0.3)", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", gap: "0.3rem", overflowX: "auto" }}>
                {EMOJI_STICKERS.map((st) => (
                  <button
                    key={st}
                    onClick={() => handleSendChat(st)}
                    style={{ fontSize: "1rem", padding: "0.15rem 0.3rem", borderRadius: "6px", background: "rgba(255,255,255,0.05)", border: "none", cursor: "pointer" }}
                  >
                    {st}
                  </button>
                ))}
              </div>

              {/* Chat Input */}
              <form onSubmit={(e) => { e.preventDefault(); handleSendChat(); }} style={{ padding: "0.5rem", borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", gap: "0.35rem" }}>
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Escribe un mensaje..."
                  style={{ flex: 1, padding: "0.45rem 0.65rem", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#fff", fontSize: "0.8rem" }}
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim()}
                  style={{ padding: "0.45rem 0.75rem", background: "var(--color-primary)", color: "#000", border: "none", borderRadius: "8px", fontWeight: "800", cursor: chatInput.trim() ? "pointer" : "default" }}
                >
                  <FaPaperPlane />
                </button>
              </form>

            </div>

          </div>
        )}

        {/* LIVE GAME MODE (status == "PLAYING") */}
        {isPlaying && currentQuestion && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem", flex: 1 }}>
            
            {/* Live Scoreboard & Timer Bar */}
            <div style={{ display: "flex", gap: "0.6rem", alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ flex: 1, display: "grid", gridTemplateColumns: `repeat(${players.length}, 1fr)`, gap: "0.5rem" }}>
                {players.map((p) => (
                  <div
                    key={p.id}
                    style={{
                      background: "rgba(13, 20, 16, 0.9)",
                      border: `2px solid ${p.userId === currentUserId ? "var(--color-primary)" : "rgba(255,255,255,0.1)"}`,
                      borderRadius: "12px",
                      padding: "0.5rem 0.65rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#10B981", color: "#000", fontWeight: "900", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem" }}>
                        {p.name.charAt(0).toUpperCase()}
                      </div>
                      <span style={{ fontSize: "0.8rem", fontWeight: "800", color: "#fff", maxWidth: "70px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {p.name}
                      </span>
                    </div>
                    <span style={{ fontSize: "1rem", fontWeight: "900", color: "var(--color-primary)" }}>
                      {p.score} pts
                    </span>
                  </div>
                ))}
              </div>

              {/* 10s Countdown Bar */}
              <div style={{ background: "rgba(13, 20, 16, 0.9)", border: `2px solid ${timeLeft <= 3 ? "#EF4444" : "rgba(255,255,255,0.15)"}`, borderRadius: "12px", padding: "0.5rem 0.85rem", minWidth: "80px", textAlign: "center" }}>
                <div style={{ fontSize: "0.6rem", textTransform: "uppercase", color: "var(--color-text-muted)", fontWeight: "800" }}>Tiempo</div>
                <div style={{ fontSize: "1.1rem", fontWeight: "900", color: timeLeft <= 3 ? "#EF4444" : "var(--color-primary)" }}>
                  ⏱️ {timeLeft}s
                </div>
              </div>
            </div>

            {/* 2.5-Second Simultaneous Countdown Timer Banner */}
            {simultaneousTimeLeft !== null && simultaneousTimeLeft > 0 && selectedOptionId === null && !isTimedOut && (
              <div className="animate-pulse" style={{ background: "linear-gradient(135deg, #F59E0B, #D97706)", color: "#000", border: "2px solid #FBBF24", borderRadius: "14px", padding: "0.6rem 1rem", textAlign: "center", fontWeight: "900", fontSize: "0.95rem", boxShadow: "0 0 20px rgba(245, 158, 11, 0.6)" }}>
                ⚡ ¡{currentQuestion?.claimedBy?.name || "Un jugador"} acertó primero! Tienes <span style={{ fontSize: "1.2rem", textDecoration: "underline" }}>{simultaneousTimeLeft.toFixed(1)}s</span> para acertar también y llevarte el punto.
              </div>
            )}

            {/* Question Card */}
            <div className="card" style={{ padding: "1.5rem 1rem", textAlign: "center", background: "rgba(13, 20, 16, 0.9)", border: "1px solid rgba(167, 244, 50, 0.3)", borderRadius: "20px" }}>
              <div style={{ fontSize: "0.8rem", fontWeight: "800", color: "var(--color-primary)", textTransform: "uppercase", marginBottom: "0.5rem" }}>
                ⚡ Pregunta {room.currentQuestionIndex + 1} de {room.totalQuestions} • ¡El primero en acertar gana el punto!
              </div>

              {isTimedOut && (
                <div style={{ color: "#EF4444", fontWeight: "800", fontSize: "0.85rem", marginBottom: "0.6rem", background: "rgba(239, 68, 68, 0.1)", padding: "0.35rem", borderRadius: "8px" }}>
                  ⏰ ¡Tiempo agotado! Tu respuesta fue inhabilitada.
                </div>
              )}

              {currentQuestion.country && (
                <img
                  src={`https://flagcdn.com/w640/${currentQuestion.country.isoCode.toLowerCase()}.png`}
                  alt="Flag"
                  style={{ maxHeight: "170px", maxWidth: "100%", borderRadius: "10px", boxShadow: "0 8px 30px rgba(0,0,0,0.6)", margin: "0 auto 1.25rem auto" }}
                />
              )}

              {/* 4 Option Buttons Grid */}
              <div className="options-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", maxWidth: "550px", margin: "0 auto" }}>
                {currentQuestion.options.map((opt: any) => {
                  const isSelected = selectedOptionId === opt.id;
                  const isTarget = opt.id === currentQuestion.country.id;

                  let bg = "rgba(255,255,255,0.04)";
                  let border = "rgba(255,255,255,0.1)";

                  if (isSelected) {
                    if (isTarget) {
                      bg = "rgba(16, 185, 129, 0.3)";
                      border = "#10B981";
                    } else {
                      bg = "rgba(239, 68, 68, 0.3)";
                      border = "#EF4444";
                    }
                  } else if (currentQuestion.claimedBy && isTarget) {
                    bg = "rgba(16, 185, 129, 0.2)";
                    border = "#10B981";
                  }

                  return (
                    <button
                      key={opt.id}
                      onClick={() => handleSelectOption(opt.id)}
                      disabled={selectedOptionId !== null || isAnswering || isTimedOut}
                      style={{
                        padding: "1rem 0.75rem",
                        borderRadius: "12px",
                        background: bg,
                        border: `2px solid ${border}`,
                        color: "#fff",
                        fontWeight: "800",
                        fontSize: "0.95rem",
                        cursor: (selectedOptionId !== null || isTimedOut) ? "default" : "pointer",
                        opacity: isTimedOut ? 0.4 : 1,
                        transition: "all 0.2s ease-in-out"
                      }}
                    >
                      {lang === 'en' ? opt.nameEn : opt.name}
                    </button>
                  );
                })}
              </div>
            </div>

          </div>
        )}

        {/* FINISHED PODIUM MODE (status == "FINISHED") */}
        {isFinished && (
          <div className="card animate-fade-in" style={{ padding: "2rem 1.25rem", textAlign: "center", background: "rgba(13, 20, 16, 0.95)", borderRadius: "20px", border: "2px solid #F59E0B", boxShadow: "0 0 50px rgba(245, 158, 11, 0.3)", maxWidth: "600px", margin: "0 auto", width: "100%" }}>
            <div style={{ fontSize: "3.5rem", marginBottom: "0.3rem" }}>🏆</div>
            <h2 style={{ fontSize: "1.75rem", fontWeight: "900", color: "#fff", marginBottom: "0.4rem" }}>
              ¡Batalla Multijugador Finalizada!
            </h2>
            <p className="text-muted" style={{ fontSize: "0.9rem", marginBottom: "1.5rem" }}>
              Clasificación y puntajes de la sala {room.code}:
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.5rem" }}>
              {players.map((p, idx) => {
                const isWinner = idx === 0;
                const medal = idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : "🎖️";

                return (
                  <div
                    key={p.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "0.85rem 1rem",
                      borderRadius: "14px",
                      background: isWinner ? "rgba(245, 158, 11, 0.15)" : "rgba(255,255,255,0.04)",
                      border: `1.5px solid ${isWinner ? "#F59E0B" : "rgba(255,255,255,0.08)"}`
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                      <span style={{ fontSize: "1.3rem" }}>{medal}</span>
                      <div style={{ textAlign: "left" }}>
                        <div style={{ fontWeight: "900", fontSize: "0.95rem", color: "#fff" }}>
                          #{idx + 1} {p.name} {p.userId === currentUserId ? "(Tú)" : ""}
                        </div>
                        <div style={{ fontSize: "0.725rem", color: isWinner ? "#F59E0B" : "var(--color-text-muted)" }}>
                          +{p.score * 15 + (isWinner ? 30 : 10)} XP ganados
                        </div>
                      </div>
                    </div>

                    <div style={{ fontSize: "1.2rem", fontWeight: "900", color: "var(--color-primary)" }}>
                      {p.score} pts
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              <button
                onClick={handleResetRoom}
                disabled={resettingRoom}
                className="btn btn-primary"
                style={{ width: "100%", padding: "0.85rem", fontSize: "1rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem" }}
              >
                <FaUndo /> <span>{resettingRoom ? "Reiniciando..." : "Volver a la Sala (Nueva Partida)"}</span>
              </button>

              <button
                onClick={() => router.push("/rooms")}
                className="btn btn-outline"
                style={{ width: "100%", padding: "0.75rem", fontSize: "0.9rem" }}
              >
                🚪 Salir al Hub de Salas
              </button>
            </div>
          </div>
        )}

      </main>

      {/* Host Edit Settings Modal */}
      {showSettingsModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: "1rem" }}>
          <div className="animate-scale-up" style={{ background: "rgba(13, 20, 16, 0.98)", border: "1px solid rgba(245, 158, 11, 0.4)", borderRadius: "20px", padding: "1.5rem", maxWidth: "560px", width: "100%", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 50px rgba(0,0,0,0.8)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
              <h3 style={{ fontSize: "1.2rem", fontWeight: "900", color: "#fff", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span>⚙️ Ajustes de la Sala ({code})</span>
              </h3>
              <button
                onClick={() => setShowSettingsModal(false)}
                style={{ background: "none", border: "none", color: "var(--color-text-muted)", fontSize: "1.2rem", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            {/* Scope Selection */}
            <div style={{ marginBottom: "1.25rem" }}>
              <label style={{ fontSize: "0.85rem", fontWeight: "800", color: "var(--color-primary)", display: "block", marginBottom: "0.5rem" }}>
                📍 Seleccionar Continentes / Bloques de Juego
              </label>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                {ROOM_TERRITORY_GROUPS.map((group) => (
                  <div key={group.title} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", padding: "0.6rem 0.85rem", borderRadius: "12px" }}>
                    <div style={{ fontSize: "0.8rem", fontWeight: "800", color: "#fff", marginBottom: "0.4rem" }}>
                      {group.title}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "0.4rem" }}>
                      {group.items.map((item) => {
                        const isSelected = editScopes.includes(item.id);

                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => toggleEditScope(item.id)}
                            style={{
                              textAlign: "left",
                              padding: "0.4rem 0.6rem",
                              borderRadius: "8px",
                              fontSize: "0.785rem",
                              fontWeight: "700",
                              background: isSelected ? "rgba(16, 185, 129, 0.2)" : "rgba(255,255,255,0.04)",
                              border: `1px solid ${isSelected ? "#10B981" : "rgba(255,255,255,0.08)"}`,
                              color: isSelected ? "#10B981" : "#fff",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between"
                            }}
                          >
                            <span>{item.label}</span>
                            {isSelected && <FaCheck size={10} color="#10B981" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Total Questions Selection */}
            <div style={{ marginBottom: "1.25rem" }}>
              <label style={{ fontSize: "0.85rem", fontWeight: "800", color: "var(--color-primary)", display: "block", marginBottom: "0.5rem" }}>
                🎯 Número de Preguntas por Ronda
              </label>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                {[5, 10, 15, 20, 25, 30].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setEditQuestionCount(num)}
                    style={{
                      flex: 1,
                      padding: "0.5rem",
                      borderRadius: "10px",
                      fontWeight: "800",
                      fontSize: "0.85rem",
                      background: editQuestionCount === num ? "var(--color-primary)" : "rgba(255,255,255,0.05)",
                      color: editQuestionCount === num ? "#000" : "#fff",
                      border: `1px solid ${editQuestionCount === num ? "var(--color-primary)" : "rgba(255,255,255,0.1)"}`,
                      cursor: "pointer"
                    }}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", gap: "0.6rem" }}>
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="btn btn-outline"
                style={{ flex: 1, padding: "0.65rem" }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveSettings}
                disabled={savingSettings}
                className="btn btn-primary"
                style={{ flex: 1, padding: "0.65rem" }}
              >
                {savingSettings ? "Guardando..." : "Guardar Ajustes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invite Friends Modal */}
      {showInviteModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: "1rem" }}>
          <div className="animate-scale-up" style={{ background: "rgba(13, 20, 16, 0.98)", border: "1px solid rgba(59, 130, 246, 0.4)", borderRadius: "20px", padding: "1.5rem", maxWidth: "460px", width: "100%", boxShadow: "0 20px 50px rgba(0,0,0,0.8)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
              <h3 style={{ fontSize: "1.15rem", fontWeight: "900", color: "#fff", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <span>📩 Invitar Jugadores a la Sala</span>
              </h3>
              <button
                onClick={() => setShowInviteModal(false)}
                style={{ background: "none", border: "none", color: "var(--color-text-muted)", fontSize: "1.2rem", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginBottom: "1rem" }}>
              Envía una notificación instantánea a otros jugadores para que accedan directamente con un solo clic.
            </p>

            {loadingOnline ? (
              <div style={{ textAlign: "center", padding: "1.5rem", color: "var(--color-text-muted)" }}>
                Cargando jugadores disponibles...
              </div>
            ) : onlinePlayers.length === 0 ? (
              <div style={{ textAlign: "center", padding: "1.5rem", color: "var(--color-text-muted)", background: "rgba(255,255,255,0.02)", borderRadius: "12px", border: "1px dashed rgba(255,255,255,0.1)" }}>
                <p style={{ fontWeight: "700", fontSize: "0.9rem" }}>No hay otros jugadores en línea en este momento.</p>
                <p style={{ fontSize: "0.785rem", marginTop: "0.2rem" }}>¡Puedes compartir el código de sala <strong style={{ color: "var(--color-primary)" }}>{code}</strong>!</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxHeight: "280px", overflowY: "auto" }}>
                {onlinePlayers.map((u) => {
                  const isInvited = invitedUserIds[u.id];
                  const isInRoom = players.some(p => p.userId === u.id);

                  return (
                    <div
                      key={u.id}
                      style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", padding: "0.6rem 0.85rem", borderRadius: "12px" }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#3B82F6", color: "#fff", fontWeight: "900", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.85rem" }}>
                          {u.name ? u.name.charAt(0).toUpperCase() : "U"}
                        </div>
                        <div>
                          <div style={{ fontWeight: "800", fontSize: "0.85rem", color: "#fff" }}>{u.name}</div>
                          <div style={{ fontSize: "0.7rem", color: "#10B981" }}>🟢 En línea</div>
                        </div>
                      </div>

                      {isInRoom ? (
                        <span style={{ fontSize: "0.725rem", fontWeight: "800", color: "#10B981" }}>En la sala</span>
                      ) : isInvited ? (
                        <span style={{ fontSize: "0.725rem", fontWeight: "800", color: "#F59E0B" }}>Enviada ✉️</span>
                      ) : (
                        <button
                          onClick={() => handleSendInvite(u.id)}
                          style={{ background: "#3B82F6", color: "#fff", border: "none", padding: "0.35rem 0.75rem", borderRadius: "8px", fontSize: "0.75rem", fontWeight: "800", cursor: "pointer" }}
                        >
                          Invitar
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <button
              onClick={() => setShowInviteModal(false)}
              className="btn btn-outline"
              style={{ width: "100%", marginTop: "1rem", padding: "0.65rem" }}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Global CSS for Mobile Responsiveness */}
      <style jsx global>{`
        @media (max-width: 768px) {
          .lobby-container {
            grid-template-columns: 1fr !important;
          }
          .chat-container {
            height: 340px !important;
          }
          .options-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
