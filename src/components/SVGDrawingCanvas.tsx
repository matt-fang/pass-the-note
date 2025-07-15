'use client';

import { useRef, useEffect, useState, useImperativeHandle, forwardRef } from 'react';

interface SVGDrawingCanvasProps {
  width?: number;
  height?: number;
  onDrawingChange?: (svgData: string) => void;
  initialData?: string;
  disabled?: boolean;
  showClearButton?: boolean;
  strokeColor?: string;
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
  showClearButton = true,
  strokeColor = '#2a2a2a'
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
    
    // Calculate bounding box of all paths
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    paths.forEach(path => {
      path.points.forEach(point => {
        minX = Math.min(minX, point.x);
        minY = Math.min(minY, point.y);
        maxX = Math.max(maxX, point.x);
        maxY = Math.max(maxY, point.y);
      });
    });
    
    // Add padding around the content (stroke width / 2 + small buffer)
    const padding = 10;
    minX -= padding;
    minY -= padding;
    maxX += padding;
    maxY += padding;
    
    // Ensure minimum size
    const boundingWidth = Math.max(maxX - minX, 20);
    const boundingHeight = Math.max(maxY - minY, 20);
    
    const pathStrings = paths.map(path => {
      const d = createPathString(path.points);
      if (!d) return '';
      
      return `<path d="${d}" stroke="${strokeColor}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" fill="none" opacity="0.95"/>`;
    }).filter(Boolean);

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${boundingWidth}" height="${boundingHeight}" viewBox="${minX} ${minY} ${boundingWidth} ${boundingHeight}">${pathStrings.join('')}</svg>`;
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
    if (points.length === 0) return '';
    if (points.length === 1) {
      // Single point - create a small circle
      const p = points[0];
      return `M ${p.x} ${p.y} m -2,0 a 2,2 0 1,0 4,0 a 2,2 0 1,0 -4,0`;
    }
    
    let d = `M ${points[0].x} ${points[0].y}`;
    
    // Simple line connections for now - no complex curves that might break
    for (let i = 1; i < points.length; i++) {
      d += ` L ${points[i].x} ${points[i].y}`;
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
            stroke={strokeColor}
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        ))}
        
        {/* Render current path being drawn */}
        {isDrawing && currentPath.length > 1 && (
          <path
            d={createPathString(currentPath)}
            stroke={strokeColor}
            strokeWidth="6"
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