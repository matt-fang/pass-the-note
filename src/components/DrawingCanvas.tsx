'use client';

import { useRef, useEffect, useState } from 'react';

interface DrawingCanvasProps {
  width?: number;
  height?: number;
  onDrawingChange?: (dataUrl: string) => void;
  initialData?: string;
  disabled?: boolean;
  showClearButton?: boolean;
}

export default function DrawingCanvas({ 
  width = 400, 
  height = 300, 
  onDrawingChange,
  initialData,
  disabled = false,
  showClearButton = true
}: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions directly
    canvas.width = width;
    canvas.height = height;

    // Set up canvas for ultra-smooth drawing
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#2a2a2a';
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Load initial data if provided
    if (initialData) {
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, width, height);
      };
      img.src = initialData;
    } else {
      // Clear canvas with transparent background
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, [initialData, width, height]);

  const getEventPos = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    
    if ('touches' in e) {
      // Touch event
      const touch = e.touches[0] || e.changedTouches[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top
      };
    } else {
      // Mouse event
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (disabled) return;
    
    e.preventDefault();
    const pos = getEventPos(e);
    setIsDrawing(true);
    setLastPos(pos);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || disabled) return;

    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pos = getEventPos(e);

    // Use quadratic curves for smoother lines
    ctx.beginPath();
    ctx.moveTo(lastPos.x, lastPos.y);
    
    // Calculate midpoint for smooth curve
    const midX = (lastPos.x + pos.x) / 2;
    const midY = (lastPos.y + pos.y) / 2;
    
    ctx.quadraticCurveTo(lastPos.x, lastPos.y, midX, midY);
    ctx.stroke();

    setLastPos(pos);

    // Notify parent of changes
    if (onDrawingChange) {
      const dataUrl = canvas.toDataURL('image/png', 1.0);
      onDrawingChange(dataUrl);
    }
  };

  const stopDrawing = (e?: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (e) e.preventDefault();
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    if (disabled) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (onDrawingChange) {
      onDrawingChange('');
    }
  };

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        style={{ 
          width: `${width}px`, 
          height: `${height}px`,
          touchAction: 'none',
          borderRadius: '8px',
          background: 'transparent'
        }}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
        onTouchCancel={stopDrawing}
        className={`block ${disabled ? 'cursor-not-allowed' : 'cursor-crosshair'} select-none`}
      />
      {!disabled && showClearButton && (
        <button
          onClick={clearCanvas}
          className="btn-link text-xs mt-2"
          style={{opacity: 0.6}}
        >
          clear
        </button>
      )}
    </div>
  );
}