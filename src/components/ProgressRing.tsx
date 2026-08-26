import { useEffect, useRef, useState } from 'react';

type ProgressRingProps = {
  completed: number;
  goal: number;
  size?: number;
  petName?: string;
  petId?: string;
};

type ConfettiPiece = {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  color: string;
  size: number;
};

const CONFETTI_COLORS = ['#2f5d43', '#5b8a5b', '#f59e0b', '#fbbf24', '#e0b341', '#d97706'];

function generateConfetti(centerX: number, centerY: number): ConfettiPiece[] {
  const pieces: ConfettiPiece[] = [];
  for (let i = 0; i < 40; i++) {
    const angle = (Math.PI * 2 * i) / 40 + Math.random() * 0.3;
    const speed = 2 + Math.random() * 3;
    pieces.push({
      id: i,
      x: centerX,
      y: centerY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 1,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 15,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      size: 4 + Math.random() * 5,
    });
  }
  return pieces;
}

export function ProgressRing({ completed, goal, size = 120, petName, petId }: ProgressRingProps) {
  const stroke = 8;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const ratio = goal > 0 ? Math.min(completed / goal, 1) : 0;
  const offset = circumference * (1 - ratio);
  const isComplete = ratio === 1 && goal > 0;

  const [confetti, setConfetti] = useState<ConfettiPiece[]>([]);
  const prevComplete = useRef(false);
  const celebratedPetKey = useRef<string | null>(null);

  useEffect(() => {
    const todayKey = `${petId ?? petName ?? 'unknown'}-${new Date().toDateString()}`;
    if (isComplete && !prevComplete.current && celebratedPetKey.current !== todayKey) {
      celebratedPetKey.current = todayKey;
      const pieces = generateConfetti(size / 2, size / 2);
      setConfetti(pieces);

      let frame = 0;
      const maxFrames = 70;
      const animate = () => {
        frame++;
        setConfetti((prev) =>
          prev.map((p) => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy + frame * 0.08,
            vy: p.vy + 0.12,
            rotation: p.rotation + p.rotationSpeed,
          })),
        );
        if (frame < maxFrames) {
          requestAnimationFrame(animate);
        } else {
          setConfetti([]);
        }
      };
      requestAnimationFrame(animate);
    }
    prevComplete.current = isComplete;
  }, [isComplete, petId, petName, size]);

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e5e2da"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#2f5d43"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-2xl font-extrabold leading-none text-forest-600">
          {completed}
          <span className="text-gray-400">/{goal}</span>
        </span>
        <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
          tasks
        </span>
      </div>
      {confetti.length > 0 && (
        <div className="pointer-events-none absolute inset-0 overflow-visible">
          {confetti.map((p) => (
            <div
              key={p.id}
              className="absolute"
              style={{
                left: `${p.x}px`,
                top: `${p.y}px`,
                width: `${p.size}px`,
                height: `${p.size * 0.6}px`,
                backgroundColor: p.color,
                borderRadius: '1px',
                transform: `rotate(${p.rotation}deg)`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
