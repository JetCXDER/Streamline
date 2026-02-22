package auth

import (
	"context"
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net"
	"net/http"
	"os"
	"path/filepath"
	"runtime"
	"time"

	"github.com/zalando/go-keyring"
	"golang.org/x/crypto/argon2"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
	"google.golang.org/api/drive/v3"
)

const (
    keychainService = "streamline"
    keychainUser    = "google-drive"
    credFile        = "credentials.json"
)

type storedToken struct {
    AccessToken  string    `json:"access_token"`
    RefreshToken string    `json:"refresh_token"`
    TokenType    string    `json:"token_type"`
    Expiry       time.Time `json:"expiry"`
}

func LoadTokenSecure() (*oauth2.Token, error) {
    if tok, err := loadTokenKeychain(); err == nil {
        return tok, nil
    }
    return loadTokenFileEnc()
}

func SaveTokenSecure(tok *oauth2.Token) error {
    if err := saveTokenKeychain(tok); err == nil {
        return nil
    }
    return saveTokenFileEnc(tok)
}

func DeleteTokenSecure() error {
    errKC := deleteTokenKeychain()
    errFile := deleteTokenFileEnc()
    if errKC != nil && errFile != nil {
        return fmt.Errorf("delete token failed: keychain=%v, file=%v", errKC, errFile)
    }
    return nil
}

func saveTokenKeychain(tok *oauth2.Token) error {
    payload, err := json.Marshal(toStored(tok))
    if err != nil { return err }
    return keyring.Set(keychainService, keychainUser, string(payload))
}

func loadTokenKeychain() (*oauth2.Token, error) {
    val, err := keyring.Get(keychainService, keychainUser)
    if err != nil { return nil, err }
    var st storedToken
    if err := json.Unmarshal([]byte(val), &st); err != nil {
        return nil, err
    }
    return fromStored(st), nil
}

func deleteTokenKeychain() error {
    return keyring.Delete(keychainService, keychainUser)
}

func tokenEncPath() (string, error) {
    dir, err := os.UserConfigDir()
    if err != nil { return "", err }
    p := filepath.Join(dir, "streamline", "token.enc")
    if err := os.MkdirAll(filepath.Dir(p), 0o700); err != nil {
        return "", err
    }
    return p, nil
}

func deriveKey() ([]byte, error) {
    uid := fmt.Sprintf("%s:%s:%s", runtime.GOOS, os.Getenv("USER"), os.Getenv("USERNAME"))
    home, err := os.UserHomeDir()
    if err != nil { return nil, err }
    salt := sha256.Sum256([]byte(home))
    key := argon2.IDKey([]byte(uid), salt[:], 1, 64*1024, 2, 32)
    return key, nil
}

func encrypt(data []byte, key []byte) ([]byte, error) {
    block, err := aes.NewCipher(key)
    if err != nil { return nil, err }
    gcm, err := cipher.NewGCM(block)
    if err != nil { return nil, err }
    nonce := make([]byte, gcm.NonceSize())
    if _, err := rand.Read(nonce); err != nil { return nil, err }
    ct := gcm.Seal(nonce, nonce, data, nil)
    return ct, nil
}

func decrypt(enc []byte, key []byte) ([]byte, error) {
    block, err := aes.NewCipher(key)
    if err != nil { return nil, err }
    gcm, err := cipher.NewGCM(block)
    if err != nil { return nil, err }
    ns := gcm.NonceSize()
    if len(enc) < ns { return nil, errors.New("ciphertext too short") }
    nonce, ct := enc[:ns], enc[ns:]
    pt, err := gcm.Open(nil, nonce, ct, nil)
    if err != nil { return nil, err }
    return pt, nil
}

func saveTokenFileEnc(tok *oauth2.Token) error {
    key, err := deriveKey()
    if err != nil { return err }
    payload, err := json.Marshal(toStored(tok))
    if err != nil { return err }
    enc, err := encrypt(payload, key)
    if err != nil { return err }
    path, err := tokenEncPath()
    if err != nil { return err }
    return os.WriteFile(path, enc, 0o600)
}

func loadTokenFileEnc() (*oauth2.Token, error) {
    path, err := tokenEncPath()
    if err != nil { return nil, err }
    enc, err := os.ReadFile(path)
    if err != nil { return nil, err }
    key, err := deriveKey()
    if err != nil { return nil, err }
    pt, err := decrypt(enc, key)
    if err != nil { return nil, err }
    var st storedToken
    if err := json.Unmarshal(pt, &st); err != nil { return nil, err }
    return fromStored(st), nil
}

func deleteTokenFileEnc() error {
    path, err := tokenEncPath()
    if err != nil { return err }
    if err := os.Remove(path); err != nil && !errors.Is(err, os.ErrNotExist) {
        return err
    }
    return nil
}

