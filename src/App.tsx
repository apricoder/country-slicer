import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

import { MapContainer, TileLayer, Polygon } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import * as L from 'leaflet'

import polandBorderPolygons from './polygons/pol';


const App = () => {

  return (
    <>
      <div style={{ height: '100%', width: '100%' }}>
        <MapContainer center={[52.237049, 19.017532]} zoom={6} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <Polygon positions={polandBorders} color="blue"/>
        </MapContainer>
      </div>
    </>
  )
};

export default App
