import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import AdminPage from './pages/AdminPage'
import SpectatorPage from './pages/SpectatorPage'
import ScreenPage from './pages/ScreenPage'
import ScreenConnect from './pages/ScreenConnect'

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/connect" element={<ScreenConnect />} />
        <Route path="/event/:id/admin" element={<AdminPage />} />
        <Route path="/event/:id/screen" element={<ScreenPage />} />
        <Route path="/event/:id" element={<SpectatorPage />} />
      </Routes>
    </BrowserRouter>
  )
}
