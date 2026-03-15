import { useEffect, useRef } from "react";
import styles from "./ScoreRing.module.css";

function getColor(score) {
  if (score >= 80) return "#3fb950";
  if (score >= 50) return "#d29922";
  return "#f85149";
}

export default function ScoreRing({ score }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (score == null) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const size = 80;
    const cx = size / 2;
    const r = 30;
    canvas.width = size;
    canvas.height = size;

    const color = getColor(score);
    let current = 0;
    const target = score / 100;

    const draw = () => {
      ctx.clearRect(0, 0, size, size);
      // Track
      ctx.beginPath();
      ctx.arc(cx, cx, r, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255,255,255,0.07)";
      ctx.lineWidth = 6;
      ctx.stroke();
      // Fill
      ctx.beginPath();
      ctx.arc(cx, cx, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * current);
      ctx.strokeStyle = color;
      ctx.lineWidth = 6;
      ctx.lineCap = "round";
      ctx.stroke();
      // Text
      ctx.fillStyle = color;
      ctx.font = "600 16px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(Math.round(current * 100), cx, cx);
    };

    const step = () => {
      current = Math.min(current + target / 40, target);
      draw();
      if (current < target) requestAnimationFrame(step);
    };

    requestAnimationFrame(step);
  }, [score]);

  return (
    <div className={styles.wrap}>
      <canvas ref={canvasRef} className={styles.canvas} />
      <span className={styles.label}>Score</span>
    </div>
  );
}
