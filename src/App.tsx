import * as React from "react";
import { useRef, useState } from "react";
import * as _ from "lodash";
import * as turf from '@turf/turf';
import { Circle, MapContainer, Polygon, TileLayer } from 'react-leaflet';

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

  const [slicedCircles, setSlicedCircles] = useState([]);


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
    setRadius(e.target.value as number);
  };

  const handleRadiusUnitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRadiusUnit(e.target.value as DistanceUnit);
  };

  const slice = () => {
    const polygon = polandBorderPolygons[0];  // todo support countries in multiple parts
    const polygonFeature = turf.polygon([polygon]);

    const bounds = turf.bbox(polygonFeature);
    const [west, south, east, north] = bounds;

    console.log(`>> bounds`, bounds);

    // Convert radius to kilometers
    const radiusInKm = radiusUnit === DistanceUnit.Km ? radius : radius * 1.60934;

    // Calculate the cell size in degrees
    const centerLat = (north + south) / 2;
    const cellSizeX = (radiusInKm * 2) / (111.32 * Math.cos(centerLat * Math.PI / 180));
    const cellSizeY = (radiusInKm * 2) / 110.574;

    // Adjust vertical spacing to create overlap
    const verticalSpacingFactor = Math.sqrt(3) / 2; // This creates the proper overlap for a hexagonal packing
    const adjustedCellSizeY = cellSizeY * verticalSpacingFactor;

    // Create a grid of points
    const xCount = Math.ceil((east - west) / cellSizeX);
    const yCount = Math.ceil((north - south) / adjustedCellSizeY);

    const grid = [];
    for (let y = 0; y <= yCount; y++) {
      const isOddRow = y % 2 !== 0;
      const xOffset = isOddRow ? cellSizeX / 2 : 0;
      for (let x = 0; x <= xCount; x++) {
        const lon = west + x * cellSizeX + xOffset;
        const lat = south + y * adjustedCellSizeY;
        grid.push(turf.point([lon, lat]));
      }
    }

    // Create circles from points
    const circles = grid.map(point => {
      const circle = turf.circle(point, radiusInKm, { units: 'kilometers' });
      return {
        ...circle,
        properties: {
          ...circle.properties,
          intersects: turf.booleanIntersects(circle, polygonFeature)
        }
      };
    });

    // Filter out circles that don't intersect with Poland
    const intersectingCircles = circles.filter(circle => circle.properties.intersects);

    // Convert to Leaflet format
    const leafletCircles = intersectingCircles.map(circle => {
      const [lng, lat] = turf.center(circle).geometry.coordinates;
      return {
        center: [lng, lat], // Leaflet uses [lat, lng] order
        radius: radiusInKm * 1000, // Convert km to meters for Leaflet
        options: {
          color: 'green',
          fillColor: 'green',
          fillOpacity: 0.3
        }
      };
    });

    console.log(`>> leafletCircles`, leafletCircles);

    setSlicedCircles(leafletCircles);
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
              {polandBorderPolygons.map((p, i) => (
                <Polygon key={i} positions={p} color="blue"/>
              ))}
              {slicedCircles.map((circle, index) => (
                <Circle
                  key={index}
                  center={circle.center}
                  radius={circle.radius}
                  pathOptions={circle.options}
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
