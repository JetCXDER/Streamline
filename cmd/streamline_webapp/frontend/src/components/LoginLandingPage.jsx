import React, { useState } from "react";
import { useGoogleLogin } from "@react-oauth/google";

const COMBINED_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');

  .combined-container {
    min-height: 100vh;
    background: #ffffff;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 20px;
    position: relative;
    width: 100%;
    max-width: 100vw;
    box-sizing: border-box;
    overflow-x: hidden;
  }

  .combined-container::after {
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
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .combined-header {
    text-align: center;
    margin-bottom: 40px;
    animation: pixelFadeIn 0.6s ease forwards;
  }

  .combined-title {
    font-family: 'Press Start 2P', monospace;
    font-size: 28px;
    letter-spacing: 4px;
    animation: glitchColor 8s infinite;
    margin-bottom: 10px;
    text-shadow: 3px 3px 0 #ccc;
  }

  .combined-subtitle {
    font-family: 'Press Start 2P', monospace;
    font-size: 8px;
    color: #999;
    letter-spacing: 2px;
  }

  .combined-content {
    display: flex;
    flex-direction: column;
    gap: 40px;
    max-width: 500px;
    animation: pixelFadeIn 0.8s ease forwards;
  }

  /* LOGIN SECTION */
  .login-section {
    border: 4px solid #000;
    padding: 32px;
    background: #fff;
    box-shadow: 6px 6px 0 #000;
  }

  .login-section-title {
    font-family: 'Press Start 2P', monospace;
    font-size: 10px;
    letter-spacing: 2px;
    margin-bottom: 20px;
    text-align: center;
    border-bottom: 3px solid #000;
    padding-bottom: 12px;
  }

  .login-instruction {
    font-family: 'Press Start 2P', monospace;
    font-size: 8px;
    color: #666;
    text-align: center;
    margin-bottom: 24px;
    line-height: 1.6;
  }

  .google-login-wrapper {
    display: flex;
    justify-content: center;
    margin-bottom: 20px;
  }

  /* USER INFO (after login) */
  .user-info {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    margin-top: 20px;
    padding-top: 20px;
    border-top: 3px solid #000;
  }

  .user-welcome {
    font-family: 'Press Start 2P', monospace;
    font-size: 9px;
    text-align: center;
    color: #000;
  }

  .user-avatar {
    width: 48px;
    height: 48px;
    border-radius: 0; /* Square for retro feel */
    border: 2px solid #000;
  }

  .logout-btn {
    font-family: 'Press Start 2P', monospace;
    font-size: 7px;
    padding: 8px 12px;
    border: 2px solid #cc0000;
    background: #fff;
    color: #cc0000;
    cursor: pointer;
    box-shadow: 3px 3px 0 #cc0000;
    transition: all 0.1s;
  }

  .logout-btn:hover {
    background: #cc0000;
    color: #fff;
    box-shadow: 1px 1px 0 #cc0000;
    transform: translate(2px, 2px);
  }

  /* SERVICES SECTION (after login) */
  .services-section {
    display: none;
    flex-direction: column;
    gap: 16px;
  }

  .services-section.active {
    display: flex;
    animation: pixelFadeIn 0.6s ease forwards;
  }

  .services-title {
    font-family: 'Press Start 2P', monospace;
    font-size: 10px;
    letter-spacing: 2px;
    text-align: center;
    margin-bottom: 10px;
  }

  .service-card {
    border: 3px solid #000;
    background: #fff;
    padding: 18px;
    cursor: pointer;
    box-shadow: 5px 5px 0 #000;
    transition: all 0.1s;
    display: flex;
    align-items: center;
    gap: 14px;
  }

  .service-card:hover:not(.disabled) {
    background: #000;
    color: #fff;
    box-shadow: 2px 2px 0 #000;
    transform: translate(2px, 2px);
  }

  .service-card:active:not(.disabled) {
    box-shadow: 0 0 0 #000;
    transform: translate(5px, 5px);
  }

  .service-card.disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .service-icon {
    font-size: 24px;
    flex-shrink: 0;
  }

  .service-content {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  .service-name {
    font-family: 'Press Start 2P', monospace;
    font-size: 9px;
    letter-spacing: 1px;
  }

  .service-description {
    font-family: 'Press Start 2P', monospace;
    font-size: 6px;
    color: inherit;
    opacity: 0.7;
  }

  .combined-footer {
    position: absolute;
    bottom: 20px;
    font-family: 'Press Start 2P', monospace;
    font-size: 6px;
    color: #ccc;
    letter-spacing: 2px;
    animation: blink 3s infinite;
  }
`;

export default function LoginLandingPage({ onSelectFile }) {
  const [user, setUser] = useState(null);

  // ✅ Correct OAuth flow (returns access_token)
  const login = useGoogleLogin({
    scope:
      "openid email profile https://www.googleapis.com/auth/drive.readonly",
    onSuccess: async (tokenResponse) => {
      console.log("Access Token:", tokenResponse.access_token);

      // Store access token for Picker
      localStorage.setItem("google_access_token", tokenResponse.access_token);

      // Fetch user profile info
      const userInfoResponse = await fetch(
        "https://www.googleapis.com/oauth2/v3/userinfo",
        {
          headers: {
            Authorization: `Bearer ${tokenResponse.access_token}`,
          },
        },
      );

      const userData = await userInfoResponse.json();
      setUser(userData);
      console.log("User:", userData);
    },
    onError: () => {
      console.log("Login Failed");
    },
  });

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("google_access_token");
  };

  const handleGoogleDrive = () => {
    console.log("Opening Google Drive picker...");
    loadGoogleDrivePickerAPI(onSelectFile);
  };

  return (
    <div style={{ textAlign: "center", paddingTop: "100px" }}>
      <h1>⚡ STREAMLINE</h1>

      {!user ? (
        <button onClick={() => login()}>SIGN IN WITH GOOGLE</button>
      ) : (
        <>
          <h3>Welcome, {user.name}!</h3>
          <img
            src={user.picture}
            alt={user.name}
            width="60"
            style={{ borderRadius: "50%" }}
          />
          <br />
          <button onClick={handleLogout}>Logout</button>
          <hr />
          <button onClick={handleGoogleDrive}>Open Google Drive</button>
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* ---------------------- GOOGLE PICKER LOGIC ------------------------ */
/* ------------------------------------------------------------------ */

function loadGoogleDrivePickerAPI(callback) {
  if (window.gapi && window.google) {
    window.gapi.load("picker", () => {
      createAndOpenPicker(callback);
    });
    return;
  }

  const script = document.createElement("script");
  script.src = "https://apis.google.com/js/api.js";
  script.onload = () => {
    window.gapi.load("picker", () => {
      createAndOpenPicker(callback);
    });
  };
  document.body.appendChild(script);
}

function createAndOpenPicker(callback) {
  const token = localStorage.getItem("google_access_token");

  if (!token) {
    alert("Please log in first!");
    return;
  }

  const picker = new window.google.picker.PickerBuilder()
    .addView(
      new window.google.picker.DocsView(window.google.picker.ViewId.DOCS)
        .setMimeTypes(
          "application/zip,application/x-rar-compressed,application/x-7z-compressed",
        )
        .setIncludeFolders(true),
    )
    .setOAuthToken(token)
    .setDeveloperKey(import.meta.env.VITE_GOOGLE_API_KEY)
    .setCallback((data) => handlePickerCallback(data, callback))
    .build();

  picker.setVisible(true);
}

function handlePickerCallback(data, callback) {
  const action = data[window.google.picker.Response.ACTION];

  if (action === window.google.picker.Action.PICKED) {
    const doc = data[window.google.picker.Response.DOCUMENTS][0];

    callback({
      fileId: doc.id,
      fileName: doc.name,
      mimeType: doc.mimeType,
    });
  }
}
