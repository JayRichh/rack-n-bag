import { motion, MotionValue, useMotionValue, useAnimationFrame } from 'framer-motion';
import { useState, useEffect } from 'react';

interface FloatingShapeProps {
  /** CSS class for the shape's color and other styles */
  color: string;
  /** Size in pixels */
  size: number;
  /** Initial X position */
  initialX: number;
  /** Initial Y position */
  initialY: number;
  /** Mouse X position motion value */
  mouseX: MotionValue<number>;
  /** Mouse Y position motion value */
  mouseY: MotionValue<number>;
  /** Reference to container element */
  containerRef: React.RefObject<HTMLDivElement>;
}

interface Velocity {
  x: number;
  y: number;
}

/**
 * A floating shape that responds to mouse movement and container boundaries
 * with smooth physics-based animation.
 */
export const FloatingShape: React.FC<FloatingShapeProps> = ({
  color,
  size,
  initialX,
  initialY,
  mouseX,
  mouseY,
  containerRef
}) => {
  // Position motion values
  const x = useMotionValue(initialX);
  const y = useMotionValue(initialY);
  
  // Animation state
  const [time, setTime] = useState(Math.random() * 1000);
  const [isInitialized, setIsInitialized] = useState(false);
  const [velocity, setVelocity] = useState<Velocity>({ x: 0, y: 0 });

  // Initialize with a slight delay to prevent jarring start
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialized(true);
      setVelocity({ 
        x: (Math.random() - 0.5) * 0.1, // Very gentle initial velocity
        y: (Math.random() - 0.5) * 0.1 
      });
    }, Math.random() * 500); // Random delay up to 500ms

    return () => clearTimeout(timer);
  }, []);

  // Constants for physics simulation
  const DRAG = 0.97;
  const MAX_SPEED = 0.3;
  const MOUSE_INFLUENCE_RADIUS = 400;
  const MOUSE_INFLUENCE_STRENGTH = 0.0003;
  const DRIFT_SCALE = 0.05;
  const BOUNCE_DAMPENING = 0.6;
  const TIME_STEP = 0.001;

  useAnimationFrame(() => {
    if (!containerRef.current || !isInitialized) return;
    const container = containerRef.current.getBoundingClientRect();
    
    // Update time for natural drift
    setTime(prev => prev + TIME_STEP);
    
    // Calculate drift using sine waves for smooth movement
    const driftX = Math.sin(time * 0.3) * DRIFT_SCALE;
    const driftY = Math.cos(time * 0.2) * DRIFT_SCALE;
    
    // Get current positions
    const currentX = x.get();
    const currentY = y.get();
    const mouseXValue = mouseX.get();
    const mouseYValue = mouseY.get();

    // Calculate distance to mouse
    const dx = mouseXValue - currentX;
    const dy = mouseYValue - currentY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Update velocity with drift
    let newVelX = velocity.x + driftX;
    let newVelY = velocity.y + driftY;
    
    // Apply mouse influence when in range
    if (distance < MOUSE_INFLUENCE_RADIUS) {
      const influence = MOUSE_INFLUENCE_STRENGTH * (1 - distance / MOUSE_INFLUENCE_RADIUS);
      newVelX -= (dx / distance) * influence;
      newVelY -= (dy / distance) * influence;
    }
    
    // Handle boundary collisions with margin
    const margin = size * 0.6; // Larger margin for smoother edges
    if (currentX <= margin || currentX >= container.width - margin) {
      newVelX *= -BOUNCE_DAMPENING;
      // Add slight vertical movement on horizontal bounce
      newVelY += (Math.random() - 0.5) * 0.1;
    }
    if (currentY <= margin || currentY >= container.height - margin) {
      newVelY *= -BOUNCE_DAMPENING;
      // Add slight horizontal movement on vertical bounce
      newVelX += (Math.random() - 0.5) * 0.1;
    }
    
    // Apply drag force
    newVelX *= DRAG;
    newVelY *= DRAG;
    
    // Enforce speed limit
    const currentSpeed = Math.sqrt(newVelX * newVelX + newVelY * newVelY);
    if (currentSpeed > MAX_SPEED) {
      newVelX = (newVelX / currentSpeed) * MAX_SPEED;
      newVelY = (newVelY / currentSpeed) * MAX_SPEED;
    }
    
    // Update position with boundary checks
    x.set(Math.max(margin, Math.min(currentX + newVelX, container.width - margin)));
    y.set(Math.max(margin, Math.min(currentY + newVelY, container.height - margin)));
    
    setVelocity({ x: newVelX, y: newVelY });
  });

  return (
    <motion.div
      className={`absolute ${color} blur-[140px] mix-blend-multiply dark:mix-blend-screen`}
      style={{
        width: size,
        height: size,
        x,
        y,
        opacity: 0.75,
        scale: isInitialized ? 1 : 0.8,
        transition: 'scale 0.5s ease-out'
      }}
    />
  );
};
