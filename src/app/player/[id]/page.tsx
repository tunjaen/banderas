"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLanguage } from "@/lib/LanguageContext";
import { FaFire, FaGlobe, FaMedal, FaMapMarkerAlt, FaFlag } from "react-icons/fa";

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
    return <div className="container flex-center" style={{ minHeight: "100vh" }}>{t.profile?.loading || "Loading profile..."}</div>;
  }

  if (!data) {
    return <div className="container flex-center" style={{ minHeight: "100vh" }}>{t.profile?.notFound || "User not found"}</div>;
  }

  const { user, stats } = data;

  return (
    <div className="container animate-fade-in" style={{ padding: "2rem", maxWidth: "800px" }}>
      <button onClick={() => router.push("/dashboard")} className="btn btn-outline" style={{ marginBottom: "2rem" }}>
        {t.profile?.backBtn || "← Back to Dashboard"}
      </button>

      {/* Header Profile */}
      <div className="card" style={{ display: "flex", alignItems: "center", gap: "2rem", marginBottom: "2rem" }}>
        <div style={{ width: "100px", height: "100px", borderRadius: "50%", background: "var(--color-surface-hover)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "3rem", fontWeight: "bold", color: "var(--color-primary)", border: "2px solid var(--color-primary)", boxShadow: "var(--shadow-md)" }}>
          {user.name?.charAt(0).toUpperCase() || "U"}
        </div>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: "2.5rem", fontWeight: "900", marginBottom: "0.25rem" }}>{user.name}</h1>
          <p className="text-muted" style={{ fontSize: "1.25rem" }}>
            {t.profile?.level || "Level"} {user.level} • {user.xp} XP
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
          <span style={{ fontWeight: "700", fontSize: "1.25rem" }}>{user.currentStreak} {t.profile?.days || "days"}</span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "2rem" }}>
        
        {/* Game Stats */}
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <h2 style={{ fontSize: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}><FaMedal className="text-primary" /> {t.profile?.statsTitle || "Statistics"}</h2>
          
          <div>
            <p className="text-muted" style={{ marginBottom: "0.5rem", fontSize: "0.875rem" }}>{t.profile?.bestMode || "Best Game Mode"}</p>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", background: "rgba(255,255,255,0.05)", padding: "1rem", borderRadius: "var(--radius-md)" }}>
              {stats.bestMode === "ninguno" ? (
                <span className="text-muted">{t.profile?.noData || "Not enough data"}</span>
              ) : stats.bestMode === "flag" ? (
                <><FaFlag size={24} className="text-primary" /> <span style={{ fontWeight: "700", fontSize: "1.125rem" }}>{t.profile?.modeFlag || "Flag Mode"} ({Math.round(stats.flagAcc)}%)</span></>
              ) : (
                <><FaMapMarkerAlt size={24} className="text-success" /> <span style={{ fontWeight: "700", fontSize: "1.125rem" }}>{t.profile?.modeSpatial || "Spatial Mode"} ({Math.round(stats.spatialAcc)}%)</span></>
              )}
            </div>
          </div>

          <div>
            <p className="text-muted" style={{ marginBottom: "0.5rem", fontSize: "0.875rem" }}>{t.profile?.bestContinent || "Best Continent"}</p>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", background: "rgba(255,255,255,0.05)", padding: "1rem", borderRadius: "var(--radius-md)" }}>
              <FaGlobe size={24} className="text-warning" />
              <span style={{ fontWeight: "700", fontSize: "1.125rem" }}>
                {lang === 'en' ? stats.bestContinent.nameEn : stats.bestContinent.name}
              </span>
            </div>
          </div>
          
          <div>
            <p className="text-muted" style={{ marginBottom: "0.5rem", fontSize: "0.875rem" }}>{t.profile?.masteredCount || "Flags Mastered"}</p>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", background: "rgba(255,255,255,0.05)", padding: "1rem", borderRadius: "var(--radius-md)" }}>
              <FaMedal size={24} className="text-primary" />
              <span style={{ fontWeight: "700", fontSize: "1.5rem" }}>
                {user.masteredCount}
              </span>
            </div>
          </div>
        </div>

        {/* Worst Flags */}
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <h2 style={{ fontSize: "1.5rem", color: "var(--color-danger)" }}>{t.profile?.worstFlags || "Toughest Flags"}</h2>
          <p className="text-muted" style={{ fontSize: "0.875rem" }}>{t.profile?.worstFlagsDesc || "Flags this player struggles with"}</p>
          
          {stats.worstFlags.length === 0 ? (
            <div style={{ padding: "2rem", textAlign: "center", color: "var(--color-text-muted)" }}>{t.profile?.noWeaknesses || "No weaknesses found yet!"}</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "1rem" }}>
              {stats.worstFlags.map((flag: any) => (
                <div key={flag.countryId} style={{ display: "flex", alignItems: "center", gap: "1rem", background: "rgba(255,77,77,0.1)", padding: "0.75rem", borderRadius: "var(--radius-md)", border: "1px solid rgba(255,77,77,0.2)" }}>
                  <img src={`https://flagcdn.com/w80/${flag.isoCode}.png`} alt="Flag" style={{ width: "60px", borderRadius: "4px" }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: "700", fontSize: "1.125rem" }}>{lang === 'en' ? flag.nameEn : flag.name}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--color-danger)" }}>{flag.wrongAnswers} {t.profile?.fails || "fails"}</div>
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
