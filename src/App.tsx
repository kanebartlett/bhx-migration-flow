import { Routes, Route, Navigate } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage';
import { AvailabilityPage } from './pages/AvailabilityPage';
import { LoadingPage } from './pages/LoadingPage';
import { ProductSelectionPage } from './pages/ProductSelectionPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/landing" replace />} />
      <Route path="/landing" element={<LandingPage />} />
      <Route path="/loading" element={<LoadingPage />} />
      <Route path="/products" element={<ProductSelectionPage />} />
      <Route path="/availability" element={<AvailabilityPage />} />
    </Routes>
  );
}

export default App;
