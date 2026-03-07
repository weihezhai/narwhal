import { useEffect, useState } from "react";

interface ConfettiPiece {
  id: number;
  x: number;
  delay: number;
  duration: number;
  size: number;
  color: string;
  side: "left" | "right";
  rotation: number;
  swingAmplitude: number;
}

const COLORS = [
  "hsl(210, 100%, 56%)",   // primary blue
  "hsl(210, 100%, 70%)",   // light blue
  "hsl(210, 80%, 45%)",    // darker blue
  "hsl(0, 0%, 100%)",      // white
  "hsl(0, 0%, 95%)",       // off-white
  "hsl(210, 60%, 80%)",    // pale blue
];

export default function Confetti({ active }: { active: boolean }) {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);

  useEffect(() => {
    if (!active) { setPieces([]); return; }
    const generated: ConfettiPiece[] = [];
    for (let i = 0; i < 60; i++) {
      generated.push({
        id: i,
        x: Math.random() * 120 - 10,
        delay: Math.random() * 1.2,
        duration: 2 + Math.random() * 2,
        size: 6 + Math.random() * 8,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        side: i < 30 ? "left" : "right",
        rotation: Math.random() * 360,
        swingAmplitude: 20 + Math.random() * 40,
      });
    }
    setPieces(generated);
  }, [active]);

  if (!active || pieces.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      <style>{`
        @keyframes confetti-fall {
          0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          80% { opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        @keyframes confetti-swing {
          0%, 100% { translate: 0px; }
          25% { translate: var(--swing);}
          75% { translate: calc(var(--swing) * -1); }
        }
      `}</style>
      {pieces.map((p) => (
        <div
          key={p.id}
          style={{
            position: "absolute",
            top: -20,
            left: p.side === "left" ? `${p.x * 0.3}%` : undefined,
            right: p.side === "right" ? `${(p.x) * 0.3}%` : undefined,
            width: p.size,
            height: p.size * (0.4 + Math.random() * 0.6),
            backgroundColor: p.color,
            borderRadius: Math.random() > 0.5 ? "50%" : "2px",
            animation: `confetti-fall ${p.duration}s ease-in ${p.delay}s forwards, confetti-swing ${p.duration * 0.5}s ease-in-out ${p.delay}s infinite`,
            ["--swing" as any]: `${p.swingAmplitude}px`,
            transform: `rotate(${p.rotation}deg)`,
          }}
        />
      ))}
    </div>
  );
}
