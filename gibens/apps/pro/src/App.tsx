import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import Register from './pages/Register'
import SubmitBid from './pages/SubmitBid'
import MyBids from './pages/MyBids'
import Messages from './pages/Messages'
import Chat from './pages/Chat'
import Earnings from './pages/Earnings'
import ProProfile from './pages/ProProfile'
import Support from './pages/Support'
import Layout from './components/Layout'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Loading...</div>
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'vendor') return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="bid/:jobId" element={<SubmitBid />} />
        <Route path="bids" element={<MyBids />} />
        <Route path="messages" element={<Messages />} />
        <Route path="chat/:jobId" element={<Chat />} />
        <Route path="earnings" element={<Earnings />} />
        <Route path="profile" element={<ProProfile />} />
        <Route path="support" element={<Support />} />
      </Route>
    </Routes>
  )
}
