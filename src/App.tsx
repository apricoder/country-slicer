import * as React from "react";
import { useRef, useState } from "react";
import * as _ from "lodash";
import * as turf from '@turf/turf';
import { Circle, MapContainer, Polygon, Rectangle, TileLayer } from 'react-leaflet';

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
  const [sliceShape, setSliceShape] = useState<SliceShape>(SliceShape.Circle); // Default shape

  const allowedDistanceUnits = _.values(DistanceUnit);
  const [radius, setRadius] = useState<number>(50);
  const [radiusUnit, setRadiusUnit] = useState<DistanceUnit>(DistanceUnit.Km);

  const [slicedCircles, setSlicedCircles] = useState<any[]>([]);  // todo fix properly

  const [sideLength, setSideLength] = useState<number>(100);
  const [sideLengthUnit, setSideLengthUnit] = useState<DistanceUnit>(DistanceUnit.Km);

  const [slicedSquares, setSlicedSquares] = useState<any[]>([]);

  const handleMouseDown = (e: React.MouseEvent) => {
    const startX = e.clientX;
    const startWidth = settingsPanelWidth;

    // Prevent text selection and set the cursor
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'ew-resize';

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const newWidth = Math.min(
        Math.max(startWidth + moveEvent.clientX - startX, 300), // Min width
        600 // Max width
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
    setRadius(+e.target.value); // todo fix properly
  };

  const handleRadiusUnitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRadiusUnit(e.target.value as DistanceUnit);
  };

  const slice = () => {
    const polygon = polandBorderPolygons[0];
    const polygonFeature = turf.polygon([polygon]);

    const bounds = turf.bbox(polygonFeature);
    const [west, south, east, north] = bounds;

    console.log(`>> bounds`, { north, south, west, east });

    // Convert side length to kilometers
    const sideLengthInKm = sideLengthUnit === DistanceUnit.Km ? sideLength : sideLength * 1.60934;

    // Function to calculate the longitude difference for a given latitude and distance
    const getLongitudeDelta = (lat: number, distanceKm: number) => {
      const earthRadius = 6371; // Earth's radius in kilometers
      const latRad = lat * (Math.PI / 180);
      const longitudeDelta = (distanceKm / earthRadius) * (180 / Math.PI) / Math.cos(latRad);
      return longitudeDelta;
    };

    // Calculate the number of rows (latitude steps)
    const latitudeStep = sideLengthInKm / 111.32;
    const rows = Math.ceil((north - south) / latitudeStep);

    const squares = [];

    for (let row = 0; row < rows; row++) {
      const lat = south + row * latitudeStep;
      const longitudeDelta = getLongitudeDelta(lat, sideLengthInKm);
      const cols = Math.ceil((east - west) / longitudeDelta);

      for (let col = 0; col < cols; col++) {
        const lon = west + col * longitudeDelta;
        const squareBbox = [
          lon,
          lat,
          lon + longitudeDelta,
          lat + latitudeStep
        ];
        const squarePolygon = turf.bboxPolygon(squareBbox);

        if (turf.booleanIntersects(squarePolygon, polygonFeature)) {
          squares.push({
            bbox: squareBbox,
            properties: { intersects: true }
          });
        }
      }
    }

    // Convert to Leaflet format
    const leafletSquares = squares.map(square => {
      const [west, south, east, north] = square.bbox;
      return {
        bounds: [[west, south], [east, north]],
        options: {
          color: 'green',
          fillColor: 'green',
          fillOpacity: 0.3
        }
      };
    });

    console.log(`>> leafletSquares`, leafletSquares);

    setSlicedSquares(leafletSquares);
  }

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

          <div className="settings-section">
            <div className="fx-row buttons-row">
              <button className="fx-1">Clear</button>
              <button className="fx-1" onClick={slice}>Slice</button>
            </div>
          </div>

        </div>

        <div className="fx-1 h-100">
          <MapContainer center={[52.237049, 19.017532]} zoom={6} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <>
              {polandBorderPolygons.map((p: any, i) => (  // todo fix properly
                <Polygon key={i} positions={p} color="blue"/>
              ))}
              {/*{slicedCircles.map((circle: any, index) => (  // todo fix properly*/}
              {/*  <Circle*/}
              {/*    key={index}*/}
              {/*    center={circle.center}*/}
              {/*    radius={circle.radius}*/}
              {/*    pathOptions={circle.options}*/}
              {/*  />*/}
              {/*))}*/}
              {slicedSquares.map((square: any, index) => (
                <Rectangle
                  key={index}
                  bounds={square.bounds}
                  pathOptions={square.options}
                />
              ))}
            </>
          </MapContainer>
        </div>

      </div>

    </>
  )
};

export default App
