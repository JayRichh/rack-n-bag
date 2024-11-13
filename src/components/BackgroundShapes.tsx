import { useRef, useEffect } from 'react';
import { useMotionValue } from 'framer-motion';
import { FloatingShape } from './FloatingShape';

interface BackgroundShapesProps {
  /** Class name for the container */
  className?: string;
}

/**
 * Animated background shapes that respond to mouse movement.
 * Manages multiple floating shapes and their mouse interaction.
 */
export const BackgroundShapes: React.FC<BackgroundShapesProps> = ({ className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        mouseX.set(e.clientX - rect.left);
        mouseY.set(e.clientY - rect.top);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  // Calculate positions using viewport units for responsiveness
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1200;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800;

  // Base positions using viewport units
  const positions = {
    black1: {
      x: vw * 0.5,  // 50% from left
      y: vh * 0.3   // 30% from top
    },
    red: {
      x: vw * 0.85, // 85% from left (further right)
      y: vh * 0.1   // 10% from top (higher up)
    },
    black2: {
      x: vw * 0.7,  // 70% from left
      y: vh * 0.5   // 50% from top
    }
  };

  return (
    <div ref={containerRef} className={`absolute inset-0 z-0 overflow-hidden ${className}`}>
      {/* Red shape first to ensure it's rendered on top */}
      <div className="relative z-20">
        <FloatingShape
          color="bg-red-500/80 dark:bg-red-500/50"
          size={450}
          initialX={positions.red.x}
          initialY={positions.red.y}
          mouseX={mouseX}
          mouseY={mouseY}
          containerRef={containerRef}
        />
      </div>

      {/* Black shapes underneath */}
      <div className="relative z-10">
        <FloatingShape
          color="bg-black dark:bg-zinc-900"
          size={500}
          initialX={positions.black1.x}
          initialY={positions.black1.y}
          mouseX={mouseX}
          mouseY={mouseY}
          containerRef={containerRef}
        />
        <FloatingShape
          color="bg-black dark:bg-zinc-900"
          size={400}
          initialX={positions.black2.x}
          initialY={positions.black2.y}
          mouseX={mouseX}
          mouseY={mouseY}
          containerRef={containerRef}
        />
      </div>
    </div>
  );
};
