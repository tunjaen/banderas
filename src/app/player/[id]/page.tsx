"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLanguage } from "@/lib/LanguageContext";
import { FaFire, FaGlobe, FaMedal, FaMapMarkerAlt, FaFlag, FaRocket, FaCompass } from "react-icons/fa";

export default function PlayerProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { t, lang } = useLanguage();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/player/${params.id}`)
      .then(res => res.json())
      .then(data => {
        if (data.user) setData(data);
        setLoading(false);
      });
  }, [params.id]);

  if (loading) {
    return <div className="container flex-center" style={{ minHeight: "100vh" }}>{t.profile?.loading || "Cargando perfil..."}</div>;
  }

  if (!data) {
    return <div className="container flex-center" style={{ minHeight: "100vh" }}>{t.profile?.notFound || "Usuario no encontrado"}</div>;
  }

  const { user, stats } = data;

  const sCorrect = user.spatialCorrect || 0;
  const sWrong = user.spatialWrong || 0;
  const sTotal = sCorrect + sWrong;
  const sAcc = Math.round(stats.spatialAcc || 0);

  const getSpatialBadge = (correct: number) => {
    if (correct >= 100) return { title: "Cartógrafo Galáctico", icon: "🌌", color: "#A855F7" };
    if (correct >= 50) return { title: "Navegante Estelar", icon: "🚀", color: "#3B82F6" };
    if (correct >= 15) return { title: "Explorador Terrestre", icon: "🌍", color: "#10B981" };
    return { title: "Cadete Espacial", icon: "👨‍🚀", color: "var(--color-text-muted)" };
  };

  const spatialBadge = getSpatialBadge(sCorrect);

  return (
    <div className="container animate-fade-in" style={{ padding: "2rem", maxWidth: "850px" }}>
      <button onClick={() => router.push("/dashboard")} className="btn btn-outline" style={{ marginBottom: "2rem" }}>
        {t.profile?.backBtn || "← Volver al Dashboard"}
      </button>

      {/* Header Profile */}
      <div className="card" style={{ display: "flex", alignItems: "center", gap: "2rem", marginBottom: "2rem" }}>
        <div style={{ width: "100px", height: "100px", borderRadius: "50%", background: "var(--color-surface-hover)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "3rem", fontWeight: "bold", color: "var(--color-primary)", border: "2px solid var(--color-primary)", boxShadow: "var(--shadow-md)" }}>
          {user.name?.charAt(0).toUpperCase() || "U"}
        </div>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: "2.5rem", fontWeight: "900", marginBottom: "0.25rem" }}>{user.name}</h1>
          <p className="text-muted" style={{ fontSize: "1.25rem" }}>
            {t.profile?.level || "Nivel"} {user.level} • {user.xp} XP
          </p>
          <button 
            onClick={() => router.push(`/map?userId=${user.id}`)} 
            className="btn btn-outline" 
            style={{ marginTop: "1rem", display: "inline-flex", alignItems: "center", gap: "0.5rem" }}
          >
            <FaGlobe /> {lang === 'en' ? "View Global Map" : "Ver Mapa Global 🌍"}
          </button>
        </div>
        <div className="flex-col items-center gap-2">
          <FaFire size={32} className="text-danger" />
          <span style={{ fontWeight: "700", fontSize: "1.25rem" }}>{user.currentStreak} {t.profile?.days || "días"}</span>
        </div>
      </div>

      {/* Dedicated Mapa Espacial Card */}
      <div className="card" style={{ marginBottom: "2rem", padding: "1.5rem", background: "linear-gradient(135deg, rgba(59, 130, 246, 0.08), rgba(168, 85, 247, 0.08))", border: "1px solid rgba(59, 130, 246, 0.2)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
          <h2 style={{ fontSize: "1.25rem", display: "flex", alignItems: "center", gap: "0.5rem", color: "#60A5FA" }}>
            <FaRocket /> {lang === 'en' ? "Spatial Map Stats (3D Globe)" : "Estadísticas de Mapa Espacial (Globo 3D)"}
          </h2>
          <div style={{ background: "rgba(255,255,255,0.06)", padding: "0.4rem 0.8rem", borderRadius: "20px", display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.875rem", fontWeight: "700", border: `1px solid ${spatialBadge.color}` }}>
            <span>{spatialBadge.icon}</span>
            <span style={{ color: spatialBadge.color }}>{spatialBadge.title}</span>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem" }}>
          
          <div style={{ background: "rgba(255,255,255,0.04)", padding: "1rem", borderRadius: "10px" }}>
            <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginBottom: "0.2rem" }}>Aciertos Espaciales</div>
            <div style={{ fontSize: "1.5rem", fontWeight: "800", color: "#60A5FA" }}>{sCorrect}</div>
          </div>

          <div style={{ background: "rgba(255,255,255,0.04)", padding: "1rem", borderRadius: "10px" }}>
            <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginBottom: "0.2rem" }}>Precisión Espacial</div>
            <div style={{ fontSize: "1.5rem", fontWeight: "800", color: sAcc >= 80 ? "#10B981" : sAcc >= 50 ? "#F59E0B" : "var(--color-text-muted)" }}>
              {sAcc}%
            </div>
          </div>

          <div style={{ background: "rgba(255,255,255,0.04)", padding: "1rem", borderRadius: "10px" }}>
            <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginBottom: "0.2rem" }}>Respuestas Totales</div>
            <div style={{ fontSize: "1.5rem", fontWeight: "800" }}>{sTotal}</div>
          </div>

        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "2rem" }}>
        
        {/* Game Stats */}
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <h2 style={{ fontSize: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}><FaMedal className="text-primary" /> {t.profile?.statsTitle || "Estadísticas"}</h2>
          
          <div>
            <p className="text-muted" style={{ marginBottom: "0.5rem", fontSize: "0.875rem" }}>{t.profile?.bestMode || "Modo Estrella"}</p>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", background: "rgba(255,255,255,0.05)", padding: "1rem", borderRadius: "var(--radius-md)" }}>
              {stats.bestMode === "ninguno" ? (
                <span className="text-muted">{t.profile?.noData || "Sin datos suficientes"}</span>
              ) : stats.bestMode === "flag" ? (
                <><FaFlag size={24} className="text-primary" /> <span style={{ fontWeight: "700", fontSize: "1.125rem" }}>{t.profile?.modeFlag || "Modo Banderas"} ({Math.round(stats.flagAcc)}%)</span></>
              ) : (
                <><FaMapMarkerAlt size={24} className="text-success" /> <span style={{ fontWeight: "700", fontSize: "1.125rem" }}>{t.profile?.modeSpatial || "Modo Mapa Espacial"} ({Math.round(stats.spatialAcc)}%)</span></>
              )}
            </div>
          </div>

          <div>
            <p className="text-muted" style={{ marginBottom: "0.5rem", fontSize: "0.875rem" }}>{t.profile?.bestContinent || "Mejor Continente"}</p>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", background: "rgba(255,255,255,0.05)", padding: "1rem", borderRadius: "var(--radius-md)" }}>
              <FaGlobe size={24} className="text-warning" />
              <span style={{ fontWeight: "700", fontSize: "1.125rem" }}>
                {lang === 'en' ? stats.bestContinent.nameEn : stats.bestContinent.name}
              </span>
            </div>
          </div>
          
          <div>
            <p className="text-muted" style={{ marginBottom: "0.5rem", fontSize: "0.875rem" }}>{t.profile?.masteredCount || "Banderas Dominadas"}</p>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", background: "rgba(255,255,255,0.05)", padding: "1rem", borderRadius: "var(--radius-md)" }}>
              <FaMedal size={24} className="text-primary" />
              <span style={{ fontWeight: "700", fontSize: "1.5rem" }}>
                {user.masteredCount}
              </span>
            </div>
          </div>

          <div>
            <p className="text-muted" style={{ marginBottom: "0.5rem", fontSize: "0.875rem" }}>{lang === 'en' ? "Islands Mastered" : "Islas Dominadas"}</p>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", background: "rgba(14, 165, 233, 0.05)", padding: "1rem", borderRadius: "var(--radius-md)", border: "1px solid rgba(14, 165, 233, 0.1)" }}>
              <span style={{ fontSize: "1.5rem" }}>🏝️</span>
              <span style={{ fontWeight: "700", fontSize: "1.5rem", color: "var(--color-primary)" }}>
                {user.islandsMasteredCount}
              </span>
            </div>
          </div>
        </div>

        {/* Worst Flags */}
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <h2 style={{ fontSize: "1.5rem", color: "var(--color-danger)" }}>{t.profile?.worstFlags || "Banderas Más Resistidas"}</h2>
          <p className="text-muted" style={{ fontSize: "0.875rem" }}>{t.profile?.worstFlagsDesc || "Las banderas que más le cuestan a este jugador"}</p>
          
          {stats.worstFlags.length === 0 ? (
            <div style={{ padding: "2rem", textAlign: "center", color: "var(--color-text-muted)" }}>{t.profile?.noWeaknesses || "¡Aún no tiene debilidades!"}</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "1rem" }}>
              {stats.worstFlags.map((flag: any) => (
                <div key={flag.countryId} style={{ display: "flex", alignItems: "center", gap: "1rem", background: "rgba(255,77,77,0.1)", padding: "0.75rem", borderRadius: "var(--radius-md)", border: "1px solid rgba(255,77,77,0.2)" }}>
                  <img src={`https://flagcdn.com/w80/${flag.isoCode}.png`} alt="Flag" style={{ width: "60px", borderRadius: "4px" }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: "700", fontSize: "1.125rem" }}>{lang === 'en' ? flag.nameEn : flag.name}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--color-danger)" }}>{flag.wrongAnswers} {t.profile?.fails || "fallos"}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
