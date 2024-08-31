import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

import { MapContainer, TileLayer, Polygon } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import * as L from 'leaflet'

// Poland border coordinates (simplified for the example)
const polandBorders = [
  [54.800685, 19.772611],
  [54.035318, 23.374809],
  [52.089947, 23.176333],
  [50.884372, 24.029986],
  [49.028753, 22.558138],
  [49.470107, 19.922346],
  [50.047929, 18.815423],
  [50.705407, 16.226228],
  [51.106674, 14.607098],
  [52.839478, 14.353315],
  [54.050706, 16.363477],
  [54.682606, 18.696254],
  [54.800685, 19.772611],
];


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
