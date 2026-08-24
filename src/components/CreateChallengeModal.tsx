"use client";

import { useState, useEffect } from "react";
import { FaTimes, FaBolt, FaRunning, FaGlobe, FaCheck, FaUser } from "react-icons/fa";
import SwordsIcon from "@/components/SwordsIcon";
import { useRouter } from "next/navigation";

interface CreateChallengeModalProps {
  initialTargetUserId?: string;
  initialTargetUserName?: string;
  onClose: () => void;
}

interface TerritoryItem {
  id: string;
  label: string;
  count: number;
  isContinent?: boolean;
}

interface TerritoryGroup {
  title: string;
  items: TerritoryItem[];
}

const TERRITORY_GROUPS: TerritoryGroup[] = [
  {
    title: "🌐 Global",
    items: [
      { id: "world", label: "Todo el Mundo (244 Países)", count: 244, isContinent: true }
    ]
  },
  {
    title: "🌍 África",
    items: [
      { id: "África", label: "Toda África (54 Países)", count: 54, isContinent: true },
      { id: "Africa_NorthWest", label: "África Septentrional y Occidental (23 países)", count: 23 },
      { id: "Africa_East", label: "África Oriental (20 países)", count: 20 },
      { id: "Africa_CentralSouth", label: "África Central y Austral (14 países)", count: 14 }
    ]
  },
  {
    title: "🇪🇺 Europa",
    items: [
      { id: "Europa", label: "Toda Europa (49 Países)", count: 49, isContinent: true },
      { id: "Europe_WestNorth", label: "Europa Occidental y del Norte (21 países)", count: 21 },
      { id: "Europe_South", label: "Europa del Sur y Mediterráneo (17 países)", count: 17 },
      { id: "Europe_East", label: "Europa Oriental y Central (12 países)", count: 12 }
    ]
  },
  {
    title: "🌏 Asia",
    items: [
      { id: "Asia", label: "Toda Asia (48 Países)", count: 48, isContinent: true },
      { id: "Asia_EastSE", label: "Asia Oriental y Sudeste Asiático (18 países)", count: 18 },
      { id: "Asia_SouthCentral", label: "Asia del Sur y Central (13 países)", count: 13 },
      { id: "Asia_MiddleEast", label: "Oriente Medio y Cercano Oriente (18 países)", count: 18 }
    ]
  },
  {
    title: "🌎 América",
    items: [
      { id: "América", label: "Toda América (35 Países)", count: 35, isContinent: true },
      { id: "America_NorthCentral", label: "América del Norte y Central (12 países)", count: 12 },
      { id: "America_Caribbean", label: "Caribe y Antillas (20 países)", count: 20 },
      { id: "America_South", label: "América del Sur (14 países)", count: 14 }
    ]
  },
  {
    title: "🏝️ Oceanía e Islas",
    items: [
      { id: "Oceanía", label: "Toda Oceanía (14 Países)", count: 14, isContinent: true },
      { id: "Islas", label: "Cazatesoros de Islas (77 Países)", count: 77 }
    ]
  }
];

// Flat list for helper lookups
const ALL_TERRITORY_ITEMS = TERRITORY_GROUPS.flatMap(g => g.items);

