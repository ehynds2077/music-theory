import { BrowserRouter, Routes, Route } from 'react-router';
import { NavHeader } from './components/NavHeader';
import { SpiralExplorePage } from './pages/SpiralExplorePage';
import { PianoSpiralPage } from './pages/PianoSpiralPage';
import { IntervalsLesson } from './pages/lessons/IntervalsLesson';

export function App() {
  return (
    <BrowserRouter>
      <NavHeader />
      <Routes>
        <Route path="/" element={<SpiralExplorePage />} />
        <Route path="/piano-spiral" element={<PianoSpiralPage />} />
        <Route path="/lessons/intervals" element={<IntervalsLesson />} />
      </Routes>
    </BrowserRouter>
  );
}
