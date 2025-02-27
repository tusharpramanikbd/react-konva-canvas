/** @format */

import { Stage, Layer } from "react-konva";
import "./Whiteboard.css";

const Whiteboard: React.FC = () => {
  // Stage dimensions
  const stageWidth = window.innerWidth - 300;
  const stageHeight = window.innerHeight - 300;

  return (
    <div className="whiteboard-container">
      <div className="toolbar">
        <button>Pen</button>
        <button>Eraser</button>
        <button>Rectangle</button>
        <button>Circle</button>
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
