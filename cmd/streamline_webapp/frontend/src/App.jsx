import React, { useState } from "react";
import { GoogleOAuthProvider } from "@react-oauth/google";
import LoginLandingPage from "./components/Loginlandingpage";
import ZipExtractor from "./components/ZipExtractor";
import "./App.css";

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [showExtractor, setShowExtractor] = useState(false);

  const handleSelectFile = (fileInfo) => {
    console.log("File selected:", fileInfo);
    setSelectedFile(fileInfo);
    setShowExtractor(true);
  };

  const handleBackToLoginLanding = () => {
    setSelectedFile(null);
    setShowExtractor(false);
  };

  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <div className="App">
        {!showExtractor ? (
          // PAGE 1: LOGIN + LANDING (combined)
          <LoginLandingPage onSelectFile={handleSelectFile} />
        ) : (
          // PAGE 2: EXTRACTOR (Streamline Web Application with 3 panels)
          <>
            <header className="App-header">
              <div className="user-info-header">
                <h1>📦 Streamline - ZIP Extractor</h1>
                <button onClick={handleBackToLoginLanding} className="back-btn">
                  ← Back
                </button>
              </div>
            </header>
            <ZipExtractor
              token={localStorage.getItem("google_access_token")}
              apiBase={import.meta.env.VITE_API_BASE_URL}
              selectedFile={selectedFile}
            />
          </>
        )}
      </div>
    </GoogleOAuthProvider>
  );
}

export default App;