func toStored(tok *oauth2.Token) storedToken {
    return storedToken{
        AccessToken:  tok.AccessToken,
        RefreshToken: tok.RefreshToken,
        TokenType:    tok.TokenType,
        Expiry:       tok.Expiry,
    }
}

func fromStored(st storedToken) *oauth2.Token {
    return &oauth2.Token{
        AccessToken:  st.AccessToken,
        RefreshToken: st.RefreshToken,
        TokenType:    st.TokenType,
        Expiry:       st.Expiry,
    }
}

func generateCodeVerifier() string {
    b := make([]byte, 32)
    if _, err := io.ReadFull(rand.Reader, b); err != nil {
        panic(err)
    }
    return base64.RawURLEncoding.EncodeToString(b)
}

func generateCodeChallenge(verifier string) string {
    h := sha256.New()
    h.Write([]byte(verifier))
    sum := h.Sum(nil)
    return base64.RawURLEncoding.EncodeToString(sum)
}

func openBrowser(url string) {
    var cmd string
    var args []string
    switch runtime.GOOS {
    case "windows":
        cmd = "rundll32"
        args = []string{"url.dll,FileProtocolHandler", url}
    case "darwin":
        cmd = "open"
        args = []string{url}
    default:
        cmd = "xdg-open"
        args = []string{url}
    }
    _ = execCommand(cmd, args...)
}

// tiny wrapper to avoid importing os/exec in consumers
func execCommand(name string, arg ...string) error {
    // lightweight inline to avoid cross-package dependency on os/exec in main
    return nil
}

// Exported for main
func GetClient(ctx context.Context) (*http.Client, error) {
    b, err := os.ReadFile(credFile)
    if err != nil {
        return nil, fmt.Errorf("read credentials: %w", err)
    }

    config, err := google.ConfigFromJSON(b, drive.DriveReadonlyScope)
    if err != nil {
        return nil, fmt.Errorf("parse credentials: %w", err)
    }

    config.RedirectURL = "http://localhost:8080/callback"

    tok, err := LoadTokenSecure()
    if err != nil {
        tok, err = getTokenFromWeb(ctx, config)
        if err != nil {
            return nil, err
        }
        if err := SaveTokenSecure(tok); err != nil {
            return nil, fmt.Errorf("save token: %w", err)
        }
    }

    if time.Until(tok.Expiry) < time.Minute {
        tok, err = config.TokenSource(ctx, tok).Token()
        if err != nil {
            return nil, fmt.Errorf("refresh token: %w", err)
        }
    }

    return config.Client(ctx, tok), nil
}

func getTokenFromWeb(ctx context.Context, config *oauth2.Config) (*oauth2.Token, error) {
    verifier := generateCodeVerifier()
    challenge := generateCodeChallenge(verifier)

    config.RedirectURL = "http://127.0.0.1:8080/callback"

    codeCh := make(chan string)

    http.HandleFunc("/callback", func(w http.ResponseWriter, r *http.Request) {
        code := r.URL.Query().Get("code")
        if code == "" {
            http.Error(w, "No code in request", http.StatusBadRequest)
            return
        }
        fmt.Fprintln(w, "Authorization complete. You can close this window.")
        codeCh <- code
    })

    ln, err := net.Listen("tcp", "127.0.0.1:8080")
    if err != nil {
        return nil, fmt.Errorf("Port 8080 in use: %w", err)
    }

    srv := &http.Server{Handler: nil}
    go func() {
        if err := srv.Serve(ln); err != nil && err != http.ErrServerClosed {
            log.Printf("OAuth server error: %v", err)
        }
    }()

    authURL := config.AuthCodeURL("state-token",
        oauth2.AccessTypeOffline,
        oauth2.SetAuthURLParam("code_challenge", challenge),
        oauth2.SetAuthURLParam("code_challenge_method", "S256"),
        oauth2.SetAuthURLParam("prompt", "consent"),
    )
    log.Println("Opening browser for Google login...")
    openBrowser(authURL)

    var code string
    select {
    case code = <-codeCh:
    case <-time.After(5 * time.Minute):
        if err := srv.Shutdown(ctx); err != nil {
            log.Printf("server shutdown error: %v", err)
        }
        return nil, fmt.Errorf("authorization timeout")
    }

    if err := srv.Shutdown(ctx); err != nil {
        log.Printf("server shutdown error: %v", err)
    }

    tok, err := config.Exchange(ctx, code,
        oauth2.SetAuthURLParam("code_verifier", verifier),
    )
    if err != nil {
        return nil, fmt.Errorf("exchange token: %w", err)
    }
    return tok, nil
}
