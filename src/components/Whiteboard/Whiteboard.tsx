/** @format */

import { Stage, Layer } from "react-konva";
import "./Whiteboard.css";
import { useState } from "react";

type Tool = "pen" | "eraser" | "rectangle" | "circle";

const Whiteboard: React.FC = () => {
  const [tool, setTool] = useState<Tool>("pen");

  // Stage dimensions
  const stageWidth = window.innerWidth - 300;
  const stageHeight = window.innerHeight - 300;

  const isActive = (toolName: Tool): string => {
    return tool === toolName ? "active" : "";
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
      >
        <Layer>{/* We'll add drawable elements here in later steps */}</Layer>
      </Stage>
    </div>
  );
};

export default Whiteboard;
