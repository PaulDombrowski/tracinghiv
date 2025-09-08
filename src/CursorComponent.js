import React, { useEffect, useState } from 'react';

const CursorComponent = () => {
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const [gradientSize, setGradientSize] = useState(500); // Default size for the gradient

  useEffect(() => {
    const handleMouseMove = (e) => {
      const { clientX, clientY } = e;
      setCursorPosition({ x: clientX, y: clientY });

      // Calculate the size of the gradient based on distance from the center
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      const centerX = windowWidth / 2;
      const centerY = windowHeight / 2;

      const distanceFromCenter = Math.sqrt((clientX - centerX) ** 2 + (clientY - centerY) ** 2);
      const maxDistance = Math.sqrt(centerX ** 2 + centerY ** 2);

      // Adjust the gradient size to shrink as the cursor moves towards the edge
      const newGradientSize = Math.max(100, 500 * (1 - distanceFromCenter / maxDistance));
      setGradientSize(newGradientSize);
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        width: '15px', // Fixed size for the red point in the center
        height: '15px',
        borderRadius: '50%',
        background: 'rgba(255,0,0,1)', // Solid red point
        pointerEvents: 'none',
        top: `${cursorPosition.y}px`,
        left: `${cursorPosition.x}px`,
        transform: 'translate(-50%, -50%)', // Center the cursor
        zIndex: 1000,
        boxShadow: `0 0 ${gradientSize}px ${gradientSize / 2}px rgba(255,0,0,0.5)`, // Red glow effect that shrinks based on cursor position
        transition: 'box-shadow 0.3s ease', // Smooth transition for the gradient resizing
      }}
    />
  );
};

export default CursorComponent;
