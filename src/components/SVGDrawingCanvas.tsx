'use client';

import { useRef, useEffect, useState, useImperativeHandle, forwardRef, useCallback } from 'react';

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
            // Better path parsing that handles M and L commands properly
            const points: Point[] = [];
            
            // Handle both line paths and circle paths (single points)
            if (d.includes('a 2,2')) {
              // This is a circle from a single point - extract the center
              const circleMatch = d.match(/M\s*([\d.-]+)\s+([\d.-]+)/);
              if (circleMatch) {
                const x = parseFloat(circleMatch[1]);
                const y = parseFloat(circleMatch[2]);
                if (!isNaN(x) && !isNaN(y)) {
                  points.push({ x, y });
                }
              }
            } else {
              // This is a regular line path - match M or L commands followed by coordinate pairs
              const commandMatches = d.match(/[ML]\s*[^ML]+/g);
              
              if (commandMatches) {
                commandMatches.forEach(command => {
                  const coords = command.replace(/[ML]\s*/, '').trim().split(/[\s,]+/).filter(Boolean);
                  
                  // Parse coordinate pairs
                  for (let i = 0; i < coords.length; i += 2) {
                    if (coords[i] && coords[i + 1]) {
                      const x = parseFloat(coords[i]);
                      const y = parseFloat(coords[i + 1]);
                      
                      // Only add valid coordinates
                      if (!isNaN(x) && !isNaN(y)) {
                        points.push({ x, y });
                      }
                    }
                  }
                });
              }
            }
            
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

  const generateSVGString = useCallback((): string => {
    if (paths.length === 0) return '';
    
    // Calculate exact bounding box considering actual path geometry
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    paths.forEach(path => {
      if (path.points.length === 1) {
        // Single point becomes a circle with radius 2
        const p = path.points[0];
        minX = Math.min(minX, p.x - 2);
        minY = Math.min(minY, p.y - 2);
        maxX = Math.max(maxX, p.x + 2);
        maxY = Math.max(maxY, p.y + 2);
      } else {
        // Multiple points - use actual point coordinates
        path.points.forEach(point => {
          minX = Math.min(minX, point.x);
          minY = Math.min(minY, point.y);
          maxX = Math.max(maxX, point.x);
          maxY = Math.max(maxY, point.y);
        });
      }
    });
    
    // Handle edge case where we have no valid bounds
    if (minX === Infinity) {
      return '';
    }
    
    // Account for stroke width: stroke-width="6" means 3px on each side
    // Round line caps can extend slightly beyond, so use 3px padding
    const strokeRadius = 3;
    minX -= strokeRadius;
    minY -= strokeRadius;
    maxX += strokeRadius;
    maxY += strokeRadius;
    
    // Calculate exact dimensions
    const boundingWidth = maxX - minX;
    const boundingHeight = maxY - minY;
    
    const pathStrings = paths.map(path => {
      const d = createPathString(path.points);
      if (!d) return '';
      
      return `<path d="${d}" stroke="${strokeColor}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" fill="none" opacity="0.95"/>`;
    }).filter(Boolean);

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${boundingWidth}" height="${boundingHeight}" viewBox="${minX} ${minY} ${boundingWidth} ${boundingHeight}">${pathStrings.join('')}</svg>`;
  }, [paths, strokeColor]);

  useEffect(() => {
    // Generate SVG string and notify parent
    if (onDrawingChange) {
      const svgString = generateSVGString();
      onDrawingChange(svgString);
    }
  }, [paths, onDrawingChange, generateSVGString]);

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