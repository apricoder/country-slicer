import * as React from "react";
import { useRef, useState } from "react";
import { MapContainer, Polygon, TileLayer } from 'react-leaflet';

import 'leaflet/dist/leaflet.css';
import './App.css'

import polandBorderPolygons from './polygons/pol';


const App = () => {
  const [panelWidth, setPanelWidth] = useState<number>(300); // Default width
  const sidePanelRef = useRef<HTMLDivElement | null>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    const startX = e.clientX;
    const startWidth = panelWidth;

    // Prevent text selection and set the cursor
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'ew-resize';

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const newWidth = Math.min(
        Math.max(startWidth + moveEvent.clientX - startX, 200), // Min width
        400 // Max width
      );
      setPanelWidth(newWidth);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);

      document.body.style.userSelect = ''; // Re-enable text selection
      document.body.style.cursor = ''; // Reset cursor
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <>
      <div className="fx-row h-100vh">
        <div
          className="side-panel fx-col h-100"
          style={{ width: `${panelWidth}px` }}
          ref={sidePanelRef}
        >
          <div className="title-wrapper">Country Slicer</div>
          <div className="resize-handle" onMouseDown={handleMouseDown}></div>

        </div>

        <div className="fx-1 h-100">
          <MapContainer center={[52.237049, 19.017532]} zoom={6} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <>
              {polandBorderPolygons.map((p, i) => (
                <Polygon key={i} positions={p} color="blue"/>
              ))}
            </>
          </MapContainer>
        </div>

      </div>

    </>
  )
};

export default App
