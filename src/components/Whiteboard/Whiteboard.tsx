/** @format */

import { useRef, useState } from "react";
import { Stage, Layer, Line } from "react-konva";
import "./Whiteboard.css";
import { KonvaEventObject } from "konva/lib/Node";

type Tool = "pen" | "eraser" | "rectangle" | "circle";

interface LineProps {
  tool: Tool;
  points: number[];
}

const Whiteboard: React.FC = () => {
  const [tool, setTool] = useState<Tool>("pen");

  const isDrawing = useRef(false);
  const [lines, setLines] = useState<LineProps[]>([]);
  const [currentLine, setCurrentLine] = useState<LineProps | null>(null);

  // Stage dimensions
  const stageWidth = window.innerWidth - 300;
  const stageHeight = window.innerHeight - 300;

  const isActive = (toolName: Tool): string => {
    return tool === toolName ? "active" : "";
  };

  const handleMouseDown = (e: KonvaEventObject<MouseEvent>) => {
    if (tool !== "pen" && tool !== "eraser") return;

    isDrawing.current = true;
    const pos = e.target.getStage()?.getPointerPosition();

    if (!pos) return;

    setCurrentLine({
      tool,
      points: [pos.x, pos.y],
    });
  };

  const handleMouseMove = (e: KonvaEventObject<MouseEvent>) => {
    if (!isDrawing.current || !currentLine) return;

    const pos = e.target.getStage()?.getPointerPosition();

    if (!pos) return;

    setCurrentLine({
      ...currentLine,
      points: [...currentLine.points, pos.x, pos.y],
    });
  };

  const handleMouseUp = () => {
    isDrawing.current = false;

    if (currentLine) {
      setLines([...lines, currentLine]);
      setCurrentLine(null);
    }
  };

  return (
    <div className="whiteboard-container">
      <div className="toolbar">
        <button className={isActive("pen")} onClick={() => setTool("pen")}>
          Pen
        </button>
        <button
          className={isActive("eraser")}
          onClick={() => setTool("eraser")}
        >
          Eraser
        </button>
        <button
          className={isActive("rectangle")}
          onClick={() => setTool("rectangle")}
        >
          Rectangle
        </button>
        <button
          className={isActive("circle")}
          onClick={() => setTool("circle")}
        >
          Circle
        </button>
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
          {lines.map((line, i) => (
            <Line
              key={i}
              points={line.points}
              stroke="black"
              strokeWidth={5}
              tension={0.5}
              lineCap="round"
              lineJoin="round"
            />
          ))}
          {currentLine && (
            <Line
              points={currentLine.points}
              stroke="black"
              strokeWidth={5}
              tension={0.5}
              lineCap="round"
              lineJoin="round"
            />
          )}
        </Layer>
      </Stage>
    </div>
  );
};

export default Whiteboard;
