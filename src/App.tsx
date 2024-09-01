import * as React from "react";
import { useRef, useState } from "react";
import * as _ from "lodash";
import { MapContainer, Polygon, TileLayer } from 'react-leaflet';

import 'leaflet/dist/leaflet.css';
import './App.css'

import polandBorderPolygons from './polygons/pol';

enum SliceShape {
  Rectangle = 'rectangle',
  Circle = 'circle',
}

enum DistanceUnit {
  Km = 'km',
  Mi = 'mi',
}

const allowedCountries = [{
  code: 'pol',
  name: 'Poland',
}];

const App = () => {
  const [settingsPanelWidth, setSettingsPanelWidth] = useState<number>(300); // Default width
  const settingsPanelRef = useRef<HTMLDivElement | null>(null);

  const [selectedCountry, setSelectedCountry] = useState<string>(allowedCountries[0].code);

  const allowedShapes = _.values(SliceShape);
  const [sliceShape, setSliceShape] = useState<SliceShape>(SliceShape.Rectangle); // Default shape

  const allowedDistanceUnits = _.values(DistanceUnit);
  const [radius, setRadius] = useState<number>(50);
  const [radiusUnit, setRadiusUnit] = useState<DistanceUnit>(DistanceUnit.Km);


  const handleMouseDown = (e: React.MouseEvent) => {
    const startX = e.clientX;
    const startWidth = settingsPanelWidth;

    // Prevent text selection and set the cursor
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'ew-resize';

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const newWidth = Math.min(
        Math.max(startWidth + moveEvent.clientX - startX, 200), // Min width
        400 // Max width
      );
      setSettingsPanelWidth(newWidth);
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

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCountry(e.target.value);
  };

  const handleShapeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSliceShape(e.target.value as SliceShape);
  };

  const handleRadiusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRadius(e.target.value as number);
  };

  const handleRadiusUnitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRadiusUnit(e.target.value as DistanceUnit);
  };

  return (
    <>
      <div className="fx-row h-100vh">
        <div
          className="settings-panel fx-col h-100"
          style={{ width: `${settingsPanelWidth}px` }}
          ref={settingsPanelRef}
        >
          <div className="resize-handle" onMouseDown={handleMouseDown}></div>
          <div className="settings-section">
            <div className="title">Country Slicer</div>
          </div>

          <div className="settings-section">
            <div className="setting-row">
              <label htmlFor="countrySelect">Country:</label>
              <select id="countrySelect" value={selectedCountry}
                      onChange={handleCountryChange}
                      className="fx-1 setting">
                {allowedCountries.map(country => (
                  <option key={country.code} value={country.code}>{country.name}</option>
                ))}
              </select>
            </div>
            <div className="setting-row">
              <label htmlFor="shapeSelect">Shape:</label>
              <select id="shapeSelect" value={sliceShape} onChange={handleShapeChange} className="fx-1 setting">
                {allowedShapes.map(shape => (
                  <option key={shape} value={shape}>{_.capitalize(shape)}</option>
                ))}
              </select>
            </div>
            {
              sliceShape === SliceShape.Circle && (
                <div className="setting-row">
                  <label htmlFor="radiusInput">Radius:</label>
                  <div className="fx-row setting">
                    <input id="radiusInput" className="fx-1"
                           value={radius} onChange={handleRadiusChange}
                           min={1} max={999}
                           type="number"
                    />
                    <select id="radiusUnitSelect" value={radiusUnit} onChange={handleRadiusUnitChange}>
                      {allowedDistanceUnits.map(unit => (
                        <option key={unit} value={unit}>{unit}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )
            }

          </div>

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
