"use client";

export default function SteveFireCanvas({ size = 56 }: { size?: number }) {
  const width = size;
  const height = Math.round(size * 1.25);

  return (
    <div style={{ width: `${width}px`, height: `${height}px`, display: "flex", justifyContent: "center", alignItems: "center", position: "relative" }}>
      <svg 
        width={width} 
        height={height} 
        viewBox="0 0 100 125" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        style={{ overflow: "visible" }}
      >
        <defs>
          {/* Outer Gradient: Fire Red to Radiant Amber */}
          <linearGradient id="customFlameOuterGrad" x1="50%" y1="100%" x2="50%" y2="0%">
            <stop offset="0%" stopColor="#DC2626" />
            <stop offset="45%" stopColor="#EA580C" />
            <stop offset="85%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#FBBF24" />
          </linearGradient>

          {/* Mid Gradient: Warm Gold to Bright Yellow */}
          <linearGradient id="customFlameMidGrad" x1="50%" y1="100%" x2="50%" y2="0%">
            <stop offset="0%" stopColor="#F59E0B" />
            <stop offset="65%" stopColor="#FBBF24" />
            <stop offset="100%" stopColor="#FEF08A" />
          </linearGradient>

          {/* Core Gradient: White-Hot Center */}
          <linearGradient id="customFlameCoreGrad" x1="50%" y1="100%" x2="50%" y2="0%">
            <stop offset="0%" stopColor="#FEF08A" />
            <stop offset="100%" stopColor="#FFFFFF" />
          </linearGradient>

          {/* Soft Fire Ambient Glow */}
          <radialGradient id="customFlameGlow" cx="50%" cy="85%" r="55%">
            <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.6" />
            <stop offset="70%" stopColor="#DC2626" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#EA580C" stopOpacity="0" />
          </radialGradient>

          <style>{`
            @keyframes customFlameFlickerOuter {
              0%, 100% { transform: scale(1) rotate(0deg) skewX(0deg); }
              20% { transform: scale(1.06, 0.94) rotate(-3deg) skewX(-2deg); }
              40% { transform: scale(0.95, 1.08) rotate(3deg) skewX(2deg); }
              60% { transform: scale(1.04, 0.96) rotate(-2deg) skewX(-1deg); }
              80% { transform: scale(0.97, 1.05) rotate(2deg) skewX(1deg); }
            }

            @keyframes customFlameFlickerMid {
              0%, 100% { transform: scale(1) rotate(0deg); }
              25% { transform: scale(0.92, 1.1) rotate(4deg); }
              50% { transform: scale(1.1, 0.92) rotate(-4deg); }
              75% { transform: scale(0.96, 1.06) rotate(2deg); }
            }

            @keyframes customFlameFlickerCore {
              0%, 100% { transform: scale(1) translateY(0); }
              50% { transform: scale(1.12, 0.88) translateY(-3px); }
            }

            @keyframes customEmberRise1 {
              0% { transform: translate(0, 0) scale(1); opacity: 0.9; }
              50% { transform: translate(-10px, -30px) scale(0.7); opacity: 0.8; }
              100% { transform: translate(-20px, -65px) scale(0.15); opacity: 0; }
            }

            @keyframes customEmberRise2 {
              0% { transform: translate(0, 0) scale(1); opacity: 0.95; }
              50% { transform: translate(12px, -35px) scale(0.75); opacity: 0.85; }
              100% { transform: translate(24px, -70px) scale(0.1); opacity: 0; }
            }

            @keyframes customEmberRise3 {
              0% { transform: translate(0, 0) scale(0.7); opacity: 0; }
              35% { transform: translate(4px, -18px) scale(1.1); opacity: 0.95; }
              100% { transform: translate(-8px, -60px) scale(0.2); opacity: 0; }
            }

            .flame-outer {
              animation: customFlameFlickerOuter 1.4s infinite ease-in-out;
              transform-origin: 50px 105px;
            }

            .flame-mid {
              animation: customFlameFlickerMid 0.9s infinite ease-in-out;
              transform-origin: 50px 105px;
            }

            .flame-core {
              animation: customFlameFlickerCore 0.65s infinite ease-in-out;
              transform-origin: 50px 105px;
            }

            .ember-1 {
              animation: customEmberRise1 1.4s infinite ease-out;
              transform-origin: center;
            }

            .ember-2 {
              animation: customEmberRise2 1.2s infinite ease-out 0.4s;
              transform-origin: center;
            }

            .ember-3 {
              animation: customEmberRise3 1s infinite ease-out 0.25s;
              transform-origin: center;
            }
          `}</style>
        </defs>

        {/* Outer Radiant Flame Layer */}
        <path 
          className="flame-outer"
          d="M50 6 C50 6, 78 36, 76 64 C74 88, 58 100, 50 106 C42 100, 26 88, 24 64 C22 36, 50 6, 50 6 Z" 
          fill="url(#customFlameOuterGrad)"
          filter="drop-shadow(0 2px 8px rgba(234, 88, 12, 0.5))"
        />

        {/* Mid Golden Flame Layer */}
        <path 
          className="flame-mid"
          d="M50 22 C50 22, 68 46, 67 68 C65 86, 56 96, 50 100 C44 96, 35 86, 33 68 C32 46, 50 22, 50 22 Z" 
          fill="url(#customFlameMidGrad)"
        />

        {/* Core White-Hot Flame Layer */}
        <path 
          className="flame-core"
          d="M50 42 C50 42, 60 60, 59 76 C58 88, 54 94, 50 96 C46 94, 42 88, 41 76 C40 60, 50 42, 50 42 Z" 
          fill="url(#customFlameCoreGrad)"
        />

        {/* Spark Ember 1 */}
        <circle className="ember-1" cx="42" cy="32" r="3.5" fill="#FDE047" />

        {/* Spark Ember 2 */}
        <circle className="ember-2" cx="58" cy="26" r="3" fill="#F59E0B" />

        {/* Spark Ember 3 */}
        <circle className="ember-3" cx="50" cy="18" r="2.5" fill="#FEF08A" />
      </svg>
    </div>
  );
}
