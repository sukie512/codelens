import { useState, useRef, useCallback } from "react";

export function useReviewStream() {
  const [streaming, setStreaming] = useState(false);
  const [chunks, setChunks] = useState("");
  const [status, setStatus] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const esRef = useRef(null);

  const startReview = useCallback(async ({ code, language, mode }) => {
    if (esRef.current) esRef.current.close();

    setStreaming(true);
    setChunks("");
    setStatus("Connecting...");
    setResult(null);
    setError(null);

    const token = localStorage.getItem("token");

    // SSE doesn't support POST natively — use fetch with ReadableStream
    try {
      const res = await fetch("/api/review", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ code, language, mode }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Review failed");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop();

        for (const line of lines) {
          if (line.startsWith("event: ")) {
            // event type stored for next data line
          } else if (line.startsWith("data: ")) {
            try {
              const raw = line.slice(6);
              if (raw === "{}") continue;
              const data = JSON.parse(raw);

              if (data.message) setStatus(data.message);
              if (data.text) setChunks((prev) => prev + data.text);
              if (data.parsed) {
                setResult(data);
                setStreaming(false);
              }
              if (data.message === "Review failed. Please try again.") {
                setError(data.message);
                setStreaming(false);
              }
            } catch {}
          }
        }
      }
    } catch (err) {
      setError(err.message);
      setStreaming(false);
    }
  }, []);

  const reset = useCallback(() => {
    setChunks("");
    setStatus("");
    setResult(null);
    setError(null);
    setStreaming(false);
  }, []);

  return { streaming, chunks, status, result, error, startReview, reset };
}
