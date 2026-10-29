import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { LeagueProvider } from './store/LeagueContext'
import { ToastProvider } from './components/ui/ToastProvider'
import { AppShell } from './components/layout/AppShell'
import { Dashboard } from './pages/Dashboard'
import { Teams } from './pages/Teams'
import { TeamDetail } from './pages/TeamDetail'
import { Players } from './pages/Players'
import { DeletePlayers } from './pages/DeletePlayers'
import { PlayerDetail } from './pages/PlayerDetail'
import { Games } from './pages/Games'
import { Standings } from './pages/Standings'
import { Favorites } from './pages/Favorites'
import { Data } from './pages/Data'
import { NotFound } from './pages/NotFound'

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <LeagueProvider>
          <AppShell>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/teams" element={<Teams />} />
              <Route path="/teams/:teamId" element={<TeamDetail />} />
              <Route path="/players" element={<Players />} />
              <Route path="/players/delete" element={<DeletePlayers />} />
              <Route path="/players/:playerId" element={<PlayerDetail />} />
              <Route path="/games" element={<Games />} />
              <Route path="/standings" element={<Standings />} />
              <Route path="/favorites" element={<Favorites />} />
              <Route path="/data" element={<Data />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AppShell>
        </LeagueProvider>
      </ToastProvider>
    </BrowserRouter>
  )
}
