"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/LanguageContext";
import { FaArrowLeft, FaSearch, FaTimes, FaGlobe, FaCheckCircle, FaStar, FaBookOpen, FaQuestionCircle } from "react-icons/fa";

interface CountryData {
  id: string;
  name: string;
  nameEn: string;
  continent: string;
  continentEn: string;
  capital: string;
  capitalEn: string;
  isoCode: string;
  lat: number;
  lng: number;
  status: string;
}

const ISLAND_COUNTRIES = ["ABW","ASM","ATG","AUS","BHS","SHN","BMU","BRB","CCK","COK","COM","CPV","CUB","CUW","CXR","CYM","CYP","DMA","DOM","FJI","FLK","FSM","GBR","GGY","GLP","GRL","GUM","HTI","IDN","IMN","IOT","IRL","ISL","JAM","JEY","JPN","KIR","KNA","LCA","LKA","MDG","MDV","MHL","MLT","MNP","MSR","MTQ","MUS","MYT","NCL","NIU","NRU","NZL","PCN","PHL","PNG","PRI","PYF","REU","SGP","SJM","SLB","SPM","STP","SXM","SYC","TKL","TLS","TON","TTO","TUV","TWN","VGB","VIR","VUT","WLF","WSM"];

export default function AllFlagsPage() {
  const router = useRouter();
  const { lang } = useLanguage();
  const [countries, setCountries] = useState<CountryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedContinent, setSelectedContinent] = useState("Todos");
  const [sortBy, setSortBy] = useState<"name_asc" | "name_desc" | "continent">("name_asc");
  const [selectedCountry, setSelectedCountry] = useState<CountryData | null>(null);
  const [funFact, setFunFact] = useState<string | null>(null);
  const [loadingFact, setLoadingFact] = useState(false);

  useEffect(() => {
    fetch("/api/countries")
      .then(res => res.json())
      .then(data => {
        if (data.countries) setCountries(data.countries);
        setLoading(false);
      });
  }, []);

  const openCountryModal = async (c: CountryData) => {
    setSelectedCountry(c);
    setFunFact(null);
    setLoadingFact(true);
    try {
      const term = lang === 'en' ? c.nameEn : c.name;
      const wikiLang = lang === 'en' ? 'en' : 'es';
      const wikiRes = await fetch(`https://${wikiLang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(term)}`);
      if (wikiRes.ok) {
        const wikiData = await wikiRes.json();
        if (wikiData.extract) {
          const sentences = wikiData.extract.split(/(?<=[.!?])\s+/);
          setFunFact(sentences.slice(0, 2).join(' '));
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingFact(false);
    }
  };

  const filteredCountries = countries.filter(c => {
    const term = search.toLowerCase().trim();
    const nameMatch = c.name.toLowerCase().includes(term) || c.nameEn.toLowerCase().includes(term) || c.capital.toLowerCase().includes(term) || c.capitalEn.toLowerCase().includes(term);
    
    if (!nameMatch) return false;
    
    if (selectedContinent === "Todos") return true;
    if (selectedContinent === "Islas") return ISLAND_COUNTRIES.includes(c.isoCode.toUpperCase());
    return c.continent === selectedContinent;
  }).sort((a, b) => {
    if (sortBy === "name_asc") return (lang === 'en' ? a.nameEn : a.name).localeCompare(lang === 'en' ? b.nameEn : b.name);
    if (sortBy === "name_desc") return (lang === 'en' ? b.nameEn : b.name).localeCompare(lang === 'en' ? a.nameEn : a.name);
    return a.continent.localeCompare(b.continent);
  });

  const getStatusBadge = (status: string) => {
    if (status === "Dominado") return { label: "Dominado", color: "#10B981", icon: <FaCheckCircle /> };
    if (status === "Familiar") return { label: "Familiar", color: "#F59E0B", icon: <FaStar /> };
    if (status === "Aprendiendo") return { label: "Aprendiendo", color: "#3B82F6", icon: <FaBookOpen /> };
    return { label: "Por Descubrir", color: "var(--color-text-muted)", icon: <FaQuestionCircle /> };
  };

  const continentTabs = ["Todos", "África", "Asia", "Europa", "América del Norte", "América del Sur", "Oceanía", "Islas"];

  return (
    <div className="container animate-fade-in" style={{ padding: "1.5rem 1rem", maxWidth: "1100px", minHeight: "100vh" }}>
      
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
        <button onClick={() => router.push("/dashboard")} className="btn btn-outline" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <FaArrowLeft /> {lang === 'en' ? "Dashboard" : "Volver"}
        </button>
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: "900", margin: 0 }}>
            {lang === 'en' ? "All Flags of the World" : "Directorio de Banderas del Mundo"}
          </h1>
          <p className="text-muted" style={{ fontSize: "0.875rem", margin: 0 }}>
            {countries.length} {lang === 'en' ? "countries and territories" : "países y territorios registrados"}
          </p>
        </div>
      </div>

      {/* Controls: Search & Sort */}
      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "1.25rem", alignItems: "center" }}>
        
        {/* Search */}
        <div style={{ flex: 1, minWidth: "220px", position: "relative" }}>
          <FaSearch style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }} />
          <input 
            type="text" 
            placeholder={lang === 'en' ? "Search by country or capital..." : "Buscar por país o capital..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              padding: "0.75rem 1rem 0.75rem 2.5rem",
              borderRadius: "10px",
              background: "var(--color-surface)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "var(--color-text)",
              fontSize: "0.95rem"
            }}
          />
        </div>

        {/* Sort selector */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", fontWeight: "600" }}>
            {lang === 'en' ? "Sort:" : "Ordenar:"}
          </span>
          <select 
            value={sortBy}
            onChange={(e: any) => setSortBy(e.target.value)}
            style={{
              padding: "0.75rem 1rem",
              borderRadius: "10px",
              background: "var(--color-surface)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "var(--color-text)",
              fontSize: "0.9rem",
              fontWeight: "600",
              cursor: "pointer"
            }}
          >
            <option value="name_asc">Nombre (A - Z)</option>
            <option value="name_desc">Nombre (Z - A)</option>
            <option value="continent">Continente</option>
          </select>
        </div>

      </div>

      {/* Continent Filter Chips */}
      <div style={{ display: "flex", gap: "0.5rem", overflowX: "auto", paddingBottom: "0.75rem", marginBottom: "1.5rem" }}>
        {continentTabs.map(tab => (
          <button
            key={tab}
            onClick={() => setSelectedContinent(tab)}
            style={{
              padding: "0.4rem 0.85rem",
              borderRadius: "20px",
              fontSize: "0.85rem",
              fontWeight: "700",
              whiteSpace: "nowrap",
              cursor: "pointer",
              background: selectedContinent === tab ? "var(--color-primary)" : "var(--color-surface)",
              color: selectedContinent === tab ? "#000" : "var(--color-text-muted)",
              border: selectedContinent === tab ? "none" : "1px solid rgba(255,255,255,0.08)",
              transition: "all 0.2s"
            }}
          >
            {tab === "Islas" ? "🏝️ Islas" : tab === "Todos" ? "🌍 Todos" : tab}
          </button>
        ))}
      </div>

      {/* Flag Grid */}
      {loading ? (
        <div style={{ padding: "4rem", textAlign: "center", color: "var(--color-text-muted)" }}>
          {lang === 'en' ? "Loading flags..." : "Cargando directorio de banderas..."}
        </div>
      ) : filteredCountries.length === 0 ? (
        <div style={{ padding: "4rem", textAlign: "center", color: "var(--color-text-muted)" }}>
          {lang === 'en' ? "No countries match your search" : "No se encontraron países con los filtros aplicados"}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "1rem" }}>
          {filteredCountries.map(c => {
            const badge = getStatusBadge(c.status);
            return (
              <div 
                key={c.id}
                onClick={() => openCountryModal(c)}
                className="card hover-scale"
                style={{
                  padding: "1rem",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center",
                  cursor: "pointer",
                  background: "var(--color-surface)",
                  borderRadius: "12px",
                  border: "1px solid rgba(255,255,255,0.06)",
                  position: "relative"
                }}
              >
                {/* Flag Image */}
                <div style={{ width: "100%", height: "80px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "0.75rem" }}>
                  <img 
                    src={`https://flagcdn.com/w160/${c.isoCode.toLowerCase()}.png`} 
                    alt={c.name}
                    style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain", borderRadius: "4px", boxShadow: "0 2px 8px rgba(0,0,0,0.3)" }}
                  />
                </div>

                <div style={{ fontWeight: "700", fontSize: "0.95rem", marginBottom: "0.2rem", lineHeight: "1.2" }}>
                  {lang === 'en' ? c.nameEn : c.name}
                </div>

                <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginBottom: "0.5rem" }}>
                  {lang === 'en' ? c.capitalEn : c.capital}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.75rem", color: badge.color, background: "rgba(255,255,255,0.03)", padding: "0.2rem 0.5rem", borderRadius: "12px", marginTop: "auto" }}>
                  {badge.icon} <span>{badge.label}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Detail View */}
      {selectedCountry && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem", zIndex: 100 }}>
          <div className="card animate-fade-in" style={{ maxWidth: "500px", width: "100%", padding: "2rem", position: "relative", background: "var(--color-surface)", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.15)" }}>
            
            <button 
              onClick={() => setSelectedCountry(null)}
              style={{ position: "absolute", top: "1rem", right: "1rem", background: "none", border: "none", color: "var(--color-text-muted)", fontSize: "1.25rem", cursor: "pointer" }}
            >
              <FaTimes />
            </button>

            {/* Flag Image */}
            <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
              <img 
                src={`https://flagcdn.com/w640/${selectedCountry.isoCode.toLowerCase()}.png`}
                alt={selectedCountry.name}
                style={{ maxHeight: "180px", maxWidth: "100%", borderRadius: "8px", boxShadow: "0 8px 24px rgba(0,0,0,0.4)" }}
              />
            </div>

            <h2 style={{ fontSize: "1.75rem", fontWeight: "900", textAlign: "center", marginBottom: "0.5rem" }}>
              {lang === 'en' ? selectedCountry.nameEn : selectedCountry.name}
            </h2>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", margin: "1.5rem 0", background: "rgba(255,255,255,0.03)", padding: "1rem", borderRadius: "12px" }}>
              <div>
                <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>Capital</div>
                <div style={{ fontWeight: "700", fontSize: "1.05rem" }}>{lang === 'en' ? selectedCountry.capitalEn : selectedCountry.capital}</div>
              </div>
              <div>
                <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>Continente</div>
                <div style={{ fontWeight: "700", fontSize: "1.05rem" }}>{lang === 'en' ? selectedCountry.continentEn : selectedCountry.continent}</div>
              </div>
              <div>
                <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>Código ISO</div>
                <div style={{ fontWeight: "700", fontSize: "1.05rem" }}>{selectedCountry.isoCode}</div>
              </div>
              <div>
                <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>Estado de Estudio</div>
                <div style={{ fontWeight: "700", fontSize: "1.05rem", color: getStatusBadge(selectedCountry.status).color }}>
                  {getStatusBadge(selectedCountry.status).label}
                </div>
              </div>
            </div>

            {/* Wikipedia Summary Fun Fact */}
            {loadingFact ? (
              <div style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", textAlign: "center", padding: "1rem" }}>
                {lang === 'en' ? "Loading details from Wikipedia..." : "Cargando información adicional..."}
              </div>
            ) : funFact && (
              <div style={{ padding: "0.85rem", background: "rgba(59, 130, 246, 0.08)", borderRadius: "10px", border: "1px solid rgba(59, 130, 246, 0.2)" }}>
                <div style={{ fontSize: "0.75rem", fontWeight: "700", color: "#60A5FA", marginBottom: "0.25rem", textTransform: "uppercase" }}>
                  💡 {lang === 'en' ? "Did you know?" : "¿Sabías que...?"}
                </div>
                <div style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", lineHeight: "1.4" }}>
                  {funFact}
                </div>
              </div>
            )}

            <button 
              onClick={() => setSelectedCountry(null)} 
              className="btn btn-primary" 
              style={{ width: "100%", marginTop: "1.5rem", padding: "0.75rem" }}
            >
              {lang === 'en' ? "Close" : "Cerrar"}
            </button>

          </div>
        </div>
      )}

    </div>
  );
}
