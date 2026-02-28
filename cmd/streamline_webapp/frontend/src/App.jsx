import React, { useState } from "react";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import ZipExtractor from "./components/ZipExtractor";
import "./App.css";

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  const handleLoginSuccess = (credentialResponse) => {
    console.log("Login successful!");
    console.log("Token:", credentialResponse.credential);

    setToken(credentialResponse.credential);

    // Decode JWT to get user info (optional)
    const base64Url = credentialResponse.credential.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join(""),
    );
    const decoded = JSON.parse(jsonPayload);

    setUser(decoded);
    console.log("User:", decoded);
  };

  const handleLoginError = () => {
    console.log("Login failed");
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
  };

  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <div className="App">
        <header className="App-header">
          <h1>📦 Streamline - ZIP Extractor</h1>

          {!user ? (
            <div className="login-container">
              <p>Please login with Google to continue</p>
              <GoogleLogin
                onSuccess={handleLoginSuccess}
                onError={handleLoginError}
              />
            </div>
          ) : (
            <div className="user-container">
              <p>Welcome, {user.name}!</p>
              <img src={user.picture} alt={user.name} className="user-avatar" />
              <button onClick={handleLogout} className="logout-btn">
                Logout
              </button>
            </div>
          )}
        </header>

        {user && token ? (
          <ZipExtractor
            token={token}
            apiBase={import.meta.env.VITE_API_BASE_URL}
          />
        ) : (
          <div className="login-prompt">
            <p>Login to use the ZIP extractor</p>
          </div>
        )}
      </div>
    </GoogleOAuthProvider>
  );
}

export default App;
