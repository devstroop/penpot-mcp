/**
 * SVG Parser Utility for Penpot MCP
 * Converts SVG path data to Penpot path format
 *
 * ISSUE-007: SVG Import Support
 */

export interface PenpotPathCommand {
  command: 'move-to' | 'line-to' | 'curve-to' | 'close-path';
  params: {
    x?: number;
    y?: number;
    c1x?: number; // Control point 1 x (for curves)
    c1y?: number; // Control point 1 y
    c2x?: number; // Control point 2 x (for cubic curves)
    c2y?: number; // Control point 2 y
  };
}

export interface ParsedSVGPath {
  commands: PenpotPathCommand[];
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface ParsedSVGShape {
  type: 'path' | 'rect' | 'ellipse' | 'circle' | 'line' | 'polygon' | 'polyline';
  id?: string;
  pathData: PenpotPathCommand[];
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  fill?: string;
  fillOpacity?: number;
  stroke?: string;
  strokeWidth?: number;
  strokeOpacity?: number;
  transform?: string;
}

export interface ParsedSVG {
  width?: number;
  height?: number;
  viewBox?: { x: number; y: number; width: number; height: number };
  shapes: ParsedSVGShape[];
}

/**
 * Parse SVG path `d` attribute into Penpot path commands
 */
export function parseSVGPathData(d: string): ParsedSVGPath {
  const commands: PenpotPathCommand[] = [];
  let currentX = 0;
  let currentY = 0;
  let startX = 0;
  let startY = 0;
  let lastControlX = 0;
  let lastControlY = 0;

  const minX: number[] = [];
  const minY: number[] = [];
  const maxX: number[] = [];
  const maxY: number[] = [];

  const trackPoint = (x: number, y: number) => {
    minX.push(x);
    minY.push(y);
    maxX.push(x);
    maxY.push(y);
  };

  // Tokenize the path data
  const tokens = d.match(/[MmLlHhVvCcSsQqTtAaZz]|[-+]?(?:\d*\.\d+|\d+)(?:[eE][-+]?\d+)?/g) || [];

  let i = 0;
  let currentCommand = '';

  const getNumber = (): number => {
    const num = parseFloat(tokens[i++]);
    return isNaN(num) ? 0 : num;
  };

  while (i < tokens.length) {
    const token = tokens[i];

    // Check if it's a command letter
    if (/[MmLlHhVvCcSsQqTtAaZz]/.test(token)) {
      currentCommand = token;
      i++;
    }

    switch (currentCommand) {
      case 'M': // Move to (absolute)
        currentX = getNumber();
        currentY = getNumber();
        startX = currentX;
        startY = currentY;
        trackPoint(currentX, currentY);
        commands.push({
          command: 'move-to',
          params: { x: currentX, y: currentY },
        });
        // Subsequent coordinates are treated as line-to
        currentCommand = 'L';
        break;

      case 'm': // Move to (relative)
        currentX += getNumber();
        currentY += getNumber();
        startX = currentX;
        startY = currentY;
        trackPoint(currentX, currentY);
        commands.push({
          command: 'move-to',
          params: { x: currentX, y: currentY },
        });
        currentCommand = 'l';
        break;

      case 'L': // Line to (absolute)
        currentX = getNumber();
        currentY = getNumber();
        trackPoint(currentX, currentY);
        commands.push({
          command: 'line-to',
          params: { x: currentX, y: currentY },
        });
        break;

      case 'l': // Line to (relative)
        currentX += getNumber();
        currentY += getNumber();
        trackPoint(currentX, currentY);
        commands.push({
          command: 'line-to',
          params: { x: currentX, y: currentY },
        });
        break;

      case 'H': // Horizontal line (absolute)
        currentX = getNumber();
        trackPoint(currentX, currentY);
        commands.push({
          command: 'line-to',
          params: { x: currentX, y: currentY },
        });
        break;

      case 'h': // Horizontal line (relative)
        currentX += getNumber();
        trackPoint(currentX, currentY);
        commands.push({
          command: 'line-to',
          params: { x: currentX, y: currentY },
        });
        break;

      case 'V': // Vertical line (absolute)
        currentY = getNumber();
        trackPoint(currentX, currentY);
        commands.push({
          command: 'line-to',
          params: { x: currentX, y: currentY },
        });
        break;

      case 'v': // Vertical line (relative)
        currentY += getNumber();
        trackPoint(currentX, currentY);
        commands.push({
          command: 'line-to',
          params: { x: currentX, y: currentY },
        });
        break;

      case 'C': // Cubic bezier (absolute)
        {
          const c1x = getNumber();
          const c1y = getNumber();
          const c2x = getNumber();
          const c2y = getNumber();
          currentX = getNumber();
          currentY = getNumber();
          lastControlX = c2x;
          lastControlY = c2y;
          trackPoint(currentX, currentY);
          trackPoint(c1x, c1y);
          trackPoint(c2x, c2y);
          commands.push({
            command: 'curve-to',
            params: { x: currentX, y: currentY, c1x, c1y, c2x, c2y },
          });
        }
        break;

      case 'c': // Cubic bezier (relative)
        {
          const c1x = currentX + getNumber();
          const c1y = currentY + getNumber();
          const c2x = currentX + getNumber();
          const c2y = currentY + getNumber();
          currentX += getNumber();
          currentY += getNumber();
          lastControlX = c2x;
          lastControlY = c2y;
          trackPoint(currentX, currentY);
          trackPoint(c1x, c1y);
          trackPoint(c2x, c2y);
          commands.push({
            command: 'curve-to',
            params: { x: currentX, y: currentY, c1x, c1y, c2x, c2y },
          });
        }
        break;

      case 'S': // Smooth cubic bezier (absolute)
        {
          // First control point is reflection of last control point
          const c1x = 2 * currentX - lastControlX;
          const c1y = 2 * currentY - lastControlY;
          const c2x = getNumber();
          const c2y = getNumber();
          currentX = getNumber();
          currentY = getNumber();
          lastControlX = c2x;
          lastControlY = c2y;
          trackPoint(currentX, currentY);
          trackPoint(c1x, c1y);
          trackPoint(c2x, c2y);
          commands.push({
            command: 'curve-to',
            params: { x: currentX, y: currentY, c1x, c1y, c2x, c2y },
          });
        }
        break;

      case 's': // Smooth cubic bezier (relative)
        {
          const c1x = 2 * currentX - lastControlX;
          const c1y = 2 * currentY - lastControlY;
          const c2x = currentX + getNumber();
          const c2y = currentY + getNumber();
          currentX += getNumber();
          currentY += getNumber();
          lastControlX = c2x;
          lastControlY = c2y;
          trackPoint(currentX, currentY);
          trackPoint(c1x, c1y);
          trackPoint(c2x, c2y);
          commands.push({
            command: 'curve-to',
            params: { x: currentX, y: currentY, c1x, c1y, c2x, c2y },
          });
        }
        break;

      case 'Q': // Quadratic bezier (absolute) - convert to cubic
        {
          const qx = getNumber();
          const qy = getNumber();
          const endX = getNumber();
          const endY = getNumber();
          // Convert quadratic to cubic
          const c1x = currentX + (2 / 3) * (qx - currentX);
          const c1y = currentY + (2 / 3) * (qy - currentY);
          const c2x = endX + (2 / 3) * (qx - endX);
          const c2y = endY + (2 / 3) * (qy - endY);
          currentX = endX;
          currentY = endY;
          lastControlX = qx;
          lastControlY = qy;
          trackPoint(currentX, currentY);
          trackPoint(c1x, c1y);
          trackPoint(c2x, c2y);
          commands.push({
            command: 'curve-to',
            params: { x: currentX, y: currentY, c1x, c1y, c2x, c2y },
          });
        }
        break;

      case 'q': // Quadratic bezier (relative) - convert to cubic
        {
          const qx = currentX + getNumber();
          const qy = currentY + getNumber();
          const endX = currentX + getNumber();
          const endY = currentY + getNumber();
          const c1x = currentX + (2 / 3) * (qx - currentX);
          const c1y = currentY + (2 / 3) * (qy - currentY);
          const c2x = endX + (2 / 3) * (qx - endX);
          const c2y = endY + (2 / 3) * (qy - endY);
          currentX = endX;
          currentY = endY;
          lastControlX = qx;
          lastControlY = qy;
          trackPoint(currentX, currentY);
          trackPoint(c1x, c1y);
          trackPoint(c2x, c2y);
          commands.push({
            command: 'curve-to',
            params: { x: currentX, y: currentY, c1x, c1y, c2x, c2y },
          });
        }
        break;

      case 'T': // Smooth quadratic (absolute)
        {
          const qx = 2 * currentX - lastControlX;
          const qy = 2 * currentY - lastControlY;
          const endX = getNumber();
          const endY = getNumber();
          const c1x = currentX + (2 / 3) * (qx - currentX);
          const c1y = currentY + (2 / 3) * (qy - currentY);
          const c2x = endX + (2 / 3) * (qx - endX);
          const c2y = endY + (2 / 3) * (qy - endY);
          currentX = endX;
          currentY = endY;
          lastControlX = qx;
          lastControlY = qy;
          trackPoint(currentX, currentY);
          commands.push({
            command: 'curve-to',
            params: { x: currentX, y: currentY, c1x, c1y, c2x, c2y },
          });
        }
        break;

      case 't': // Smooth quadratic (relative)
        {
          const qx = 2 * currentX - lastControlX;
          const qy = 2 * currentY - lastControlY;
          const endX = currentX + getNumber();
          const endY = currentY + getNumber();
          const c1x = currentX + (2 / 3) * (qx - currentX);
          const c1y = currentY + (2 / 3) * (qy - currentY);
          const c2x = endX + (2 / 3) * (qx - endX);
          const c2y = endY + (2 / 3) * (qy - endY);
          currentX = endX;
          currentY = endY;
          lastControlX = qx;
          lastControlY = qy;
          trackPoint(currentX, currentY);
          commands.push({
            command: 'curve-to',
            params: { x: currentX, y: currentY, c1x, c1y, c2x, c2y },
          });
        }
        break;

      case 'A': // Arc (absolute) - approximate with curves
      case 'a': // Arc (relative)
        {
          const isRelative = currentCommand === 'a';
          // Read and discard arc parameters (rx, ry, x-rotation, large-arc, sweep)
          getNumber(); // rx
          getNumber(); // ry
          getNumber(); // x-rotation
          getNumber(); // large-arc flag
          getNumber(); // sweep flag
          let endX = getNumber();
          let endY = getNumber();

          if (isRelative) {
            endX += currentX;
            endY += currentY;
          }

          // Approximate arc with line for simplicity
          // TODO: Implement proper arc to bezier conversion
          currentX = endX;
          currentY = endY;
          trackPoint(currentX, currentY);
          commands.push({
            command: 'line-to',
            params: { x: currentX, y: currentY },
          });
        }
        break;

      case 'Z':
      case 'z': // Close path
        currentX = startX;
        currentY = startY;
        commands.push({
          command: 'close-path',
          params: {},
        });
        break;

      default:
        i++; // Skip unknown tokens
    }
  }

  // Calculate bounds
  const x = minX.length > 0 ? Math.min(...minX) : 0;
  const y = minY.length > 0 ? Math.min(...minY) : 0;
  const x2 = maxX.length > 0 ? Math.max(...maxX) : 0;
  const y2 = maxY.length > 0 ? Math.max(...maxY) : 0;

  return {
    commands,
    bounds: {
      x,
      y,
      width: Math.max(x2 - x, 1),
      height: Math.max(y2 - y, 1),
    },
  };
}

/**
 * Parse color from SVG format to hex
 */
export function parseSVGColor(color: string | undefined): string | undefined {
  if (!color || color === 'none' || color === 'transparent') {
    return undefined;
  }

  // Already hex
  if (/^#[0-9A-Fa-f]{3,8}$/.test(color)) {
    // Convert 3-digit hex to 6-digit
    if (color.length === 4) {
      return `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`;
    }
    return color.substring(0, 7); // Strip alpha if present
  }

  // RGB format
  const rgbMatch = color.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/i);
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1]).toString(16).padStart(2, '0');
    const g = parseInt(rgbMatch[2]).toString(16).padStart(2, '0');
    const b = parseInt(rgbMatch[3]).toString(16).padStart(2, '0');
    return `#${r}${g}${b}`;
  }

  // Named colors (common ones)
  const namedColors: Record<string, string> = {
    black: '#000000',
    white: '#FFFFFF',
    red: '#FF0000',
    green: '#008000',
    blue: '#0000FF',
    yellow: '#FFFF00',
    orange: '#FFA500',
    purple: '#800080',
    pink: '#FFC0CB',
    gray: '#808080',
    grey: '#808080',
    cyan: '#00FFFF',
    magenta: '#FF00FF',
    lime: '#00FF00',
    navy: '#000080',
    teal: '#008080',
    maroon: '#800000',
    olive: '#808000',
    silver: '#C0C0C0',
    aqua: '#00FFFF',
    fuchsia: '#FF00FF',
    currentColor: '#000000',
  };

  return namedColors[color.toLowerCase()] || undefined;
}

