'use client';

import { useRef, useEffect, useState, useImperativeHandle, forwardRef } from 'react';

interface SVGDrawingCanvasProps {
  width?: number;
  height?: number;
  onDrawingChange?: (svgData: string) => void;
  initialData?: string;
  disabled?: boolean;
  showClearButton?: boolean;
}

export interface SVGDrawingCanvasRef {
  undo: () => void;
}

interface Point {
  x: number;
  y: number;
}

interface Path {
  points: Point[];
  id: string;
}

const SVGDrawingCanvas = forwardRef<SVGDrawingCanvasRef, SVGDrawingCanvasProps>(({ 
  width = 240, 
  height = 240, 
  onDrawingChange,
  initialData = '',
  disabled = false,
  showClearButton = true
}, ref) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [paths, setPaths] = useState<Path[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<Point[]>([]);

  useEffect(() => {
    if (initialData && initialData.includes('<svg')) {
      // Parse existing SVG data if provided
      try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(initialData, 'image/svg+xml');
        const pathElements = doc.querySelectorAll('path');
        const loadedPaths: Path[] = [];
        
        pathElements.forEach((pathEl, index) => {
          const d = pathEl.getAttribute('d');
          if (d) {
            // Simple parsing - could be enhanced
            const points: Point[] = [];
            const commands = d.split(/[ML]/);
            commands.forEach(cmd => {
              const coords = cmd.trim().split(/[\s,]+/).filter(Boolean);
              for (let i = 0; i < coords.length; i += 2) {
                if (coords[i] && coords[i + 1]) {
                  points.push({
                    x: parseFloat(coords[i]),
                    y: parseFloat(coords[i + 1])
                  });
                }
              }
            });
            if (points.length > 0) {
              loadedPaths.push({
                points,
                id: `loaded-${index}`
              });
            }
          }
        });
        
        setPaths(loadedPaths);
      } catch (error) {
        console.warn('Could not parse SVG data:', error);
      }
    }
  }, [initialData]);

  useEffect(() => {
    // Generate SVG string and notify parent
    if (onDrawingChange) {
      const svgString = generateSVGString();
      onDrawingChange(svgString);
    }
  }, [paths, onDrawingChange]);

  const generateSVGString = (): string => {
    if (paths.length === 0) return '';
    
    const pathStrings = paths.map(path => {
      if (path.points.length < 2) return '';
      
      let d = `M ${path.points[0].x} ${path.points[0].y}`;
      
      // Use smooth curves for better quality
      for (let i = 1; i < path.points.length; i++) {
        const current = path.points[i];
        const previous = path.points[i - 1];
        
        if (i === 1) {
          d += ` L ${current.x} ${current.y}`;
        } else {
          // Create smooth curves using quadratic bezier
          const controlX = (previous.x + current.x) / 2;
          const controlY = (previous.y + current.y) / 2;
          d += ` Q ${previous.x} ${previous.y} ${controlX} ${controlY}`;
        }
      }
      
      return `<path d="${d}" stroke="#2a2a2a" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`;
    }).filter(Boolean);

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${pathStrings.join('')}</svg>`;
  };

  const getEventPos = (e: React.MouseEvent<SVGSVGElement> | React.TouchEvent<SVGSVGElement>): Point => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };

    const rect = svg.getBoundingClientRect();
    
    if ('touches' in e) {
      const touch = e.touches[0] || e.changedTouches[0];
      return {
        x: ((touch.clientX - rect.left) / rect.width) * width,
        y: ((touch.clientY - rect.top) / rect.height) * height
      };
    } else {
      return {
        x: ((e.clientX - rect.left) / rect.width) * width,
        y: ((e.clientY - rect.top) / rect.height) * height
      };
    }
  };

  const startDrawing = (e: React.MouseEvent<SVGSVGElement> | React.TouchEvent<SVGSVGElement>) => {
    if (disabled) return;
    
    e.preventDefault();
    const pos = getEventPos(e);
    setIsDrawing(true);
    setCurrentPath([pos]);
  };

  const draw = (e: React.MouseEvent<SVGSVGElement> | React.TouchEvent<SVGSVGElement>) => {
    if (!isDrawing || disabled) return;

    e.preventDefault();
    const pos = getEventPos(e);
    
    setCurrentPath(prev => {
      const newPath = [...prev];
      
      // Add point if it's far enough from the last point (for smoothness)
      if (newPath.length === 0) {
        newPath.push(pos);
      } else {
        const lastPoint = newPath[newPath.length - 1];
        const distance = Math.sqrt(
          Math.pow(pos.x - lastPoint.x, 2) + Math.pow(pos.y - lastPoint.y, 2)
        );
        
        // Only add point if it's moved enough (reduces jitter)
        if (distance > 2) {
          newPath.push(pos);
        }
      }
      
      return newPath;
    });
  };

  const stopDrawing = (e?: React.MouseEvent<SVGSVGElement> | React.TouchEvent<SVGSVGElement>) => {
    if (e) e.preventDefault();
    
    if (isDrawing && currentPath.length > 0) {
      setPaths(prev => [...prev, {
        points: currentPath,
        id: `path-${Date.now()}-${Math.random()}`
      }]);
    }
    
    setIsDrawing(false);
    setCurrentPath([]);
  };

  const undoLastStroke = () => {
    setPaths(prev => prev.slice(0, -1));
  };

  const clearCanvas = () => {
    if (disabled) return;
    setPaths([]);
    setCurrentPath([]);
  };

  // Expose undo function to parent via ref
  useImperativeHandle(ref, () => ({
    undo: undoLastStroke
  }));

  const createPathString = (points: Point[]): string => {
    if (points.length < 2) return '';
    
    let d = `M ${points[0].x} ${points[0].y}`;
    
    for (let i = 1; i < points.length; i++) {
      const current = points[i];
      const previous = points[i - 1];
      
      if (i === 1) {
        d += ` L ${current.x} ${current.y}`;
      } else {
        // Use quadratic curves for smoothness
        const controlX = (previous.x + current.x) / 2;
        const controlY = (previous.y + current.y) / 2;
        d += ` Q ${previous.x} ${previous.y} ${controlX} ${controlY}`;
      }
    }
    
    return d;
  };

  return (
    <div className="relative">
      <svg
        ref={svgRef}
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{ 
          touchAction: 'none',
          borderRadius: '8px',
          background: 'transparent',
          cursor: disabled ? 'not-allowed' : 'crosshair'
        }}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
        onTouchCancel={stopDrawing}
      >
        {/* Render completed paths */}
        {paths.map(path => (
          <path
            key={path.id}
            d={createPathString(path.points)}
            stroke="#2a2a2a"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        ))}
        
        {/* Render current path being drawn */}
        {isDrawing && currentPath.length > 1 && (
          <path
            d={createPathString(currentPath)}
            stroke="#2a2a2a"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        )}
      </svg>
      
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
});

SVGDrawingCanvas.displayName = 'SVGDrawingCanvas';

export default SVGDrawingCanvas;