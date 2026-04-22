import { useMemo } from 'react';

type Star = {
  top: string;
  left: string;
  size: number;
  opacity: number;
  delay: string;
  duration: string;
};

type Beam = {
  top: string;
  left: string;
  width: string;
  height: string;
  rotate: string;
  delay: string;
  duration: string;
};

function createStars(count: number): Star[] {
  return Array.from({ length: count }, () => ({
    top: `${Math.random() * 100}%`,
    left: `${Math.random() * 100}%`,
    size: Math.random() * 2.8 + 0.8,
    opacity: Math.random() * 0.55 + 0.2,
    delay: `${Math.random() * 6}s`,
    duration: `${Math.random() * 4 + 4}s`,
  }));
}

function createBeams(count: number): Beam[] {
  return Array.from({ length: count }, (_, index) => ({
    top: `${8 + index * 18}%`,
    left: `${-8 + index * 24}%`,
    width: `${32 + index * 6}rem`,
    height: `${10 + index * 2}rem`,
    rotate: `${-18 + index * 9}deg`,
    delay: `${index * 0.8}s`,
    duration: `${10 + index * 1.5}s`,
  }));
}

export default function ThreeBackground() {
  const stars = useMemo(() => createStars(72), []);
  const beams = useMemo(() => createBeams(4), []);

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-black">
      <style>{`
        @keyframes star-twinkle {
          0%, 100% { opacity: 0.2; transform: scale(0.9); }
          50% { opacity: 1; transform: scale(1.4); }
        }

        @keyframes beam-drift {
          0% { transform: translate3d(-8%, 0, 0) rotate(var(--beam-rotate)); opacity: 0; }
          20% { opacity: 0.18; }
          80% { opacity: 0.12; }
          100% { transform: translate3d(10%, -4%, 0) rotate(var(--beam-rotate)); opacity: 0; }
        }

        @keyframes nebula-float {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
          50% { transform: translate3d(0, -4%, 0) scale(1.08); }
        }

        @keyframes grid-shift {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(48px, 24px, 0); }
        }
      `}</style>

      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 20% 20%, rgba(139, 92, 246, 0.24), transparent 30%), radial-gradient(circle at 80% 18%, rgba(236, 72, 153, 0.18), transparent 28%), radial-gradient(circle at 50% 72%, rgba(59, 130, 246, 0.14), transparent 34%), linear-gradient(180deg, rgba(4, 7, 18, 0.96) 0%, rgba(0, 0, 0, 1) 100%)',
          animation: 'nebula-float 18s ease-in-out infinite',
        }}
      />

      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          maskImage: 'linear-gradient(180deg, transparent, black 25%, black 75%, transparent)',
          animation: 'grid-shift 18s linear infinite',
        }}
      />

      {beams.map((beam, index) => (
        <div
          key={`beam-${index}`}
          className="absolute rounded-full blur-3xl"
          style={{
            top: beam.top,
            left: beam.left,
            width: beam.width,
            height: beam.height,
            background:
              'linear-gradient(90deg, rgba(168, 85, 247, 0), rgba(168, 85, 247, 0.18), rgba(244, 114, 182, 0.08), rgba(59, 130, 246, 0))',
            ['--beam-rotate' as string]: beam.rotate,
            animation: `beam-drift ${beam.duration} ease-in-out ${beam.delay} infinite`,
          }}
        />
      ))}

      {stars.map((star, index) => (
        <span
          key={`star-${index}`}
          className="absolute rounded-full bg-white"
          style={{
            top: star.top,
            left: star.left,
            width: `${star.size}px`,
            height: `${star.size}px`,
            opacity: star.opacity,
            boxShadow: '0 0 12px rgba(255,255,255,0.9)',
            animation: `star-twinkle ${star.duration} ease-in-out ${star.delay} infinite`,
          }}
        />
      ))}

      <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black to-transparent" />
    </div>
  );
}