/**
 * Convert SVG rect to path commands
 */
export function rectToPath(
  x: number,
  y: number,
  width: number,
  height: number,
  rx = 0,
  ry = 0
): PenpotPathCommand[] {
  // If no rounded corners
  if (rx === 0 && ry === 0) {
    return [
      { command: 'move-to', params: { x, y } },
      { command: 'line-to', params: { x: x + width, y } },
      { command: 'line-to', params: { x: x + width, y: y + height } },
      { command: 'line-to', params: { x, y: y + height } },
      { command: 'close-path', params: {} },
    ];
  }

  // With rounded corners - approximate with lines for now
  // TODO: Add proper rounded corner bezier curves
  return [
    { command: 'move-to', params: { x: x + rx, y } },
    { command: 'line-to', params: { x: x + width - rx, y } },
    { command: 'line-to', params: { x: x + width, y: y + ry } },
    { command: 'line-to', params: { x: x + width, y: y + height - ry } },
    { command: 'line-to', params: { x: x + width - rx, y: y + height } },
    { command: 'line-to', params: { x: x + rx, y: y + height } },
    { command: 'line-to', params: { x, y: y + height - ry } },
    { command: 'line-to', params: { x, y: y + ry } },
    { command: 'close-path', params: {} },
  ];
}

/**
 * Convert SVG circle to path commands (approximated with bezier curves)
 */