export default function CreateChallengeModal({
  initialTargetUserId,
  initialTargetUserName,
  onClose
}: CreateChallengeModalProps) {
  const router = useRouter();
  const [players, setPlayers] = useState<any[]>([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>(initialTargetUserId || "");
  const [gameMode, setGameMode] = useState<"DOMINATION" | "LIGHTNING">("DOMINATION");
  
  const [selectedSubregions, setSelectedSubregions] = useState<string[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch all registered players in the database
    if (!initialTargetUserId) {
      fetch("/api/players")
        .then(res => res.json())
        .then(data => {
          if (data.users && data.users.length > 0) {
            setPlayers(data.users);
          }
        })
        .catch(e => console.error(e));
    }
  }, [initialTargetUserId]);

  const toggleSubregion = (subId: string) => {
    if (selectedSubregions.includes(subId)) {
      setSelectedSubregions(selectedSubregions.filter(s => s !== subId));
    } else {
      setSelectedSubregions([...selectedSubregions, subId]);
    }
  };

  // Calculate estimated total flags from selected blocks
  const totalFlagsSelected = selectedSubregions.reduce((acc, subId) => {
    const found = ALL_TERRITORY_ITEMS.find(s => s.id === subId);
    return acc + (found?.count || 15);
  }, 0);

  const handleSubmit = async () => {
    if (!selectedPlayerId) {
      setError("Por favor, selecciona a un jugador para retar.");
      return;
    }

    if (selectedSubregions.length === 0) {
      setError("Por favor, selecciona al menos un bloque territorial.");
      return;
    }

    setLoading(true);
    setError(null);

    const scopeValues = selectedSubregions.join(",");

    try {
      const res = await fetch("/api/challenges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challengedId: selectedPlayerId,
          gameMode,
          scopeType: "subregion_multi",
          scopeValues,
          targetScore: totalFlagsSelected
        })
      });

      if (res.ok) {
        const data = await res.json();
        onClose();
        // Redirect to challenge play page
        router.push(`/learn/challenge/${data.challenge.id}`);
      } else {
        const errData = await res.json();
        setError(errData.message || "Error al crear el reto");
      }
    } catch (err) {
      setError("Error de conexión al enviar el reto");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      onClick={onClose}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 999999,
        background: "rgba(10, 15, 12, 0.88)",
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
        className="card animate-fade-in"
        style={{
          maxWidth: "520px",
          width: "100%",
          maxHeight: "90vh",
          overflowY: "auto",
          background: "#16221B",
          borderRadius: "20px",
          border: "1px solid rgba(167, 244, 50, 0.3)",
          padding: "1.75rem",
          position: "relative",
          boxShadow: "0 25px 60px rgba(0,0,0,0.85)"
        }}
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          style={{ position: "absolute", top: "1.25rem", right: "1.25rem", background: "rgba(255,255,255,0.08)", border: "none", color: "#fff", width: "34px", height: "34px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
        >
          <FaTimes />
        </button>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem" }}>
          <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: "linear-gradient(135deg, #EF4444, #F59E0B)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "1.2rem", boxShadow: "0 4px 15px rgba(239, 68, 68, 0.4)" }}>
            <SwordsIcon />
          </div>
          <div>
            <h2 style={{ fontSize: "1.4rem", fontWeight: "900", color: "#fff", margin: 0 }}>
              Crear Duelo 1v1
            </h2>
            <p style={{ fontSize: "0.825rem", color: "var(--color-text-muted)", margin: 0 }}>
              Desafía a un rival con la misma secuencia idéntica de banderas
            </p>
          </div>
        </div>

        {error && (
          <div style={{ padding: "0.75rem 1rem", background: "rgba(239, 68, 68, 0.15)", border: "1px solid rgba(239, 68, 68, 0.3)", color: "#EF4444", borderRadius: "10px", fontSize: "0.85rem", marginBottom: "1rem" }}>
            {error}
          </div>
        )}

        {/* Step 1: Select Player */}
        <div style={{ marginBottom: "1.25rem" }}>
          <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "800", color: "var(--color-text-muted)", textTransform: "uppercase", marginBottom: "0.5rem" }}>
            👤 Jugador Rival
          </label>
          
          {initialTargetUserName ? (
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.85rem", background: "rgba(255,255,255,0.05)", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.1)" }}>
              <FaUser style={{ color: "var(--color-primary)" }} />
              <span style={{ fontWeight: "800", fontSize: "1rem", color: "#fff" }}>{initialTargetUserName}</span>
            </div>
          ) : players.length > 0 ? (
            <select
              value={selectedPlayerId}
              onChange={(e) => setSelectedPlayerId(e.target.value)}
              style={{ width: "100%", padding: "0.85rem", background: "#0D1410", color: selectedPlayerId ? "#fff" : "var(--color-text-muted)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "12px", fontSize: "0.95rem", fontWeight: "700" }}
            >
              <option value="" disabled style={{ color: "#999" }}>
                -- Selecciona un jugador --
              </option>
              {players.map(p => (
                <option key={p.id} value={p.id} style={{ color: "#fff" }}>
                  {p.isOnline ? "🟢 " : "⚪ "}{p.name || "Jugador"} (Niv. {p.level || 1} • {p.xp || 0} XP)
                </option>
              ))}
            </select>
          ) : (
            <div style={{ padding: "0.85rem", background: "rgba(255,255,255,0.03)", borderRadius: "12px", fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
              Cargando lista de jugadores...
            </div>
          )}
        </div>

        {/* Step 2: Select Game Mode */}
        <div style={{ marginBottom: "1.25rem" }}>
          <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "800", color: "var(--color-text-muted)", textTransform: "uppercase", marginBottom: "0.5rem" }}>
            ⚔️ Modalidad de Duelo
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            
            {/* Modo 1: Dominación */}
            <button
              type="button"
              onClick={() => setGameMode("DOMINATION")}
              style={{
                padding: "0.85rem",
                borderRadius: "12px",
                textAlign: "left",
                background: gameMode === "DOMINATION" ? "rgba(59, 130, 246, 0.15)" : "rgba(255,255,255,0.03)",
                border: `2px solid ${gameMode === "DOMINATION" ? "#3B82F6" : "rgba(255,255,255,0.08)"}`,
                color: "#fff",
                cursor: "pointer"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "#60A5FA", fontWeight: "800", fontSize: "0.95rem" }}>
                <FaRunning size={14} /> Dominación (3 Días)
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "0.25rem", lineHeight: "1.3" }}>
                Tienes 3 días para acertar cada país 3 veces en varias rondas. Mapa en tiempo real y contador de tiempo restante.
              </div>
            </button>

            {/* Modo 2: Duelo Relámpago */}
            <button
              type="button"
              onClick={() => setGameMode("LIGHTNING")}
              style={{
                padding: "0.85rem",
                borderRadius: "12px",
                textAlign: "left",
                background: gameMode === "LIGHTNING" ? "rgba(245, 158, 11, 0.15)" : "rgba(255,255,255,0.03)",
                border: `2px solid ${gameMode === "LIGHTNING" ? "#F59E0B" : "rgba(255,255,255,0.08)"}`,
                color: "#fff",
                cursor: "pointer"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "#F59E0B", fontWeight: "800", fontSize: "0.95rem" }}>
                <FaBolt size={14} /> Duelo Relámpago
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "0.25rem", lineHeight: "1.3" }}>
                10 segundos por bandera. Gana quien más acierte en el tiempo fijado.
              </div>
            </button>

          </div>
        </div>

        {/* Step 3: Select Territory Scope (Bloques Múltiples y Continentes) */}
        <div style={{ marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
            <label style={{ fontSize: "0.85rem", fontWeight: "800", color: "var(--color-text-muted)", textTransform: "uppercase" }}>
              🗺️ Bloques Territoriales (Combina los que quieras)
            </label>
          </div>

          {/* Dynamic Flag Count Badge */}
          <div style={{ padding: "0.6rem 0.85rem", background: "rgba(167, 244, 50, 0.12)", border: "1px solid rgba(167, 244, 50, 0.3)", borderRadius: "10px", fontSize: "0.825rem", color: "var(--color-primary)", fontWeight: "800", marginBottom: "0.75rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span>🎯 Banderas estimadas en este duelo:</span>
            <span style={{ fontSize: "0.95rem", fontWeight: "900" }}>{totalFlagsSelected} banderas</span>
          </div>

          <div style={{ maxHeight: "240px", overflowY: "auto", background: "#0D1410", padding: "0.85rem", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.1)", display: "flex", flexDirection: "column", gap: "1rem" }}>
            {TERRITORY_GROUPS.map(group => (
              <div key={group.title}>
                <div style={{ fontSize: "0.75rem", fontWeight: "800", color: "#60A5FA", textTransform: "uppercase", marginBottom: "0.4rem", paddingLeft: "0.2rem" }}>
                  {group.title}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.45rem" }}>
                  {group.items.map(sub => {
                    const isSelected = selectedSubregions.includes(sub.id);
                    return (
                      <div
                        key={sub.id}
                        onClick={() => toggleSubregion(sub.id)}
                        style={{
                          gridColumn: sub.isContinent ? "1 / -1" : "auto",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          padding: "0.5rem 0.75rem",
                          borderRadius: "9px",
                          background: isSelected 
                            ? (sub.isContinent ? "rgba(16, 185, 129, 0.2)" : "rgba(167, 244, 50, 0.15)") 
                            : (sub.isContinent ? "rgba(255, 255, 255, 0.05)" : "rgba(255,255,255,0.02)"),
                          border: `1px solid ${isSelected 
                            ? (sub.isContinent ? "#10B981" : "rgba(167, 244, 50, 0.4)") 
                            : (sub.isContinent ? "rgba(255, 255, 255, 0.12)" : "rgba(255,255,255,0.05)")}`,
                          cursor: "pointer",
                          fontSize: sub.isContinent ? "0.825rem" : "0.775rem",
                          fontWeight: isSelected ? "800" : (sub.isContinent ? "700" : "500"),
                          color: isSelected 
                            ? (sub.isContinent ? "#10B981" : "var(--color-primary)") 
                            : "#fff"
                        }}
                      >
                        <div style={{ width: "14px", height: "14px", borderRadius: "4px", border: "1px solid currentColor", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          {isSelected && <FaCheck size={9} />}
                        </div>
                        <span>{sub.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          className="btn btn-primary"
          style={{ width: "100%", padding: "0.9rem", fontSize: "1.05rem", fontWeight: "900", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}
        >
          <SwordsIcon /> {loading ? "Enviando reto..." : "¡Lanzar Desafío 1v1!"}
        </button>

      </div>
    </div>
  );
}
