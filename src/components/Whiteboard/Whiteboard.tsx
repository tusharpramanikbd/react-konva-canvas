/** @format */

import { useCallback, useRef, useState } from "react";
import {
  Stage,
  Layer,
  Line,
  Circle,
  Rect,
  Group,
  Image as KonvaImage,
} from "react-konva";
import "./Whiteboard.css";
import { KonvaEventObject } from "konva/lib/Node";
import Konva from "konva";

type Tool = "pen" | "eraser" | "rectangle" | "circle" | "hand" | "image";

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

interface ImageProps {
  x: number;
  y: number;
  width: number;
  height: number;
  src: string;
  imageElement: HTMLImageElement;
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

  // Zoom state
  const [scale, setScale] = useState<number>(1);
  const [position, setPosition] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });

  // Image state
  const [images, setImages] = useState<ImageProps[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const stageRef = useRef<Konva.Stage>(null);

  // Stage dimensions
  const stageWidth = window.innerWidth - 300;
  const stageHeight = window.innerHeight - 300;

  const handleMouseDown = (e: KonvaEventObject<MouseEvent>) => {
    if (tool === "hand") {
      e.evt.preventDefault();
      e.evt.stopPropagation();
      return;
    }

    isDrawing.current = true;
    const stage = e.target.getStage();
    const pointerPos = stage?.getPointerPosition();

    if (!pointerPos || !stage) return;

    // Convert screen coordinates to canvas coordinates
    const transformedPos = {
      x: (pointerPos.x - position.x) / scale,
      y: (pointerPos.y - position.y) / scale,
    };

    if (tool === "pen" || tool === "eraser") {
      // Start a new line
      setCurrentLine({
        tool,
        points: [transformedPos.x, transformedPos.y],
      });
    } else if (tool === "rectangle" || tool === "circle") {
      // Start a new shape
      setShapeStart(transformedPos);
      setCurrentShape({
        type: tool === "rectangle" ? "rectangle" : "circle",
        x: transformedPos.x,
        y: transformedPos.y,
        width: 0,
        height: 0,
      });
    }
  };

  const handleMouseMove = (e: KonvaEventObject<MouseEvent>) => {
    if (!isDrawing.current) return;

    const stage = e.target.getStage();
    const pointerPos = stage?.getPointerPosition();

    if (!pointerPos || !stage) return;

    // Convert screen coordinates to canvas coordinates
    const transformedPos = {
      x: (pointerPos.x - position.x) / scale,
      y: (pointerPos.y - position.y) / scale,
    };

    if (tool === "pen" || tool === "eraser") {
      // Continue drawing the line
      if (currentLine) {
        setCurrentLine({
          ...currentLine,
          points: [...currentLine.points, transformedPos.x, transformedPos.y],
        });
      }
    } else if (tool === "rectangle" || tool === "circle") {
      // Update shape dimensions
      if (currentShape) {
        setCurrentShape({
          ...currentShape,
          width: transformedPos.x - shapeStart.x,
          height: transformedPos.y - shapeStart.y,
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

  const handleZoomIn = () => {
    setScale((prevScale) => Math.min(prevScale * 1.2, 5)); // Limit max zoom to 5x
  };

  const handleZoomOut = () => {
    setScale((prevScale) => Math.max(prevScale / 1.2, 0.3)); // Limit min zoom to 0.3x
  };

  const handleResetZoom = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleWheel = (e: KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();

    const scaleBy = 1.05;
    const stage = e.target.getStage();
    const oldScale = scale;

    if (!stage) return;

    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const mousePointTo = {
      x: (pointer.x - position.x) / oldScale,
      y: (pointer.y - position.y) / oldScale,
    };

    // Calculate new scale
    const newScale =
      e.evt.deltaY < 0
        ? Math.min(oldScale * scaleBy, 5)
        : Math.max(oldScale / scaleBy, 0.3);

    // Calculate new position
    setPosition({
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    });

    setScale(newScale);
  };

  const loadImage = (file: File) => {
    const URL = window.URL || window.webkitURL;
    const imageUrl = URL.createObjectURL(file);

    const img = new Image();
    img.src = imageUrl;

    img.onload = () => {
      // Calculate dimensions while preserving aspect ratio
      const maxDimension = 300;
      let width = img.width;
      let height = img.height;

      if (width > height && width > maxDimension) {
        height = (height / width) * maxDimension;
        width = maxDimension;
      } else if (height > maxDimension) {
        width = (width / height) * maxDimension;
        height = maxDimension;
      }

      // Position in the center of the viewport
      const stage = stageRef.current;
      let x = 0;
      let y = 0;

      if (stage) {
        const stagePos = stage.position();
        const viewportCenter = {
          x: stageWidth / 2,
          y: stageHeight / 2,
        };

        // Calculate position that centers the image in the visible viewport
        x = (viewportCenter.x - width / 2 - stagePos.x) / scale;
        y = (viewportCenter.y - height / 2 - stagePos.y) / scale;
      } else {
        // Fallback if stage ref is not available
        x = stageWidth / 2 - width / 2;
        y = stageHeight / 2 - height / 2;
      }

      // Add image to state
      const newImage: ImageProps = {
        x,
        y,
        width,
        height,
        src: imageUrl,
        imageElement: img,
      };

      setImages((prevImages) => [...prevImages, newImage]);

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    };
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      loadImage(file);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      const validTypes = ["image/jpeg", "image/png", "image/jpg"];

      if (validTypes.includes(file.type)) {
        loadImage(file);
      }
    }
  }, []);

  return (
    <div
      className="whiteboard-container"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: "none" }}
        accept="image/png, image/jpeg, image/jpg"
        onChange={handleImageUpload}
      />

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

        <button
          className={isActive(tool, "hand")}
          onClick={() => setTool("hand")}
        >
          ✋
        </button>

        <button
          className={isActive(tool, "image")}
          onClick={() => {
            setTool("image");
            fileInputRef.current?.click();
          }}
        >
          🖼️
        </button>

        <div className="zoom-controls">
          <button onClick={handleZoomIn}>Zoom In (+)</button>
          <button onClick={handleZoomOut}>Zoom Out (-)</button>
          <button onClick={handleResetZoom}>Reset Zoom</button>
          <span className="zoom-info">{Math.round(scale * 100)}%</span>
        </div>
      </div>

      <Stage
        width={stageWidth}
        height={stageHeight}
        className="whiteboard-stage"
        onMouseDown={handleMouseDown}
        onMousemove={handleMouseMove}
        onMouseup={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        scaleX={scale}
        scaleY={scale}
        x={position.x}
        y={position.y}
        draggable={tool === "hand"}
        ref={stageRef}
      >
        <Layer>
          {/* ADDED: Render images */}
          {images.map((img, i) => (
            <KonvaImage
              key={`image-${i}`}
              x={img.x}
              y={img.y}
              width={img.width}
              height={img.height}
              image={img.imageElement}
              draggable
            />
          ))}

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
