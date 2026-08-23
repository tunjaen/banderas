"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/LanguageContext";
import { FaChevronRight, FaChevronDown, FaArrowLeft } from "react-icons/fa";

interface SubRegionOption {
  id: string;
  nameEs: string;
  nameEn: string;
  count: number;
  difficulty: "facil" | "medio" | "dificil" | "especial";
  paramType: "subregion" | "continent" | "world";
  paramValue: string;
}

interface ContinentGroup {
  id: string;
  nameEs: string;
  nameEn: string;
  icon: string;
  color: string;
  totalCountries: number;
  options: SubRegionOption[];
}

export default function SubRegionSelector() {
  const router = useRouter();
  const { lang } = useLanguage();
  const [expandedContinent, setExpandedContinent] = useState<string | null>(null);

  const continentGroups: ContinentGroup[] = [
    {
      id: "world",
      nameEs: "Todo el Mundo",
      nameEn: "The Whole World",
      icon: "🌐",
      color: "linear-gradient(135deg, rgba(167, 244, 50, 0.2), rgba(16, 185, 129, 0.08))",
      totalCountries: 244,
      options: [
        { id: "world_all", nameEs: "Mundo Completo (244 Países)", nameEn: "Entire World (244 Countries)", count: 244, difficulty: "especial", paramType: "world", paramValue: "world" }
      ]
    },
    {
      id: "africa",
      nameEs: "África",
      nameEn: "Africa",
      icon: "🌍",
      color: "linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(217, 119, 6, 0.05))",
      totalCountries: 54,
      options: [
        { id: "af_all", nameEs: "Toda África", nameEn: "All Africa", count: 54, difficulty: "dificil", paramType: "continent", paramValue: "África" },
        { id: "af_north_west", nameEs: "África Septentrional y Occidental", nameEn: "North & West Africa", count: 23, difficulty: "medio", paramType: "subregion", paramValue: "Africa_NorthWest" },
        { id: "af_east", nameEs: "África Oriental", nameEn: "Eastern Africa", count: 20, difficulty: "medio", paramType: "subregion", paramValue: "Africa_East" },
        { id: "af_south", nameEs: "África Central y Austral", nameEn: "Central & Southern Africa", count: 14, difficulty: "medio", paramType: "subregion", paramValue: "Africa_CentralSouth" }
      ]
    },
    {
      id: "europa",
      nameEs: "Europa",
      nameEn: "Europe",
      icon: "🌍",
      color: "linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(37, 99, 235, 0.05))",
      totalCountries: 44,
      options: [
        { id: "eu_all", nameEs: "Toda Europa", nameEn: "All Europe", count: 44, difficulty: "medio", paramType: "continent", paramValue: "Europa" },
        { id: "eu_west_north", nameEs: "Europa Occidental y del Norte", nameEn: "Western & Northern Europe", count: 21, difficulty: "facil", paramType: "subregion", paramValue: "Europe_WestNorth" },
        { id: "eu_south", nameEs: "Europa del Sur y Mediterráneo", nameEn: "Southern Europe & Mediterranean", count: 17, difficulty: "medio", paramType: "subregion", paramValue: "Europe_South" },
        { id: "eu_east", nameEs: "Europa Oriental y Central", nameEn: "Eastern & Central Europe", count: 12, difficulty: "medio", paramType: "subregion", paramValue: "Europe_East" }
      ]
    },
    {
      id: "asia",
      nameEs: "Asia",
      nameEn: "Asia",
      icon: "🌏",
      color: "linear-gradient(135deg, rgba(236, 72, 153, 0.15), rgba(219, 39, 119, 0.05))",
      totalCountries: 48,
      options: [
        { id: "as_all", nameEs: "Toda Asia", nameEn: "All Asia", count: 48, difficulty: "dificil", paramType: "continent", paramValue: "Asia" },
        { id: "as_east_se", nameEs: "Asia Oriental y Sudeste Asiático", nameEn: "East & Southeast Asia", count: 18, difficulty: "facil", paramType: "subregion", paramValue: "Asia_EastSE" },
        { id: "as_south_central", nameEs: "Asia del Sur y Central", nameEn: "South & Central Asia", count: 13, difficulty: "medio", paramType: "subregion", paramValue: "Asia_SouthCentral" },
        { id: "as_middle_east", nameEs: "Oriente Medio y Cercano Oriente", nameEn: "Middle East & Near East", count: 18, difficulty: "dificil", paramType: "subregion", paramValue: "Asia_MiddleEast" }
      ]
    },
    {
      id: "america",
      nameEs: "América",
      nameEn: "Americas",
      icon: "🌎",
      color: "linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(5, 150, 105, 0.05))",
      totalCountries: 35,
      options: [
        { id: "am_all", nameEs: "Toda América", nameEn: "All Americas", count: 35, difficulty: "medio", paramType: "continent", paramValue: "América" },
        { id: "am_north_central", nameEs: "América del Norte y Central", nameEn: "North & Central America", count: 12, difficulty: "facil", paramType: "subregion", paramValue: "America_NorthCentral" },
        { id: "am_caribbean", nameEs: "Caribe y Antillas", nameEn: "Caribbean & Antilles", count: 20, difficulty: "medio", paramType: "subregion", paramValue: "America_Caribbean" },
        { id: "am_south", nameEs: "América del Sur", nameEn: "South America", count: 14, difficulty: "facil", paramType: "subregion", paramValue: "America_South" }
      ]
    },
    {
      id: "oceania",
      nameEs: "Oceanía",
      nameEn: "Oceania",
      icon: "🌏",
      color: "linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(124, 58, 237, 0.05))",
      totalCountries: 14,
      options: [
        { id: "oc_all", nameEs: "Toda Oceanía", nameEn: "All Oceania", count: 14, difficulty: "medio", paramType: "continent", paramValue: "Oceanía" }
      ]
    },
    {
      id: "islas",
      nameEs: "Islas y Archipiélagos",
      nameEn: "Islands & Territories",
      icon: "🏝️",
      color: "linear-gradient(135deg, rgba(14, 165, 233, 0.15), rgba(2, 132, 199, 0.05))",
      totalCountries: 77,
      options: [
        { id: "islands", nameEs: "Cazatesoros de Islas", nameEn: "Islands Treasure Hunter", count: 77, difficulty: "especial", paramType: "continent", paramValue: "Islas" }
      ]
    }
  ];

  const getDifficultyBadge = (diff: SubRegionOption["difficulty"]) => {
    switch (diff) {
      case "facil":
        return { label: lang === 'en' ? "Easy" : "Fácil", color: "#10B981", bg: "rgba(16, 185, 129, 0.15)", icon: "🟢" };
      case "medio":
        return { label: lang === 'en' ? "Medium" : "Medio", color: "#F59E0B", bg: "rgba(245, 158, 11, 0.15)", icon: "🟡" };
      case "dificil":
        return { label: lang === 'en' ? "Hard" : "Difícil", color: "#EF4444", bg: "rgba(239, 68, 68, 0.15)", icon: "🔴" };
      case "especial":
        return { label: lang === 'en' ? "Special" : "Especial", color: "#3B82F6", bg: "rgba(59, 130, 246, 0.15)", icon: "🏴‍☠️" };
    }
  };

  const handleSelectOption = (opt: SubRegionOption) => {
    if (opt.paramType === "subregion") {
      router.push(`/learn/continents?subregion=${opt.paramValue}`);
    } else if (opt.paramType === "continent") {
      router.push(`/learn/continents?continent=${encodeURIComponent(opt.paramValue)}`);
    } else {
      router.push(`/learn/world`);
    }
  };

  return (
    <div className="container animate-fade-in" style={{ padding: "1.5rem 1rem", maxWidth: "850px" }}>
      
      {/* Back button */}
      <button 
        onClick={() => router.push("/dashboard")} 
        className="btn btn-outline" 
        style={{ marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}
      >
        <FaArrowLeft /> {lang === 'en' ? "Back to Dashboard" : "Volver al Inicio"}
      </button>

      {/* Header Title */}
      <div style={{ textAlign: "center", marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.85rem", fontWeight: "900", margin: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
          <span>⚔️</span> {lang === 'en' ? "Conquest Mode" : "Modo Conquista"}
        </h1>
        <p className="text-muted" style={{ fontSize: "0.95rem", marginTop: "0.4rem" }}>
          {lang === 'en' 
            ? "Choose a continent or sub-region block to conquer flags step by step" 
            : "Elige un continente o bloque territorial para conquistar sus banderas paso a paso"}
        </p>
      </div>

      {/* Accordion List of Continents and Subregions */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {continentGroups.map(group => {
          const isExpanded = expandedContinent === group.id;
          const groupName = lang === 'en' ? group.nameEn : group.nameEs;

          return (
            <div 
              key={group.id}
              style={{
                background: "var(--color-surface)",
                borderRadius: "14px",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                overflow: "hidden",
                boxShadow: "0 4px 15px rgba(0,0,0,0.2)"
              }}
            >
              {/* Group Header Button */}
              <div
                onClick={() => setExpandedContinent(isExpanded ? null : group.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "1.1rem 1.25rem",
                  cursor: "pointer",
                  userSelect: "none",
                  background: group.color,
                  transition: "all 0.2s ease"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <span style={{ fontSize: "2rem" }}>{group.icon}</span>
                  <div>
                    <h3 style={{ fontSize: "1.15rem", fontWeight: "800", margin: 0 }}>
                      {groupName}
                    </h3>
                    <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", fontWeight: "600" }}>
                      {group.totalCountries} {lang === 'en' ? "countries" : "países"} • {group.options.length} {lang === 'en' ? "blocks" : "bloques"}
                    </span>
                  </div>
                </div>

                <div 
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.08)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--color-text)"
                  }}
                >
                  {isExpanded ? <FaChevronDown size={14} /> : <FaChevronRight size={14} />}
                </div>
              </div>

              {/* Sub-region Options Grid */}
              {isExpanded && (
                <div 
                  className="animate-fade-in"
                  style={{
                    padding: "1rem 1.25rem",
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
                    gap: "0.85rem",
                    borderTop: "1px solid rgba(255,255,255,0.06)",
                    background: "rgba(0,0,0,0.15)"
                  }}
                >
                  {group.options.map(opt => {
                    const badge = getDifficultyBadge(opt.difficulty);
                    const optName = lang === 'en' ? opt.nameEn : opt.nameEs;

                    return (
                      <div
                        key={opt.id}
                        onClick={() => handleSelectOption(opt)}
                        className="hover-scale"
                        style={{
                          background: "var(--color-surface)",
                          border: "1px solid rgba(255,255,255,0.08)",
                          borderRadius: "10px",
                          padding: "0.9rem 1rem",
                          cursor: "pointer",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "space-between",
                          gap: "0.5rem",
                          transition: "all 0.2s"
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}>
                          <span style={{ fontWeight: "700", fontSize: "0.95rem", color: "#fff", lineHeight: "1.3" }}>
                            {optName}
                          </span>
                          <span 
                            style={{
                              fontSize: "0.725rem",
                              fontWeight: "800",
                              color: badge.color,
                              background: badge.bg,
                              padding: "0.15rem 0.5rem",
                              borderRadius: "12px",
                              whiteSpace: "nowrap",
                              display: "flex",
                              alignItems: "center",
                              gap: "0.2rem"
                            }}
                          >
                            <span>{badge.icon}</span> {badge.label}
                          </span>
                        </div>

                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.785rem", color: "var(--color-text-muted)" }}>
                          <span style={{ fontWeight: "600", color: "#A7F432" }}>{opt.count} {lang === 'en' ? "countries" : "países"}</span>
                          <span style={{ color: "var(--color-primary)", fontWeight: "700" }}>
                            {lang === 'en' ? "Play →" : "Jugar →"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
