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
// Invisible bar at top — dropdown slots reserved for future use
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
        // ── DROPDOWN SLOTS — wire up menus here later ──
        // Left slot: File menu
        // Center slot: reserved
        // Right slot: Settings / Account
      }}
    >
      {/* Left dropdown slot — placeholder */}
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

      {/* Right slot — placeholder */}
      <div style={{ width: "80px" }} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT — BRANDING (centered above panels)
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
// COMPONENT — FILE LIST PANEL (extract to FileList.jsx later)
// ─────────────────────────────────────────────────────────────────────────────
function FileListPanel({ fileList, selectedFiles, onToggle }) {
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
    <div
      style={{
        flex: 1,
        background: "#161b22",
        border: "1px solid #30363d",
        borderRadius: "14px",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
      }}
    >
      {/* Panel Header */}
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
      </div>

      {/* Flat File List */}
      <div style={{ flex: 1, overflowY: "auto", padding: "8px 4px" }}>
        {fileList.map((file) => (
          <div
            key={file}
            onClick={() => onToggle(file)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "7px 14px",
              borderRadius: "6px",
              cursor: "pointer",
              background: selectedFiles.includes(file)
                ? "#1f3a2a"
                : "transparent",
              transition: "background 0.15s",
              margin: "1px 4px",
            }}
            onMouseEnter={(e) => {
              if (!selectedFiles.includes(file))
                e.currentTarget.style.background = "#21262d";
            }}
            onMouseLeave={(e) => {
              if (!selectedFiles.includes(file))
                e.currentTarget.style.background = "transparent";
            }}
          >
            <Checkbox
              checked={selectedFiles.includes(file)}
              onChange={() => onToggle(file)}
              onClick={(e) => e.stopPropagation()}
              color="green"
              style={{ width: "14px", height: "14px" }}
            />
            <span
              style={{
                color: selectedFiles.includes(file) ? "#3fb950" : "#8b949e",
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
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT — TERMINAL PANEL (extract to TerminalPanel.jsx later)
// Fixed — never expands, content scrolls inside
// ─────────────────────────────────────────────────────────────────────────────
function TerminalPanel({ logs }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  return (
    <div
      style={{
        flex: 1,
        background: "#0d1117",
        border: "1px solid #30363d",
        borderRadius: "14px",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
      }}
    >
      {/* Terminal Header Bar with traffic light dots */}
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

      {/* Log Content — scrolls inside, panel never moves */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "16px",
          fontFamily: "'Courier New', Courier, monospace",
          fontSize: "12px",
          lineHeight: "1.7",
        }}
      >
        {logs.length === 0 ? (
          <span style={{ color: "#30363d" }}>Awaiting extraction...</span>
        ) : (
          logs.map((line, idx) => (
            <div key={idx} style={{ marginBottom: "2px" }}>
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
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT — ACTION BUTTONS + PROGRESS BAR (extract to Buttons.jsx later)
// ─────────────────────────────────────────────────────────────────────────────
function ActionButtons({
  onExtract,
  onCancel,
  extracting,
  noneSelected,
  progress,
  done,
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      <div style={{ display: "flex", gap: "12px" }}>
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

      {/* Progress Bar — visible only during or after extraction */}
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
                boxShadow: "0 0 8px rgba(63, 185, 80, 0.5)",
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
// MAIN — ZipExtractor (orchestrates all components above)
// ─────────────────────────────────────────────────────────────────────────────
export default function ZipExtractor({ fileList = MOCK_FILES }) {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [logs, setLogs] = useState([]);
  const [extracting, setExtracting] = useState(false);
  const [done, setDone] = useState(false);
  const [progress, setProgress] = useState(0);
  const eventSourceRef = useRef(null);
  const cancelledRef = useRef(false);

  const addLog = (msg) => setLogs((prev) => [...prev, msg]);

  const toggleFile = (file) => {
    setSelectedFiles((prev) =>
      prev.includes(file) ? prev.filter((f) => f !== file) : [...prev, file],
    );
  };

  // ── Extract handler ──────────────────────────────────────────────────────
  const startExtraction = async () => {
    if (selectedFiles.length === 0) return;
    setExtracting(true);
    setDone(false);
    setProgress(0);
    setLogs([]);
    cancelledRef.current = false;
    addLog(`Starting extraction of ${selectedFiles.length} file(s)...`);

    // ── MOCK SIMULATION ──
    // When backend is ready, replace this block with:
    //
    // await fetch("/extractZip", {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify({ zip: "example.zip", files: selectedFiles }),
    // });
    //
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
    // es.onerror = () => {
    //   es.close();
    //   setExtracting(false);
    //   setDone(true);
    //   setProgress(100);
    // };

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

  // ── Cancel handler ───────────────────────────────────────────────────────
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
    // Uncomment when backend is ready:
    // await fetch("/cancel", { method: "POST" });
    addLog("Aborted by user.");
    setExtracting(false);
    setDone(false);
    setProgress(0);
  };

  return (
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
      {/* ── INVISIBLE NAVBAR ── */}
      <Navbar />

      {/* ── BRANDING — centered floating above panels ── */}
      <Branding />

      {/* ── TWO SEPARATE PANELS SIDE BY SIDE ── */}
      <div
        style={{
          display: "flex",
          gap: "20px",
          width: "100%",
          maxWidth: "1100px",
          height: "440px",
        }}
      >
        {/* ── LEFT — FILE LIST PANEL ── */}
        <FileListPanel
          fileList={fileList}
          selectedFiles={selectedFiles}
          onToggle={toggleFile}
        />

        {/* ── RIGHT — TERMINAL PANEL ── */}
        <TerminalPanel logs={logs} />
      </div>

      {/* ── BUTTONS + PROGRESS — full width below both panels ── */}
      <div style={{ width: "100%", maxWidth: "1100px", marginTop: "16px" }}>
        <ActionButtons
          onExtract={startExtraction}
          onCancel={cancelProcess}
          extracting={extracting}
          noneSelected={selectedFiles.length === 0}
          progress={progress}
          done={done}
        />
      </div>
    </div>
  );
}
