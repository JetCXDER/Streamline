import React, { useState, useRef, useEffect } from "react";
import { Checkbox, Chip } from "@material-tailwind/react";

// ─────────────────────────────────────────────────────────────────────────────
// MOCK DATA
// Replace with real API response from /listZip when backend is wired
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

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT — NAVBAR (extract to Navbar.jsx later)
// ─────────────────────────────────────────────────────────────────────────────
function Navbar() {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: "48px",
        background: "transparent",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 32px",
        zIndex: 100,
      }}
    >
      <div style={{ display: "flex", gap: "24px" }}>
        {["File", "Options", "Help"].map((label) => (
          <button
            key={label}
            style={{
              background: "none",
              border: "none",
              color: "#484f58",
              fontSize: "12px",
              fontFamily: "monospace",
              cursor: "pointer",
              letterSpacing: "0.5px",
              padding: "4px 0",
              transition: "color 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#8b949e")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#484f58")}
          >
            {label}
          </button>
        ))}
      </div>
      <div style={{ width: "80px" }} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT — BRANDING (extract to Branding.jsx later)
// ─────────────────────────────────────────────────────────────────────────────
function Branding() {
  return (
    <div style={{ textAlign: "center", marginBottom: "28px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "10px",
        }}
      >
        <span style={{ fontSize: "26px" }}>⚡</span>
        <span
          style={{
            color: "#e6edf3",
            fontSize: "28px",
            fontFamily: "'Georgia', serif",
            fontWeight: "700",
            letterSpacing: "-0.5px",
          }}
        >
          Streamline
        </span>
      </div>
      <div
        style={{
          color: "#484f58",
          fontSize: "11px",
          fontFamily: "monospace",
          letterSpacing: "2px",
          textTransform: "uppercase",
          marginTop: "4px",
        }}
      >
        Extract. Direct. Local.
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT — SPLIT PANEL CONTAINER (extract to SplitPanel.jsx later)
// Single panel that cracks open — left half slides left, right half slides right
// Terminal grows out from the gap between them
// ─────────────────────────────────────────────────────────────────────────────
function SplitPanel({
  fileList,
  selectedFiles,
  onToggle,
  logs,
  extracting,
  done,
  phase,
}) {
  const allSelected = selectedFiles.length === fileList.length;
  const bottomRef = useRef(null);
  const isSplit = phase !== "select";

  useEffect(() => {
    if (isSplit) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs, isSplit]);

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
    <div
      style={{
        width: "100%",
        maxWidth: isSplit ? "1000px" : "680px",
        transition: "max-width 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
        position: "relative",
        display: "flex",
        gap: isSplit ? "16px" : "0px",
      }}
    >
      {/* ── LEFT HALF — file list panel, slides left on split ── */}
      <div
        style={{
          flex: isSplit ? "0 0 340px" : "1",
          background: "#161b22",
          border: `1px solid ${isSplit ? "#30363d" : done ? "#3fb950" : "#30363d"}`,
          borderRadius: "14px",
          overflow: "hidden",
          boxShadow: isSplit
            ? "0 8px 32px rgba(0,0,0,0.3)"
            : done
              ? "0 8px 40px rgba(63,185,80,0.2)"
              : "0 8px 40px rgba(0,0,0,0.5)",
          transform: isSplit ? "translateX(0)" : "translateX(0)",
          transition:
            "flex 0.5s cubic-bezier(0.4,0,0.2,1), box-shadow 0.3s ease, border-color 0.3s ease, opacity 0.3s ease",
          opacity: isSplit ? 0.6 : 1,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* File list header */}
        <div
          style={{
            background: "#0d1117",
            borderBottom: "1px solid #21262d",
            padding: "14px 18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <span
            style={{
              color: "#e6edf3",
              fontFamily: "monospace",
              fontSize: "12px",
              fontWeight: "600",
              letterSpacing: "0.5px",
            }}
          >
            FILES IN ARCHIVE
          </span>
          {!isSplit && (
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Chip
                value={`${selectedFiles.length} / ${fileList.length}`}
                size="sm"
                style={{
                  background: "#1f3a2a",
                  color: "#3fb950",
                  border: "1px solid #2ea043",
                  fontSize: "10px",
                  padding: "2px 8px",
                }}
              />
              <button
                onClick={toggleAll}
                style={{
                  fontSize: "11px",
                  color: "#58a6ff",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "monospace",
                }}
              >
                {allSelected ? "Deselect All" : "Select All"}
              </button>
            </div>
          )}
          {isSplit && (
            <Chip
              value={`${selectedFiles.length} selected`}
              size="sm"
              style={{
                background: "#1f3a2a",
                color: "#3fb950",
                border: "1px solid #2ea043",
                fontSize: "10px",
                padding: "2px 8px",
              }}
            />
          )}
        </div>

        {/* File list body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "8px 4px" }}>
          {fileList.map((file) => (
            <div
              key={file}
              onClick={() => {
                if (!isSplit) onToggle(file);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "8px 14px",
                borderRadius: "6px",
                cursor: isSplit ? "default" : "pointer",
                background: selectedFiles.includes(file)
                  ? "#1f3a2a"
                  : "transparent",
                transition: "background 0.15s",
                margin: "1px 4px",
              }}
              onMouseEnter={(e) => {
                if (!isSplit && !selectedFiles.includes(file))
                  e.currentTarget.style.background = "#21262d";
              }}
              onMouseLeave={(e) => {
                if (!isSplit && !selectedFiles.includes(file))
                  e.currentTarget.style.background = "transparent";
              }}
            >
              <Checkbox
                checked={selectedFiles.includes(file)}
                onChange={() => {
                  if (!isSplit) onToggle(file);
                }}
                onClick={(e) => e.stopPropagation()}
                color="green"
                disabled={isSplit}
                style={{ width: "14px", height: "14px" }}
              />
              <span
                style={{
                  color: selectedFiles.includes(file) ? "#3fb950" : "#484f58",
                  fontFamily: "monospace",
                  fontSize: "12px",
                  transition: "color 0.15s",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {file}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── RIGHT HALF — terminal, grows out from the crack ── */}
      <div
        style={{
          flex: isSplit ? "1" : "0",
          minWidth: 0,
          background: "#0d1117",
          border: `1px solid ${done ? "#3fb950" : extracting ? "#2ea043" : "#30363d"}`,
          borderRadius: "14px",
          overflow: "hidden",
          opacity: isSplit ? 1 : 0,
          transform: isSplit ? "scaleX(1)" : "scaleX(0)",
          transformOrigin: "left center",
          transition:
            "flex 0.5s cubic-bezier(0.4,0,0.2,1), opacity 0.4s ease 0.2s, transform 0.5s cubic-bezier(0.4,0,0.2,1), border-color 0.3s ease",
          boxShadow: done
            ? "0 8px 40px rgba(63,185,80,0.25)"
            : extracting
              ? "0 8px 40px rgba(63,185,80,0.15)"
              : "0 8px 32px rgba(0,0,0,0.4)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Terminal header */}
        <div
          style={{
            background: "#161b22",
            borderBottom: "1px solid #21262d",
            padding: "14px 18px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              background: "#f85149",
              opacity: 0.8,
            }}
          />
          <div
            style={{
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              background: "#e3b341",
              opacity: 0.8,
            }}
          />
          <div
            style={{
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              background: "#3fb950",
              opacity: 0.8,
            }}
          />
          <span
            style={{
              color: "#484f58",
              fontFamily: "monospace",
              fontSize: "11px",
              marginLeft: "8px",
              letterSpacing: "0.5px",
            }}
          >
            OUTPUT LOG
          </span>
        </div>

        {/* Terminal body */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "16px",
            fontFamily: "'Courier New', Courier, monospace",
            fontSize: "12px",
            lineHeight: "1.8",
          }}
        >
          {logs.length === 0 ? (
            <span style={{ color: "#30363d" }}>Initializing...</span>
          ) : (
            logs.map((line, idx) => (
              <div
                key={idx}
                style={{
                  marginBottom: "2px",
                  animation: "splitLineIn 0.3s ease forwards",
                  animationDelay: `${(idx % 5) * 50}ms`,
                  opacity: 0,
                }}
              >
                <span style={{ color: "#3fb950" }}>›</span>{" "}
                <span
                  style={{
                    color: line.startsWith("✓")
                      ? "#3fb950"
                      : line.startsWith("Error") || line.startsWith("Aborted")
                        ? "#f85149"
                        : line.startsWith("Starting") || line.startsWith("All")
                          ? "#58a6ff"
                          : "#c9d1d9",
                  }}
                >
                  {line}
                </span>
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT — ACTION BUTTONS + PROGRESS (extract to Buttons.jsx later)
// ─────────────────────────────────────────────────────────────────────────────
function ActionButtons({
  onExtract,
  onCancel,
  onReset,
  extracting,
  noneSelected,
  progress,
  done,
  phase,
}) {
  const isSplit = phase !== "select";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        width: "100%",
        maxWidth: isSplit ? "1000px" : "680px",
        transition: "max-width 0.5s cubic-bezier(0.4,0,0.2,1)",
      }}
    >
      <div style={{ display: "flex", gap: "12px" }}>
        {!done ? (
          <button
            onClick={onExtract}
            disabled={noneSelected || extracting}
            style={{
              flex: 1,
              padding: "13px",
              borderRadius: "8px",
              border: "1px solid",
              borderColor: noneSelected || extracting ? "#30363d" : "#2ea043",
              background: noneSelected || extracting ? "#161b22" : "#238636",
              color: noneSelected || extracting ? "#484f58" : "#ffffff",
              fontSize: "13px",
              fontWeight: "700",
              fontFamily: "monospace",
              letterSpacing: "1px",
              cursor: noneSelected || extracting ? "not-allowed" : "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              if (!noneSelected && !extracting)
                e.currentTarget.style.background = "#2ea043";
            }}
            onMouseLeave={(e) => {
              if (!noneSelected && !extracting)
                e.currentTarget.style.background = "#238636";
            }}
          >
            {extracting ? "⏳ EXTRACTING..." : "⚡ EXTRACT NOW"}
          </button>
        ) : (
          <button
            onClick={onReset}
            style={{
              flex: 1,
              padding: "13px",
              borderRadius: "8px",
              border: "1px solid #58a6ff",
              background: "#1c2d3f",
              color: "#58a6ff",
              fontSize: "13px",
              fontWeight: "700",
              fontFamily: "monospace",
              letterSpacing: "1px",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#21364f";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#1c2d3f";
            }}
          >
            ↩ SELECT NEW FILES
          </button>
        )}

        <button
          onClick={onCancel}
          disabled={!extracting}
          style={{
            flex: 1,
            padding: "13px",
            borderRadius: "8px",
            border: "1px solid",
            borderColor: !extracting ? "#30363d" : "#f85149",
            background: !extracting ? "#161b22" : "#3d1a1a",
            color: !extracting ? "#484f58" : "#f85149",
            fontSize: "13px",
            fontWeight: "700",
            fontFamily: "monospace",
            letterSpacing: "1px",
            cursor: !extracting ? "not-allowed" : "pointer",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            if (extracting) e.currentTarget.style.background = "#4d1f1f";
          }}
          onMouseLeave={(e) => {
            if (extracting) e.currentTarget.style.background = "#3d1a1a";
          }}
        >
          ✕ CANCEL
        </button>
      </div>

      {/* Progress Bar */}
      {(extracting || done) && (
        <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span
              style={{
                color: "#484f58",
                fontFamily: "monospace",
                fontSize: "10px",
                letterSpacing: "1px",
              }}
            >
              {done ? "COMPLETE" : "EXTRACTING"}
            </span>
            <span
              style={{
                color: "#3fb950",
                fontFamily: "monospace",
                fontSize: "10px",
              }}
            >
              {progress}%
            </span>
          </div>
          <div
            style={{
              background: "#21262d",
              borderRadius: "4px",
              height: "5px",
              overflow: "hidden",
              border: "1px solid #30363d",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${progress}%`,
                background: done
                  ? "#3fb950"
                  : "linear-gradient(90deg, #238636, #3fb950)",
                borderRadius: "4px",
                transition: "width 0.4s ease",
                boxShadow: "0 0 8px rgba(63,185,80,0.5)",
              }}
            />
          </div>
        </div>
      )}

      {/* Done Banner */}
      {done && (
        <div
          style={{
            background: "#1f3a2a",
            border: "1px solid #2ea043",
            borderRadius: "8px",
            padding: "11px 16px",
            textAlign: "center",
            color: "#3fb950",
            fontFamily: "monospace",
            fontSize: "12px",
            fontWeight: "600",
            letterSpacing: "0.5px",
          }}
        >
          ✓ EXTRACTION COMPLETE — FILES SAVED TO YOUR LOCAL DRIVE
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN — ZipExtractor
// ─────────────────────────────────────────────────────────────────────────────
export default function ZipExtractor({ fileList = MOCK_FILES }) {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [logs, setLogs] = useState([]);
  const [extracting, setExtracting] = useState(false);
  const [done, setDone] = useState(false);
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState("select"); // "select" | "split"
  const eventSourceRef = useRef(null);
  const cancelledRef = useRef(false);

  const addLog = (msg) => setLogs((prev) => [...prev, msg]);

  const toggleFile = (file) => {
    setSelectedFiles((prev) =>
      prev.includes(file) ? prev.filter((f) => f !== file) : [...prev, file],
    );
  };

  // ── Extract ──────────────────────────────────────────────────────────────
  const startExtraction = async () => {
    if (selectedFiles.length === 0) return;

    // Trigger the split — panel cracks open
    setPhase("split");

    setExtracting(true);
    setDone(false);
    setProgress(0);
    setLogs([]);
    cancelledRef.current = false;

    // Small delay to let split animation play before logs start
    await new Promise((res) => setTimeout(res, 500));
    addLog(`Starting extraction of ${selectedFiles.length} file(s)...`);

    // ── MOCK SIMULATION ──
    // When backend is ready, replace this block with:
    //
    // await fetch("/extractZip", {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify({ zip: "example.zip", files: selectedFiles }),
    // });
    // const es = new EventSource("/extractZip");
    // eventSourceRef.current = es;
    // let completed = 0;
    // es.onmessage = (e) => {
    //   addLog(e.data);
    //   if (e.data.startsWith("✓")) {
    //     completed++;
    //     setProgress(Math.round((completed / selectedFiles.length) * 100));
    //   }
    // };
    // es.onerror = () => { es.close(); setExtracting(false); setDone(true); setProgress(100); };

    for (let i = 0; i < selectedFiles.length; i++) {
      if (cancelledRef.current) break;
      await new Promise((res) => setTimeout(res, 500));
      if (cancelledRef.current) break;
      addLog(`Extracting: ${selectedFiles[i]}`);
      await new Promise((res) => setTimeout(res, 400));
      if (cancelledRef.current) break;
      addLog(`✓ Done: ${selectedFiles[i]}`);
      setProgress(Math.round(((i + 1) / selectedFiles.length) * 100));
    }

    if (!cancelledRef.current) {
      addLog("All files extracted successfully.");
      setDone(true);
      setProgress(100);
    }
    setExtracting(false);
  };

  // ── Cancel ───────────────────────────────────────────────────────────────
  const cancelProcess = async () => {
    if (!extracting) {
      addLog("No active process to cancel.");
      return;
    }
    cancelledRef.current = true;
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    // await fetch("/cancel", { method: "POST" }); // uncomment when backend ready
    addLog("Aborted by user.");
    setExtracting(false);
    setDone(false);
    setProgress(0);
  };

  // ── Reset — panels slide back together ──────────────────────────────────
  const resetToSelection = async () => {
    setPhase("select");
    setSelectedFiles([]);
    setLogs([]);
    setDone(false);
    setProgress(0);
  };

  return (
    <>
      <style>{`
        @keyframes splitLineIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0);   }
        }
      `}</style>

      <div
        style={{
          minHeight: "100vh",
          background:
            "linear-gradient(160deg, #0f172a 0%, #0d1117 60%, #0f172a 100%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "60px 24px 40px",
        }}
      >
        <Navbar />
        <Branding />

        {/* ── SPLIT PANEL ── */}
        <SplitPanel
          fileList={fileList}
          selectedFiles={selectedFiles}
          onToggle={toggleFile}
          logs={logs}
          extracting={extracting}
          done={done}
          phase={phase}
        />

        {/* ── BUTTONS + PROGRESS ── */}
        <div
          style={{
            marginTop: "16px",
            width: "100%",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <ActionButtons
            onExtract={startExtraction}
            onCancel={cancelProcess}
            onReset={resetToSelection}
            extracting={extracting}
            noneSelected={selectedFiles.length === 0}
            progress={progress}
            done={done}
            phase={phase}
          />
        </div>
      </div>
    </>
  );
}
