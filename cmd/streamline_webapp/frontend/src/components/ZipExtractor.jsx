import React, { useState, useRef, useEffect } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { EffectCube } from "swiper/modules";
import "swiper/css";
import "swiper/css/effect-cube";

// ─────────────────────────────────────────────────────────────────────────────
// MOCK DATA — Will be replaced with real API response from /listZip
// ─────────────────────────────────────────────────────────────────────────────
const MOCK_FILES = [
  "project/src/main.go",
  "project/src/config.go",
  "project/src/util.go",
  "project/assets/logo.png",
  "project/assets/banner.jpg",
  "project/assets/icons/arrow.svg",
  "project/docs/README.md",
  "project/docs/API.md",
  "project/scripts/build.sh",
  "project/scripts/deploy.sh",
];

// Pseudo content for dimmed panels — swap with real data before deploying
const PSEUDO_LOGS = [
  "000 Starting extraction...",
  "001 Extracting: project/src/main.go",
  "002 ✓ Done: project/src/main.go",
  "003 Extracting: project/assets/logo.png",
  "004 ✓ Done: project/assets/logo.png",
  "005 All files extracted successfully.",
];

const PSEUDO_DONE_FILES = [
  "project/src/main.go",
  "project/src/config.go",
  "project/assets/logo.png",
];

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

  @keyframes downloadAppear {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
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
  .retro-btn:disabled {
    opacity: 0.3; cursor: not-allowed;
    box-shadow: 2px 2px 0 #999; border-color: #999;
  }
  .retro-btn.primary {
    background: #000; color: #fff;
    box-shadow: 4px 4px 0 #555;
  }
  .retro-btn.primary:hover:not(:disabled) {
    background: #333;
    box-shadow: 2px 2px 0 #555;
    transform: translate(2px, 2px);
  }
  .retro-btn.danger {
    border-color: #cc0000; color: #cc0000;
    box-shadow: 4px 4px 0 #cc0000;
  }
  .retro-btn.danger:hover:not(:disabled) {
    background: #cc0000; color: #fff;
    box-shadow: 2px 2px 0 #cc0000;
    transform: translate(2px, 2px);
  }
  .retro-btn.download {
    border-color: #000; background: #000; color: #fff;
    box-shadow: 4px 4px 0 #555;
    font-size: 9px; padding: 14px 24px;
    animation: downloadAppear 0.4s ease forwards;
  }
  .retro-btn.download:hover {
    background: #333;
    box-shadow: 2px 2px 0 #555;
    transform: translate(2px, 2px);
  }

  .pixel-checkbox {
    width: 16px; height: 16px;
    border: 2px solid #000; background: #fff;
    display: inline-flex; align-items: center; justify-content: center;
    cursor: pointer; flex-shrink: 0; font-size: 10px;
  }
  .pixel-checkbox.checked { background: #000; color: #fff; }

  ::-webkit-scrollbar { width: 8px; }
  ::-webkit-scrollbar-track { background: #fff; border-left: 2px solid #000; }
  ::-webkit-scrollbar-thumb { background: #000; }

  /* Swiper customization */
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

  .swiper-3d .swiper-slide-shadow-left,
  .swiper-3d .swiper-slide-shadow-right,
  .swiper-3d .swiper-slide-shadow-top,
  .swiper-3d .swiper-slide-shadow-bottom {
    background-image: none;
  }
`;

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT — STEP INDICATOR
// ─────────────────────────────────────────────────────────────────────────────
function StepIndicator({ current }) {
  const steps = ["SELECT", "EXTRACT", "DONE"];
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "0",
        marginBottom: "32px",
      }}
    >
      {steps.map((label, idx) => {
        const num = idx + 1;
        const isActive = current === num;
        const isDone = current > num;
        return (
          <React.Fragment key={label}>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  border: "3px solid #000",
                  background: isActive ? "#000" : isDone ? "#000" : "#fff",
                  color: isActive || isDone ? "#fff" : "#000",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "12px",
                  fontFamily: "'Press Start 2P', monospace",
                  boxShadow: isActive ? "4px 4px 0 #555" : "2px 2px 0 #ccc",
                  transition: "all 0.3s",
                  animation: isActive ? "flicker 4s infinite" : "none",
                }}
              >
                {isDone ? "✓" : `0${num}`}
              </div>
              <span
                style={{
                  fontSize: "7px",
                  fontFamily: "'Press Start 2P', monospace",
                  color: isActive ? "#000" : "#999",
                  letterSpacing: "1px",
                }}
              >
                {label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div
                style={{
                  width: "80px",
                  height: "3px",
                  background: current > num ? "#000" : "#ccc",
                  marginBottom: "20px",
                  transition: "background 0.3s",
                }}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PANEL 1 — File Selection content
// ─────────────────────────────────────────────────────────────────────────────
function Panel1Content({
  fileList,
  selectedFiles,
  onToggle,
  onNext,
  isActive,
  loading,
}) {
  const allSelected = selectedFiles.length === fileList.length;

  const toggleAll = () => {
    if (allSelected) {
      fileList.forEach((f) => {
        if (selectedFiles.includes(f)) onToggle(f);
      });
    } else {
      fileList.forEach((f) => {
        if (!selectedFiles.includes(f)) onToggle(f);
      });
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Title bar */}
      <div
        style={{
          background: "#000",
          color: "#fff",
          padding: "10px 14px",
          fontFamily: "'Press Start 2P', monospace",
          fontSize: "8px",
          letterSpacing: "1px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexShrink: 0,
        }}
      >
        <span>▶ SELECT FILES</span>
        <span style={{ color: "#999", fontSize: "7px" }}>
          {selectedFiles.length}/{fileList.length}
        </span>
      </div>

      {/* File list */}
      <div style={{ flex: 1, overflowY: "auto", padding: "6px 0" }}>
        {fileList.map((file, idx) => {
          const checked = selectedFiles.includes(file);
          return (
            <div
              key={file}
              onClick={() => isActive && !loading && onToggle(file)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "8px 12px",
                cursor: isActive && !loading ? "pointer" : "default",
                background: checked
                  ? "#000"
                  : idx % 2 === 0
                    ? "#fff"
                    : "#f5f5f5",
                borderBottom: "1px solid #e0e0e0",
                transition: "background 0.1s",
              }}
            >
              <div className={`pixel-checkbox ${checked ? "checked" : ""}`}>
                {checked && "■"}
              </div>
              <span
                style={{
                  fontFamily: "'Press Start 2P', monospace",
                  fontSize: "7px",
                  color: checked ? "#fff" : "#000",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {file}
              </span>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      {isActive && (
        <div
          style={{
            borderTop: "3px solid #000",
            padding: "10px 12px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "#f5f5f5",
            flexShrink: 0,
          }}
        >
          <button
            className="retro-btn"
            onClick={toggleAll}
            disabled={loading}
            style={{ fontSize: "7px", padding: "8px 10px" }}
          >
            {allSelected ? "☐ DESELECT" : "■ ALL"}
          </button>
          <button
            className="retro-btn primary"
            onClick={onNext}
            disabled={selectedFiles.length === 0 || loading}
            style={{ fontSize: "7px", padding: "8px 10px" }}
          >
            {loading ? "LOADING..." : "EXTRACT ▶"}
          </button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PANEL 2 — Terminal / Extraction content
// ─────────────────────────────────────────────────────────────────────────────
function Panel2Content({
  logs,
  progress,
  extracting,
  onCancel,
  isActive,
  isPseudo,
}) {
  const bottomRef = useRef(null);
  const displayLogs = isPseudo ? PSEUDO_LOGS : logs;
  const displayProgress = isPseudo ? 60 : progress;
  const totalBlocks = 16;
  const filledBlocks = Math.round((displayProgress / 100) * totalBlocks);
  const bar = "█".repeat(filledBlocks) + "░".repeat(totalBlocks - filledBlocks);

  useEffect(() => {
    if (isActive) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs, isActive]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Title bar */}
      <div
        style={{
          background: "#000",
          color: "#fff",
          padding: "10px 14px",
          fontFamily: "'Press Start 2P', monospace",
          fontSize: "8px",
          letterSpacing: "1px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            animation: isActive && extracting ? "flicker 2s infinite" : "none",
          }}
        >
          {isActive && extracting ? "▶ EXTRACTING..." : "▶ TERMINAL"}
        </span>
        <span style={{ color: "#999", fontSize: "7px" }}>
          {displayProgress}%
        </span>
      </div>

      {/* Progress bar */}
      <div
        style={{
          padding: "12px 14px",
          borderBottom: "2px solid #e0e0e0",
          background: "#f5f5f5",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            fontFamily: "'Press Start 2P', monospace",
            fontSize: "9px",
            letterSpacing: "1px",
            color: "#000",
            wordBreak: "break-all",
          }}
        >
          [{bar}]
        </div>
        <div
          style={{
            fontFamily: "'Press Start 2P', monospace",
            fontSize: "6px",
            color: "#666",
            marginTop: "6px",
          }}
        >
          {displayProgress === 100
            ? "■ COMPLETE"
            : isActive && extracting
              ? "■ PROCESSING..."
              : "□ WAITING..."}
        </div>
      </div>

      {/* Logs */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "10px 14px",
          fontFamily: "'Press Start 2P', monospace",
          fontSize: "6px",
          lineHeight: "2",
          background: "#fff",
        }}
      >
        {displayLogs.length === 0 ? (
          <span style={{ color: "#ccc" }}>
            INITIALIZING
            <span style={{ animation: "blink 1s infinite" }}>_</span>
          </span>
        ) : (
          displayLogs.map((line, idx) => (
            <div
              key={idx}
              style={{
                marginBottom: "2px",
                animation: isActive ? "pixelFadeIn 0.2s ease forwards" : "none",
                color: line.includes("✓")
                  ? "#006600"
                  : line.includes("Error") || line.includes("Aborted")
                    ? "#cc0000"
                    : line.includes("Starting") || line.includes("All")
                      ? "#000080"
                      : "#000",
              }}
            >
              {line}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Footer */}
      {isActive && (
        <div
          style={{
            borderTop: "3px solid #000",
            padding: "10px 12px",
            background: "#f5f5f5",
            display: "flex",
            justifyContent: "flex-end",
            flexShrink: 0,
          }}
        >
          <button
            className="retro-btn danger"
            onClick={onCancel}
            disabled={!extracting}
            style={{ fontSize: "7px", padding: "8px 10px" }}
          >
            ■ CANCEL
          </button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PANEL 3 — Mission Complete content
// ─────────────────────────────────────────────────────────────────────────────
function Panel3Content({
  selectedFiles,
  onReset,
  isActive,
  showDownload,
  isPseudo,
}) {
  const displayFiles = isPseudo ? PSEUDO_DONE_FILES : selectedFiles;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Title bar */}
      <div
        style={{
          background: "#000",
          color: "#fff",
          padding: "10px 14px",
          fontFamily: "'Press Start 2P', monospace",
          fontSize: "8px",
          letterSpacing: "1px",
          flexShrink: 0,
        }}
      >
        ▶ COMPLETE
      </div>

      {/* Content */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "20px 14px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontFamily: "'Press Start 2P', monospace",
            fontSize: "40px",
            marginBottom: "12px",
            animation: isActive ? "flicker 3s infinite" : "none",
            color: isActive ? "#000" : "#ccc",
          }}
        >
          ✓
        </div>
        <div
          style={{
            fontFamily: "'Press Start 2P', monospace",
            fontSize: "8px",
            letterSpacing: "1px",
            marginBottom: "8px",
            color: isActive ? "#000" : "#bbb",
          }}
        >
          FILES EXTRACTED
        </div>
        <div
          style={{
            fontFamily: "'Press Start 2P', monospace",
            fontSize: "6px",
            color: isActive ? "#666" : "#ccc",
            marginBottom: "16px",
          }}
        >
          {displayFiles.length} FILE{displayFiles.length !== 1 ? "S" : ""} SAVED
        </div>

        {/* File summary */}
        <div
          style={{
            border: `2px solid ${isActive ? "#000" : "#ddd"}`,
            background: "#f5f5f5",
            padding: "8px",
            textAlign: "left",
            maxHeight: "120px",
            overflowY: "auto",
          }}
        >
          {displayFiles.map((file, idx) => (
            <div
              key={file}
              style={{
                fontFamily: "'Press Start 2P', monospace",
                fontSize: "6px",
                color: isActive ? "#333" : "#bbb",
                padding: "3px 0",
                borderBottom:
                  idx < displayFiles.length - 1 ? "1px solid #e0e0e0" : "none",
              }}
            >
              ✓ {file}
            </div>
          ))}
        </div>

        {/* Download button — appears 600ms after panel becomes active */}
        {isActive && showDownload && (
          <div style={{ marginTop: "16px" }}>
            <button
              className="retro-btn download"
              onClick={() => alert("Download will be wired to backend!")}
              style={{ animationDelay: "0ms" }}
            >
              ▼ DOWNLOAD FILES
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      {isActive && (
        <div
          style={{
            borderTop: "3px solid #000",
            padding: "10px 12px",
            background: "#f5f5f5",
            display: "flex",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <button
            className="retro-btn"
            onClick={onReset}
            style={{ fontSize: "7px", padding: "8px 10px" }}
          >
            ↩ START OVER
          </button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PANEL WRAPPER
// ─────────────────────────────────────────────────────────────────────────────
function PanelWrapper({ isActive, children }) {
  return (
    <div
      style={{
        width: "340px",
        height: "460px",
        flexShrink: 0,
        border: `3px solid ${isActive ? "#000" : "#ccc"}`,
        boxShadow: isActive ? "6px 6px 0 #000" : "3px 3px 0 #ccc",
        background: "#fff",
        opacity: isActive ? 1 : 0.4,
        transform: isActive ? "scale(1)" : "scale(0.97)",
        transition:
          "opacity 0.5s ease, transform 0.5s ease, box-shadow 0.5s ease, border-color 0.5s ease",
        pointerEvents: isActive ? "auto" : "none",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN — ZipExtractor with Swiper & Backend Integration
// ─────────────────────────────────────────────────────────────────────────────
export default function ZipExtractor({
  token,
  apiBase = "http://localhost:8080",
}) {
  const [step, setStep] = useState(1);
  const [zipPath, setZipPath] = useState("test_data/test_archive.zip"); // Default for testing
  const [fileList, setFileList] = useState(MOCK_FILES);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [logs, setLogs] = useState([]);
  const [extracting, setExtracting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showDownload, setShowDownload] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const swiperRef = useRef(null);
  const eventSourceRef = useRef(null);
  const cancelledRef = useRef(false);

  const addLog = (msg) => setLogs((prev) => [...prev, msg]);

  const toggleFile = (file) => {
    setSelectedFiles((prev) =>
      prev.includes(file) ? prev.filter((f) => f !== file) : [...prev, file],
    );
  };

  // Update Swiper slide when step changes
  useEffect(() => {
    if (swiperRef.current && swiperRef.current.swiper) {
      swiperRef.current.swiper.slideTo(step - 1, 500);
    }
  }, [step]);

  // ── List ZIP files from backend ─────────────────────────────────────────
  const listZipFiles = async () => {
    if (!zipPath.trim()) {
      setError("Please enter a ZIP file path");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${apiBase}/api/listZip?zip=${encodeURIComponent(zipPath)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to list ZIP files");
      }

      const data = await response.json();
      setFileList(data.files || []);
      setSelectedFiles([]);
      addLog(`✓ Loaded ${data.count} files from ZIP`);
    } catch (err) {
      setError(`Error: ${err.message}`);
      addLog(`ERROR: ${err.message}`);
      console.error("Error listing ZIP:", err);
    } finally {
      setLoading(false);
    }
  };

  // ── Step 1 → 2: Start Extraction ───────────────────────────────────────
  const startExtraction = async () => {
    if (selectedFiles.length === 0) return;
    setStep(2);
    setLogs([]);
    setProgress(0);
    setShowDownload(false);
    setExtracting(true);
    setError(null);
    cancelledRef.current = false;

    await new Promise((res) => setTimeout(res, 500));
    addLog(`Starting extraction of ${selectedFiles.length} file(s)...`);

    try {
      const response = await fetch(`${apiBase}/api/extractZip`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          zip: zipPath,
          files: selectedFiles,
          outDir: "extracted_files",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Extraction failed");
      }

      // Handle Server-Sent Events (SSE) for streaming logs
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        if (cancelledRef.current) {
          reader.cancel();
          break;
        }

        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop(); // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const logMessage = line.slice(6);
            addLog(logMessage);

            // Update progress based on log message
            if (selectedFiles.length > 0) {
              const extractedCount = logs.filter((l) =>
                l.includes("✓ Done:"),
              ).length;
              setProgress(
                Math.round((extractedCount / selectedFiles.length) * 100),
              );
            }
          }
        }
      }

      if (!cancelledRef.current) {
        setProgress(100);
        setExtracting(false);
        addLog("✓ All files extracted successfully.");
        await new Promise((res) => setTimeout(res, 600));
        setStep(3);
        setTimeout(() => setShowDownload(true), 600);
      }
    } catch (err) {
      if (!cancelledRef.current) {
        setError(`Extraction failed: ${err.message}`);
        addLog(`ERROR: ${err.message}`);
      }
      setExtracting(false);
    }
  };

  // ── Cancel ───────────────────────────────────────────────────────────────
  const cancelProcess = () => {
    if (!extracting) return;
    cancelledRef.current = true;
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    addLog("Aborted by user.");
    setExtracting(false);
    setProgress(0);
  };

  // ── Reset ────────────────────────────────────────────────────────────────
  const reset = () => {
    setStep(1);
    setSelectedFiles([]);
    setLogs([]);
    setProgress(0);
    setExtracting(false);
    setShowDownload(false);
    setError(null);
    setLoading(false);
    cancelledRef.current = false;
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
            ⚡ STREAMLINE
          </div>
          <div
            style={{
              fontFamily: "'Press Start 2P', monospace",
              fontSize: "7px",
              color: "#999",
              letterSpacing: "3px",
            }}
          >
            EXTRACT . DIRECT . LOCAL
          </div>
        </div>

        {/* ── ZIP INPUT (Panel 0) ── */}
        {step === 1 && (
          <div
            style={{
              marginBottom: "32px",
              padding: "16px",
              border: "2px solid #000",
              background: "#f5f5f5",
              maxWidth: "350px",
            }}
          >
            <div
              style={{
                fontFamily: "'Press Start 2P', monospace",
                fontSize: "7px",
                marginBottom: "10px",
                color: "#000",
              }}
            >
              ZIP PATH:
            </div>
            <input
              type="text"
              value={zipPath}
              onChange={(e) => setZipPath(e.target.value)}
              placeholder="e.g., test_data/test_archive.zip"
              style={{
                width: "100%",
                padding: "8px",
                border: "2px solid #000",
                fontFamily: "'Press Start 2P', monospace",
                fontSize: "7px",
                marginBottom: "10px",
                boxSizing: "border-box",
              }}
              disabled={loading}
            />
            <button
              className="retro-btn primary"
              onClick={listZipFiles}
              disabled={loading}
              style={{ width: "100%", fontSize: "7px" }}
            >
              {loading ? "LOADING..." : "📋 LIST FILES"}
            </button>
            {error && (
              <div
                style={{
                  marginTop: "10px",
                  padding: "8px",
                  background: "#ffcccc",
                  border: "2px solid #cc0000",
                  fontFamily: "'Press Start 2P', monospace",
                  fontSize: "6px",
                  color: "#cc0000",
                }}
              >
                {error}
              </div>
            )}
          </div>
        )}

        {/* ── STEP INDICATOR ── */}
        <StepIndicator current={step} />

        {/* ── SWIPER SLIDER — 3 panels ── */}
        <Swiper
          ref={swiperRef}
          modules={[EffectCube]}
          effect="cube"
          cubeEffect={{
            shadow: true,
            slideShadows: true,
            shadowOffset: 20,
            shadowScale: 0.94,
          }}
          grabCursor={true}
          keyboard={true}
          centeredSlides={true}
          slidesPerView={1}
          allowTouchMove={false}
          initialSlide={0}
          speed={500}
          onSlideChange={(swiper) => setStep(swiper.activeIndex + 1)}
          style={{
            width: "100%",
            maxWidth: "450px",
            marginBottom: "32px",
          }}
        >
          {/* PANEL 1 — File Selection */}
          <SwiperSlide
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <PanelWrapper isActive={step === 1}>
              <Panel1Content
                fileList={fileList}
                selectedFiles={selectedFiles}
                onToggle={toggleFile}
                onNext={startExtraction}
                isActive={step === 1}
                loading={loading}
              />
            </PanelWrapper>
          </SwiperSlide>

          {/* PANEL 2 — Terminal */}
          <SwiperSlide
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <PanelWrapper isActive={step === 2}>
              <Panel2Content
                logs={logs}
                progress={progress}
                extracting={extracting}
                onCancel={cancelProcess}
                isActive={step === 2}
                isPseudo={step < 2}
              />
            </PanelWrapper>
          </SwiperSlide>

          {/* PANEL 3 — Mission Complete */}
          <SwiperSlide
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <PanelWrapper isActive={step === 3}>
              <Panel3Content
                selectedFiles={selectedFiles}
                onReset={reset}
                isActive={step === 3}
                showDownload={showDownload}
                isPseudo={step < 3}
              />
            </PanelWrapper>
          </SwiperSlide>
        </Swiper>

        {/* ── FOOTER ── */}
        <div
          style={{
            fontFamily: "'Press Start 2P', monospace",
            fontSize: "6px",
            color: "#ccc",
            letterSpacing: "2px",
            animation: "blink 3s infinite",
          }}
        >
          STREAMLINE v1.0 — ALL SYSTEMS OPERATIONAL
        </div>
      </div>
    </>
  );
}
