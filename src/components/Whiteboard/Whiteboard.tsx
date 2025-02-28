/** @format */

import { useRef, useState } from "react";
import { Stage, Layer, Line, Circle, Rect, Group } from "react-konva";
import "./Whiteboard.css";
import { KonvaEventObject } from "konva/lib/Node";

type Tool = "pen" | "eraser" | "rectangle" | "circle";

interface LineProps {
  tool: Tool;
  points: number[];
}

interface ShapeProps {
  type: "rectangle" | "circle";
  x: number;
  y: number;
  width: number;
  height: number;
}

const isActive = (tool: Tool, selectedTool: Tool): string => {
  return tool === selectedTool ? "active" : "";
};

const Whiteboard: React.FC = () => {
  const [tool, setTool] = useState<Tool>("pen");

  // Drawing state
  const isDrawing = useRef(false);
  const [lines, setLines] = useState<LineProps[]>([]);
  const [currentLine, setCurrentLine] = useState<LineProps | null>(null);

  // Shape state
  const [shapes, setShapes] = useState<ShapeProps[]>([]);
  const [currentShape, setCurrentShape] = useState<ShapeProps | null>(null);
  const [shapeStart, setShapeStart] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });

  // Stage dimensions
  const stageWidth = window.innerWidth - 300;
  const stageHeight = window.innerHeight - 300;

  const handleMouseDown = (e: KonvaEventObject<MouseEvent>) => {
    isDrawing.current = true;
    const pos = e.target.getStage()?.getPointerPosition();

    if (!pos) return;

    if (tool === "pen" || tool === "eraser") {
      // Start a new line
      setCurrentLine({
        tool,
        points: [pos.x, pos.y],
      });
    } else if (tool === "rectangle" || tool === "circle") {
      // Start a new shape
      setShapeStart({ x: pos.x, y: pos.y });
      setCurrentShape({
        type: tool === "rectangle" ? "rectangle" : "circle",
        x: pos.x,
        y: pos.y,
        width: 0,
        height: 0,
      });
    }
  };

  const handleMouseMove = (e: KonvaEventObject<MouseEvent>) => {
    if (!isDrawing.current) return;

    const pos = e.target.getStage()?.getPointerPosition();
    if (!pos) return;

    if (tool === "pen" || tool === "eraser") {
      // Continue drawing the line
      if (currentLine) {
        setCurrentLine({
          ...currentLine,
          points: [...currentLine.points, pos.x, pos.y],
        });
      }
    } else if (tool === "rectangle" || tool === "circle") {
      // Update shape dimensions
      if (currentShape) {
        setCurrentShape({
          ...currentShape,
          width: pos.x - shapeStart.x,
          height: pos.y - shapeStart.y,
        });
      }
    }
  };

  const handleMouseUp = () => {
    isDrawing.current = false;

    if (currentLine) {
      setLines([...lines, currentLine]);
      setCurrentLine(null);
    }

    if (currentShape) {
      setShapes([...shapes, currentShape]);
      setCurrentShape(null);
    }
  };

  const handleClear = () => {
    setLines([]);
    setShapes([]);
  };

  return (
    <div className="whiteboard-container">
      <div className="toolbar">
        <button
          className={isActive(tool, "pen")}
          onClick={() => setTool("pen")}
        >
          Pen
        </button>
        <button
          className={isActive(tool, "eraser")}
          onClick={() => setTool("eraser")}
        >
          Eraser
        </button>
        <button
          className={isActive(tool, "rectangle")}
          onClick={() => setTool("rectangle")}
        >
          Rectangle
        </button>
        <button
          className={isActive(tool, "circle")}
          onClick={() => setTool("circle")}
        >
          Circle
        </button>
        <button onClick={handleClear}>Clear All</button>
      </div>

      <Stage
        width={stageWidth}
        height={stageHeight}
        className="whiteboard-stage"
        onMouseDown={handleMouseDown}
        onMousemove={handleMouseMove}
        onMouseup={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <Layer>
          {/* Draw all shapes first */}
          <Group>
            {shapes.map((shape, i) => {
              if (shape.type === "rectangle") {
                return (
                  <Rect
                    key={`shape-${i}`}
                    x={shape.x}
                    y={shape.y}
                    width={shape.width}
                    height={shape.height}
                    stroke="black"
                    strokeWidth={2}
                    fillEnabled={false}
                  />
                );
              } else {
                return (
                  <Circle
                    key={`shape-${i}`}
                    x={shape.x + shape.width / 2}
                    y={shape.y + shape.height / 2}
                    radius={
                      Math.max(Math.abs(shape.width), Math.abs(shape.height)) /
                      2
                    }
                    stroke="black"
                    strokeWidth={2}
                    fillEnabled={false}
                  />
                );
              }
            })}

            {currentShape &&
              (currentShape.type === "rectangle" ? (
                <Rect
                  x={currentShape.x}
                  y={currentShape.y}
                  width={currentShape.width}
                  height={currentShape.height}
                  stroke="black"
                  strokeWidth={2}
                  fillEnabled={false}
                />
              ) : (
                <Circle
                  x={currentShape.x + currentShape.width / 2}
                  y={currentShape.y + currentShape.height / 2}
                  radius={
                    Math.max(
                      Math.abs(currentShape.width),
                      Math.abs(currentShape.height),
                    ) / 2
                  }
                  stroke="black"
                  strokeWidth={2}
                  fillEnabled={false}
                />
              ))}
          </Group>

          {/* Draw all non-eraser lines */}
          {lines
            .filter((line) => line.tool !== "eraser")
            .map((line, i) => (
              <Line
                key={`line-${i}`}
                points={line.points}
                stroke="black"
                strokeWidth={5}
                tension={0.5}
                lineCap="round"
                lineJoin="round"
              />
            ))}

          {/* Then draw eraser lines to affect both shapes and pen lines */}
          {lines
            .filter((line) => line.tool === "eraser")
            .map((line, i) => (
              <Line
                key={`eraser-${i}`}
                points={line.points}
                stroke="white"
                strokeWidth={20}
                tension={0.5}
                lineCap="round"
                lineJoin="round"
                globalCompositeOperation="destination-out"
              />
            ))}

          {/* Draw current line being drawn */}
          {currentLine && (
            <Line
              points={currentLine.points}
              stroke={currentLine.tool === "eraser" ? "white" : "black"}
              strokeWidth={currentLine.tool === "eraser" ? 20 : 5}
              tension={0.5}
              lineCap="round"
              lineJoin="round"
              globalCompositeOperation={
                currentLine.tool === "eraser"
                  ? "destination-out"
                  : "source-over"
              }
            />
          )}
        </Layer>
      </Stage>
    </div>
  );
};

export default Whiteboard;