export function circleToPath(cx: number, cy: number, r: number): PenpotPathCommand[] {
  const k = 0.5522847498; // Bezier approximation constant for circles
  return [
    { command: 'move-to', params: { x: cx, y: cy - r } },
    {
      command: 'curve-to',
      params: {
        x: cx + r,
        y: cy,
        c1x: cx + r * k,
        c1y: cy - r,
        c2x: cx + r,
        c2y: cy - r * k,
      },
    },
    {
      command: 'curve-to',
      params: {
        x: cx,
        y: cy + r,
        c1x: cx + r,
        c1y: cy + r * k,
        c2x: cx + r * k,
        c2y: cy + r,
      },
    },
    {
      command: 'curve-to',
      params: {
        x: cx - r,
        y: cy,
        c1x: cx - r * k,
        c1y: cy + r,
        c2x: cx - r,
        c2y: cy + r * k,
      },
    },
    {
      command: 'curve-to',
      params: {
        x: cx,
        y: cy - r,
        c1x: cx - r,
        c1y: cy - r * k,
        c2x: cx - r * k,
        c2y: cy - r,
      },
    },
    { command: 'close-path', params: {} },
  ];
}

/**
 * Convert SVG ellipse to path commands
 */
export function ellipseToPath(cx: number, cy: number, rx: number, ry: number): PenpotPathCommand[] {
  const k = 0.5522847498;
  return [
    { command: 'move-to', params: { x: cx, y: cy - ry } },
    {
      command: 'curve-to',
      params: {
        x: cx + rx,
        y: cy,
        c1x: cx + rx * k,
        c1y: cy - ry,
        c2x: cx + rx,
        c2y: cy - ry * k,
      },
    },
    {
      command: 'curve-to',
      params: {
        x: cx,
        y: cy + ry,
        c1x: cx + rx,
        c1y: cy + ry * k,
        c2x: cx + rx * k,
        c2y: cy + ry,
      },
    },
    {
      command: 'curve-to',
      params: {
        x: cx - rx,
        y: cy,
        c1x: cx - rx * k,
        c1y: cy + ry,
        c2x: cx - rx,
        c2y: cy + ry * k,
      },
    },
    {
      command: 'curve-to',
      params: {
        x: cx,
        y: cy - ry,
        c1x: cx - rx,
        c1y: cy - ry * k,
        c2x: cx - rx * k,
        c2y: cy - ry,
      },
    },
    { command: 'close-path', params: {} },
  ];
}

