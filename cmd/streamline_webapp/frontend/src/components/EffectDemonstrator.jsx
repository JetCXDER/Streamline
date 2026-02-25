import React, { useState, useRef } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import {
  EffectCube,
  EffectFade,
  EffectFlip,
  EffectCoverflow,
  EffectCards,
  EffectCreative,
} from "swiper/modules";
import "swiper/css";
import "swiper/css/effect-cube";
import "swiper/css/effect-fade";
import "swiper/css/effect-flip";
import "swiper/css/effect-coverflow";
import "swiper/css/effect-cards";
import "swiper/css/effect-creative";

// ─────────────────────────────────────────────────────────────────────────────
// GLOBAL STYLES
// ─────────────────────────────────────────────────────────────────────────────
const GLOBAL_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');

  * { box-sizing: border-box; }
  body { background: #ffffff; margin: 0; padding: 0; overflow-x: hidden; }

  body::after {
    content: '';
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: repeating-linear-gradient(
      0deg, transparent, transparent 2px,
      rgba(0,0,0,0.025) 2px, rgba(0,0,0,0.025) 4px
    );
    pointer-events: none;
    z-index: 9999;
  }

  @keyframes glitchColor {
    0%,60%,100% { text-shadow: 3px 3px 0 #ccc; color: #000; }
    62%  { text-shadow: -2px 0 #ff0000, 2px 0 #0000ff; }
    64%  { text-shadow: 2px 0 #ff0000, -2px 0 #00ff00; }
    66%  { text-shadow: 3px 3px 0 #ccc; }
  }

  @keyframes blink {
    0%,100% { opacity: 1; }
    50%      { opacity: 0; }
  }

  @keyframes pixelFadeIn {
    from { opacity: 0; transform: translateY(4px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  @keyframes flicker {
    0%,19%,21%,23%,25%,54%,56%,100% { opacity: 1; }
    20%,22%,24%,55% { opacity: 0.6; }
  }

  .retro-btn {
    font-family: 'Press Start 2P', monospace;
    font-size: 8px;
    padding: 10px 16px;
    border: 3px solid #000;
    background: #fff;
    color: #000;
    cursor: pointer;
    box-shadow: 4px 4px 0 #000;
    transition: all 0.1s;
    letter-spacing: 1px;
  }
  .retro-btn:hover:not(:disabled) {
    background: #000; color: #fff;
    box-shadow: 2px 2px 0 #000;
    transform: translate(2px, 2px);
  }
  .retro-btn:active:not(:disabled) {
    box-shadow: 0 0 0 #000;
    transform: translate(4px, 4px);
  }

  .retro-btn.active {
    background: #000; color: #fff;
    box-shadow: 4px 4px 0 #555;
  }
  .retro-btn.active:hover {
    background: #333;
    box-shadow: 2px 2px 0 #555;
    transform: translate(2px, 2px);
  }

  .retro-btn.secondary {
    background: #f5f5f5;
    border-color: #666;
    box-shadow: 3px 3px 0 #666;
  }
  .retro-btn.secondary:hover:not(:disabled) {
    background: #666; color: #fff;
    box-shadow: 2px 2px 0 #666;
    transform: translate(1px, 1px);
  }

  ::-webkit-scrollbar { width: 8px; }
  ::-webkit-scrollbar-track { background: #fff; border-left: 2px solid #000; }
  ::-webkit-scrollbar-thumb { background: #000; }

  .swiper-container {
    width: 100%;
    padding: 0;
  }

  .swiper-slide {
    display: flex;
    align-items: center;
    justify-content: center;
    perspective: 1000px;
  }
`;

// ─────────────────────────────────────────────────────────────────────────────
// DEMO PANEL (Shows which slide we're on)
// ─────────────────────────────────────────────────────────────────────────────
function DemoPanel({ panelNumber, title, description }) {
  const colors = [
    "#FF6B6B",
    "#4ECDC4",
    "#45B7D1",
    "#FFA07A",
    "#98D8C8",
    "#F7DC6F",
  ];
  const bgColor = colors[panelNumber - 1];

  return (
    <div
      style={{
        width: "340px",
        height: "460px",
        flexShrink: 0,
        border: "3px solid #000",
        boxShadow: "6px 6px 0 #000",
        background: bgColor,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
        padding: "20px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontFamily: "'Press Start 2P', monospace",
          fontSize: "48px",
          marginBottom: "20px",
          color: "#fff",
          textShadow: "4px 4px 0 rgba(0,0,0,0.3)",
        }}
      >
        {panelNumber}
      </div>
      <div
        style={{
          fontFamily: "'Press Start 2P', monospace",
          fontSize: "12px",
          letterSpacing: "2px",
          marginBottom: "16px",
          color: "#fff",
          textShadow: "2px 2px 0 rgba(0,0,0,0.2)",
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontFamily: "'Press Start 2P', monospace",
          fontSize: "6px",
          lineHeight: "1.8",
          color: "rgba(255,255,255,0.9)",
          textShadow: "1px 1px 0 rgba(0,0,0,0.2)",
        }}
      >
        {description}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EFFECT BUTTON ROW
// ─────────────────────────────────────────────────────────────────────────────
function EffectButtonRow({ currentEffect, onEffectChange }) {
  const effects = [
    { name: "cube", label: "CUBE", emoji: "📦" },
    { name: "fade", label: "FADE", emoji: "👁️" },
    { name: "flip", label: "FLIP", emoji: "🎴" },
    { name: "coverflow", label: "COVER", emoji: "🎞️" },
    { name: "cards", label: "CARDS", emoji: "🃏" },
    { name: "creative", label: "CUSTOM", emoji: "🎯" },
  ];

  return (
    <div
      style={{
        display: "flex",
        gap: "10px",
        justifyContent: "center",
        flexWrap: "wrap",
        marginBottom: "24px",
        padding: "0 20px",
      }}
    >
      {effects.map((effect) => (
        <button
          key={effect.name}
          className={`retro-btn ${currentEffect === effect.name ? "active" : "secondary"}`}
          onClick={() => onEffectChange(effect.name)}
          style={{
            fontSize: "7px",
            padding: "8px 12px",
          }}
        >
          {effect.emoji} {effect.label}
        </button>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// NAVIGATION BUTTONS (Previous / Next)
// ─────────────────────────────────────────────────────────────────────────────
function NavigationButtons({ swiperRef }) {
  return (
    <div
      style={{
        display: "flex",
        gap: "12px",
        justifyContent: "center",
        marginTop: "24px",
      }}
    >
      <button
        className="retro-btn secondary"
        onClick={() => swiperRef.current?.swiper?.slidePrev()}
        style={{ fontSize: "8px", padding: "10px 14px" }}
      >
        ◀ PREV
      </button>
      <button
        className="retro-btn secondary"
        onClick={() => swiperRef.current?.swiper?.slideNext()}
        style={{ fontSize: "8px", padding: "10px 14px" }}
      >
        NEXT ▶
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// INFO BOX — Shows current effect name and details
// ─────────────────────────────────────────────────────────────────────────────
function InfoBox({ effectName, currentSlide }) {
  const effectInfo = {
    cube: {
      title: "CUBE EFFECT",
      description: "3D Rotating Cube — Modern, engaging, retro-friendly",
      usage: "Best for general purpose, multi-step wizards",
    },
    fade: {
      title: "FADE EFFECT",
      description: "Simple Opacity Fade — Minimal, clean, professional",
      usage: "Best for minimalist, clean designs",
    },
    flip: {
      title: "FLIP EFFECT",
      description: "3D Card Flip — Playful, interactive, engaging",
      usage: "Best for interactive, card-based UIs",
    },
    coverflow: {
      title: "COVERFLOW EFFECT",
      description: "3D Album Carousel — Dynamic, gallery-like, visual",
      usage: "Best for galleries, showcases, portfolio displays",
    },
    cards: {
      title: "CARDS EFFECT",
      description: "Stacked Deck — Trendy, natural, modern",
      usage: "Best for deck interfaces, modern designs",
    },
    creative: {
      title: "CREATIVE EFFECT",
      description: "Fully Customizable 3D — Premium, flexible, powerful",
      usage: "Best for custom branding, advanced animations",
    },
  };

  const info = effectInfo[effectName] || effectInfo.cube;

  return (
    <div
      style={{
        border: "3px solid #000",
        background: "#f5f5f5",
        padding: "16px",
        maxWidth: "600px",
        marginTop: "32px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontFamily: "'Press Start 2P', monospace",
          fontSize: "10px",
          letterSpacing: "2px",
          marginBottom: "12px",
          color: "#000",
        }}
      >
        {info.title}
      </div>
      <div
        style={{
          fontFamily: "'Press Start 2P', monospace",
          fontSize: "7px",
          lineHeight: "1.6",
          color: "#666",
          marginBottom: "8px",
        }}
      >
        {info.description}
      </div>
      <div
        style={{
          fontFamily: "'Press Start 2P', monospace",
          fontSize: "6px",
          color: "#999",
          borderTop: "2px solid #ddd",
          paddingTop: "8px",
          marginTop: "8px",
        }}
      >
        {info.usage}
      </div>
      <div
        style={{
          fontFamily: "'Press Start 2P', monospace",
          fontSize: "7px",
          marginTop: "12px",
          padding: "8px",
          background: "#fff",
          border: "2px solid #000",
          color: "#000",
        }}
      >
        VIEWING: PANEL {currentSlide} / 3
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT — EFFECT DEMONSTRATOR
// ─────────────────────────────────────────────────────────────────────────────
export default function EffectDemonstrator() {
  const [effect, setEffect] = useState("cube");
  const [currentSlide, setCurrentSlide] = useState(1);
  const swiperRef = useRef(null);

  const getModules = (effectName) => {
    const moduleMap = {
      cube: [EffectCube],
      fade: [EffectFade],
      flip: [EffectFlip],
      coverflow: [EffectCoverflow],
      cards: [EffectCards],
      creative: [EffectCreative],
    };
    return moduleMap[effectName] || [EffectCube];
  };

  const getEffectConfig = (effectName) => {
    const configs = {
      cube: {
        cubeEffect: {
          shadow: true,
          slideShadows: true,
          shadowOffset: 20,
          shadowScale: 0.94,
        },
      },
      fade: {
        fadeEffect: {
          crossFade: true,
        },
      },
      flip: {
        flipEffect: {
          rotate: 30,
          slideShadows: true,
          limitRotation: true,
        },
      },
      coverflow: {
        coverflowEffect: {
          rotate: 50,
          stretch: 0,
          depth: 100,
          modifier: 1,
          slideShadows: true,
        },
      },
      cards: {
        cardsEffect: {
          perSlideRotate: 2,
          perSlideOffset: 8,
          rotate: true,
          slideShadows: true,
        },
      },
      creative: {
        creativeEffect: {
          prev: {
            shadow: true,
            translate: [0, 0, -400],
            rotate: [0, 100, 0],
          },
          next: {
            shadow: true,
            translate: [0, 0, -400],
            rotate: [0, -100, 0],
          },
        },
      },
    };
    return configs[effectName] || configs.cube;
  };

  return (
    <>
      <style>{GLOBAL_STYLES}</style>
      <div
        style={{
          minHeight: "100vh",
          background: "#ffffff",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 20px",
          position: "relative",
          width: "100%",
          maxWidth: "100vw",
          boxSizing: "border-box",
          overflowX: "hidden",
        }}
      >
        {/* ── HEADER ── */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div
            style={{
              fontFamily: "'Press Start 2P', monospace",
              fontSize: "20px",
              letterSpacing: "4px",
              animation: "glitchColor 8s infinite",
              marginBottom: "10px",
              textShadow: "3px 3px 0 #ccc",
            }}
          >
            ⚡ SWIPER EFFECTS
          </div>
          <div
            style={{
              fontFamily: "'Press Start 2P', monospace",
              fontSize: "7px",
              color: "#999",
              letterSpacing: "3px",
            }}
          >
            TEST . ALL . EFFECTS
          </div>
        </div>

        {/* ── EFFECT BUTTONS ── */}
        <EffectButtonRow currentEffect={effect} onEffectChange={setEffect} />

        {/* ── SWIPER SLIDER ── */}
        <Swiper
          ref={swiperRef}
          modules={getModules(effect)}
          effect={effect}
          {...getEffectConfig(effect)}
          grabCursor={true}
          keyboard={true}
          centeredSlides={true}
          slidesPerView={1}
          allowTouchMove={false}
          initialSlide={0}
          speed={500}
          onSlideChange={(swiper) => setCurrentSlide(swiper.activeIndex + 1)}
          style={{
            width: "100%",
            maxWidth: "450px",
            marginBottom: "0px",
          }}
        >
          {/* PANEL 1 */}
          <SwiperSlide
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <DemoPanel
              panelNumber={1}
              title="FIRST PANEL"
              description="Swipe or click NEXT to see the transition"
            />
          </SwiperSlide>

          {/* PANEL 2 */}
          <SwiperSlide
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <DemoPanel
              panelNumber={2}
              title="SECOND PANEL"
              description="Watch the smooth transition effect"
            />
          </SwiperSlide>

          {/* PANEL 3 */}
          <SwiperSlide
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <DemoPanel
              panelNumber={3}
              title="THIRD PANEL"
              description="Try switching effects at the top"
            />
          </SwiperSlide>
        </Swiper>

        {/* ── NAVIGATION BUTTONS ── */}
        <NavigationButtons swiperRef={swiperRef} effectName={effect} />

        {/* ── INFO BOX ── */}
        <InfoBox effectName={effect} currentSlide={currentSlide} />

        {/* ── FOOTER ── */}
        <div
          style={{
            marginTop: "32px",
            fontFamily: "'Press Start 2P', monospace",
            fontSize: "6px",
            color: "#ccc",
            letterSpacing: "2px",
            animation: "blink 3s infinite",
          }}
        >
          SWIPER v9 — TEST ALL EFFECTS IN REAL TIME
        </div>
      </div>
    </>
  );
}
