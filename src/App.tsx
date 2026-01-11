import { Routes, Route, Navigate } from 'react-router-dom';
import RestaurantsNearby from './components/RestaurantsNearby';
import MichelinNearby from './components/MichelinNearby';
import NavigationBar from './components/NavigationBar';

const App = () => {
  return (
    <>
      <NavigationBar />
      <Routes>
        <Route path="/" element={<RestaurantsNearby />} />
        <Route path="/michelin" element={<MichelinNearby />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
};

export default App;
