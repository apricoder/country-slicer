import './App.css'

import { MapContainer, TileLayer, Polygon } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

import polandBorderPolygons from './polygons/pol';


const App = () => {

  return (
    <>
      <div className="fx-row h-100vh">
        <div className="side-panel fx-1 fx-col h-100">
          <div className="title-wrapper"></div>
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
