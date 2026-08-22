/**
 * voice.js — browser-native speech, no API key, no server round-trip.
 * Text-to-speech: window.speechSynthesis (wide support).
 * Speech-to-text: webkitSpeechRecognition (Chrome/Edge only — feature-detected).
 */

export const ttsSupported = () =>
  typeof window !== "undefined" && "speechSynthesis" in window;

export const sttSupported = () =>
  typeof window !== "undefined" && Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);

/** Speak text aloud. Cancels any prior utterance first (no overlapping voices). */
export function speak(text, { rate = 1, onEnd } = {}) {
  if (!ttsSupported() || !text) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.rate = rate;
  if (onEnd) utter.onend = onEnd;
  window.speechSynthesis.speak(utter);
}

export function stopSpeaking() {
  if (ttsSupported()) window.speechSynthesis.cancel();
}

/**
 * Start one-shot dictation. Calls onResult(transcript) when the learner
 * stops talking, onError(message) on failure. Returns a stop() function.
 */
export function startDictation({ onResult, onError, onStart, onEnd }) {
  const Impl = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Impl) {
    onError?.("Voice input isn't supported in this browser — try Chrome or Edge.");
    return () => {};
  }
  const recognition = new Impl();
  recognition.lang = "en-US";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onstart = () => onStart?.();
  recognition.onresult = (e) => onResult?.(e.results[0][0].transcript);
  recognition.onerror = (e) => onError?.(e.error === "not-allowed" ? "Microphone permission denied." : `Voice input error: ${e.error}`);
  recognition.onend = () => onEnd?.();

  recognition.start();
  return () => recognition.stop();
}
