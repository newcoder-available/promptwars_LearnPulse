import { useRef, useState } from "react";
import { startDictation, sttSupported } from "../lib/voice.js";

/**
 * Small mic button: press to dictate, transcript is appended via onText.
 * Silently renders nothing if the browser doesn't support speech recognition
 * (Safari/Firefox) — never blocks the typing fallback.
 */
export default function MicButton({ onText, label = "Dictate" }) {
  const [listening, setListening] = useState(false);
  const [error, setError] = useState("");
  const stopRef = useRef(null);

  if (!sttSupported()) return null;

  const toggle = () => {
    if (listening) {
      stopRef.current?.();
      return;
    }
    setError("");
    stopRef.current = startDictation({
      onStart: () => setListening(true),
      onResult: (transcript) => onText(transcript),
      onError: (msg) => {
        setError(msg);
        setListening(false);
      },
      onEnd: () => setListening(false),
    });
  };

  return (
    <span style={{ display: "inline-flex", flexDirection: "column", alignItems: "flex-start" }}>
      <button
        type="button"
        onClick={toggle}
        aria-pressed={listening}
        aria-label={listening ? "Stop dictation" : label}
        style={{
          padding: "8px 12px",
          fontSize: 13,
          borderColor: listening ? "var(--alert)" : undefined,
          color: listening ? "var(--alert)" : undefined,
        }}
      >
        {listening ? "● Listening…" : `🎤 ${label}`}
      </button>
      {error && (
        <span style={{ fontSize: 12, color: "var(--alert)", marginTop: 4 }} role="alert">
          {error}
        </span>
      )}
    </span>
  );
}