/**
 * Convert polygon/polyline points to path commands
 */
export function polygonToPath(points: string, close: boolean = true): PenpotPathCommand[] {
  const coords = points
    .trim()
    .split(/[\s,]+/)
    .map(parseFloat);
  const commands: PenpotPathCommand[] = [];

  for (let i = 0; i < coords.length - 1; i += 2) {
    const x = coords[i];
    const y = coords[i + 1];
    if (i === 0) {
      commands.push({ command: 'move-to', params: { x, y } });
    } else {
      commands.push({ command: 'line-to', params: { x, y } });
    }
  }

  if (close && commands.length > 0) {
    commands.push({ command: 'close-path', params: {} });
  }

  return commands;
}

/**
 * Convert line to path commands
 */
export function lineToPath(x1: number, y1: number, x2: number, y2: number): PenpotPathCommand[] {
  return [
    { command: 'move-to', params: { x: x1, y: y1 } },
    { command: 'line-to', params: { x: x2, y: y2 } },
  ];
}

/**
 * Simple SVG parser (regex-based, handles common cases)
 */
export function parseSVG(svgString: string): ParsedSVG {
  const shapes: ParsedSVGShape[] = [];

  // Extract SVG dimensions
  const widthMatch = svgString.match(/width\s*=\s*["']?([\d.]+)/);
  const heightMatch = svgString.match(/height\s*=\s*["']?([\d.]+)/);
  const viewBoxMatch = svgString.match(/viewBox\s*=\s*["']?([\d.\s-]+)["']?/);

  let width = widthMatch ? parseFloat(widthMatch[1]) : undefined;
  let height = heightMatch ? parseFloat(heightMatch[1]) : undefined;
  let viewBox: { x: number; y: number; width: number; height: number } | undefined;

  if (viewBoxMatch) {
    const vb = viewBoxMatch[1].trim().split(/\s+/).map(parseFloat);
    if (vb.length === 4) {
      viewBox = { x: vb[0], y: vb[1], width: vb[2], height: vb[3] };
      width = width || vb[2];
      height = height || vb[3];
    }
  }

  // Helper to extract attributes
  const getAttr = (element: string, attr: string): string | undefined => {
    const match = element.match(new RegExp(`${attr}\\s*=\\s*["']([^"']+)["']`));
    return match ? match[1] : undefined;
  };

  const getNumAttr = (element: string, attr: string, def = 0): number => {
    const val = getAttr(element, attr);
    return val ? parseFloat(val) : def;
  };

  // Parse path elements
  const pathRegex = /<path[^>]*>/gi;
  let pathMatch;
  while ((pathMatch = pathRegex.exec(svgString)) !== null) {
    const element = pathMatch[0];
    const d = getAttr(element, 'd');
    if (d) {
      const parsed = parseSVGPathData(d);
      shapes.push({
        type: 'path',
        id: getAttr(element, 'id'),
        pathData: parsed.commands,
        bounds: parsed.bounds,
        fill: parseSVGColor(getAttr(element, 'fill')),
        fillOpacity: getNumAttr(element, 'fill-opacity', 1),
        stroke: parseSVGColor(getAttr(element, 'stroke')),
        strokeWidth: getNumAttr(element, 'stroke-width', 0),
        strokeOpacity: getNumAttr(element, 'stroke-opacity', 1),
        transform: getAttr(element, 'transform'),
      });
    }
  }

  // Parse rect elements
  const rectRegex = /<rect[^>]*>/gi;
  let rectMatch;
  while ((rectMatch = rectRegex.exec(svgString)) !== null) {
    const element = rectMatch[0];
    const x = getNumAttr(element, 'x');
    const y = getNumAttr(element, 'y');
    const w = getNumAttr(element, 'width');
    const h = getNumAttr(element, 'height');
    const rx = getNumAttr(element, 'rx');
    const ry = getNumAttr(element, 'ry', rx);

    shapes.push({
      type: 'rect',
      id: getAttr(element, 'id'),
      pathData: rectToPath(x, y, w, h, rx, ry),
      bounds: { x, y, width: w, height: h },
      fill: parseSVGColor(getAttr(element, 'fill')),
      fillOpacity: getNumAttr(element, 'fill-opacity', 1),
      stroke: parseSVGColor(getAttr(element, 'stroke')),
      strokeWidth: getNumAttr(element, 'stroke-width', 0),
      strokeOpacity: getNumAttr(element, 'stroke-opacity', 1),
      transform: getAttr(element, 'transform'),
    });
  }

  // Parse circle elements
  const circleRegex = /<circle[^>]*>/gi;
  let circleMatch;
  while ((circleMatch = circleRegex.exec(svgString)) !== null) {
    const element = circleMatch[0];
    const cx = getNumAttr(element, 'cx');
    const cy = getNumAttr(element, 'cy');
    const r = getNumAttr(element, 'r');

    shapes.push({
      type: 'circle',
      id: getAttr(element, 'id'),
      pathData: circleToPath(cx, cy, r),
      bounds: { x: cx - r, y: cy - r, width: r * 2, height: r * 2 },
      fill: parseSVGColor(getAttr(element, 'fill')),
      fillOpacity: getNumAttr(element, 'fill-opacity', 1),
      stroke: parseSVGColor(getAttr(element, 'stroke')),
      strokeWidth: getNumAttr(element, 'stroke-width', 0),
      strokeOpacity: getNumAttr(element, 'stroke-opacity', 1),
      transform: getAttr(element, 'transform'),
    });
  }

  // Parse ellipse elements
  const ellipseRegex = /<ellipse[^>]*>/gi;
  let ellipseMatch;
  while ((ellipseMatch = ellipseRegex.exec(svgString)) !== null) {
    const element = ellipseMatch[0];
    const cx = getNumAttr(element, 'cx');
    const cy = getNumAttr(element, 'cy');
    const rx = getNumAttr(element, 'rx');
    const ry = getNumAttr(element, 'ry');

    shapes.push({
      type: 'ellipse',
      id: getAttr(element, 'id'),
      pathData: ellipseToPath(cx, cy, rx, ry),
      bounds: { x: cx - rx, y: cy - ry, width: rx * 2, height: ry * 2 },
      fill: parseSVGColor(getAttr(element, 'fill')),
      fillOpacity: getNumAttr(element, 'fill-opacity', 1),
      stroke: parseSVGColor(getAttr(element, 'stroke')),
      strokeWidth: getNumAttr(element, 'stroke-width', 0),
      strokeOpacity: getNumAttr(element, 'stroke-opacity', 1),
      transform: getAttr(element, 'transform'),
    });
  }

  // Parse line elements
  const lineRegex = /<line[^>]*>/gi;
  let lineMatch;
  while ((lineMatch = lineRegex.exec(svgString)) !== null) {
    const element = lineMatch[0];
    const x1 = getNumAttr(element, 'x1');
    const y1 = getNumAttr(element, 'y1');
    const x2 = getNumAttr(element, 'x2');
    const y2 = getNumAttr(element, 'y2');

    shapes.push({
      type: 'line',
      id: getAttr(element, 'id'),
      pathData: lineToPath(x1, y1, x2, y2),
      bounds: {
        x: Math.min(x1, x2),
        y: Math.min(y1, y2),
        width: Math.abs(x2 - x1) || 1,
        height: Math.abs(y2 - y1) || 1,
      },
      fill: undefined,
      stroke: parseSVGColor(getAttr(element, 'stroke')),
      strokeWidth: getNumAttr(element, 'stroke-width', 1),
      strokeOpacity: getNumAttr(element, 'stroke-opacity', 1),
      transform: getAttr(element, 'transform'),
    });
  }

  // Parse polygon elements
  const polygonRegex = /<polygon[^>]*>/gi;
  let polygonMatch;
  while ((polygonMatch = polygonRegex.exec(svgString)) !== null) {
    const element = polygonMatch[0];
    const points = getAttr(element, 'points') || '';
    const pathData = polygonToPath(points, true);

    // Calculate bounds from points
    const coords = points
      .trim()
      .split(/[\s,]+/)
      .map(parseFloat);
    const xs = coords.filter((_, i) => i % 2 === 0);
    const ys = coords.filter((_, i) => i % 2 === 1);
    const minX = Math.min(...xs);
    const minY = Math.min(...ys);
    const maxX = Math.max(...xs);
    const maxY = Math.max(...ys);

    shapes.push({
      type: 'polygon',
      id: getAttr(element, 'id'),
      pathData,
      bounds: { x: minX, y: minY, width: maxX - minX || 1, height: maxY - minY || 1 },
      fill: parseSVGColor(getAttr(element, 'fill')),
      fillOpacity: getNumAttr(element, 'fill-opacity', 1),
      stroke: parseSVGColor(getAttr(element, 'stroke')),
      strokeWidth: getNumAttr(element, 'stroke-width', 0),
      strokeOpacity: getNumAttr(element, 'stroke-opacity', 1),
      transform: getAttr(element, 'transform'),
    });
  }

  // Parse polyline elements
  const polylineRegex = /<polyline[^>]*>/gi;
  let polylineMatch;
  while ((polylineMatch = polylineRegex.exec(svgString)) !== null) {
    const element = polylineMatch[0];
    const points = getAttr(element, 'points') || '';
    const pathData = polygonToPath(points, false);

    const coords = points
      .trim()
      .split(/[\s,]+/)
      .map(parseFloat);
    const xs = coords.filter((_, i) => i % 2 === 0);
    const ys = coords.filter((_, i) => i % 2 === 1);
    const minX = Math.min(...xs);
    const minY = Math.min(...ys);
    const maxX = Math.max(...xs);
    const maxY = Math.max(...ys);

    shapes.push({
      type: 'polyline',
      id: getAttr(element, 'id'),
      pathData,
      bounds: { x: minX, y: minY, width: maxX - minX || 1, height: maxY - minY || 1 },
      fill: parseSVGColor(getAttr(element, 'fill')),
      fillOpacity: getNumAttr(element, 'fill-opacity', 1),
      stroke: parseSVGColor(getAttr(element, 'stroke')),
      strokeWidth: getNumAttr(element, 'stroke-width', 1),
      strokeOpacity: getNumAttr(element, 'stroke-opacity', 1),
      transform: getAttr(element, 'transform'),
    });
  }

  return { width, height, viewBox, shapes };
}

/**
 * Calculate overall bounds for all shapes
 */
export function calculateOverallBounds(shapes: ParsedSVGShape[]): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  if (shapes.length === 0) {
    return { x: 0, y: 0, width: 100, height: 100 };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const shape of shapes) {
    minX = Math.min(minX, shape.bounds.x);
    minY = Math.min(minY, shape.bounds.y);
    maxX = Math.max(maxX, shape.bounds.x + shape.bounds.width);
    maxY = Math.max(maxY, shape.bounds.y + shape.bounds.height);
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}
