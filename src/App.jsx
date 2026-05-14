import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import AdminPage from './pages/AdminPage'
import SpectatorPage from './pages/SpectatorPage'
import ScreenPage from './pages/ScreenPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/event/:id/admin" element={<AdminPage />} />
        <Route path="/event/:id/screen" element={<ScreenPage />} />
        <Route path="/event/:id" element={<SpectatorPage />} />
      </Routes>
    </BrowserRouter>
  )
}
