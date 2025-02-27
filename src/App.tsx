/** @format */

import Whiteboard from "./components/Whiteboard/Whiteboard";
import "./App.css";

const App: React.FC = () => {
  return (
    <div className="App">
      <h1>Simple Whiteboard App</h1>
      <Whiteboard />
    </div>
  );
};

export default App;
