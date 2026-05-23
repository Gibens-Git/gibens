import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import PostJob from './pages/PostJob'
import JobDetail from './pages/JobDetail'
import Messages from './pages/Messages'
import Chat from './pages/Chat'
import MyJobs from './pages/MyJobs'
import Profile from './pages/Profile'
import VendorProfile from './pages/VendorProfile'
import Layout from './components/Layout'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Loading...</div>
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<Home />} />
        <Route path="post-job" element={<PostJob />} />
        <Route path="jobs" element={<MyJobs />} />
        <Route path="jobs/:jobId" element={<JobDetail />} />
        <Route path="messages" element={<Messages />} />
        <Route path="chat/:jobId" element={<Chat />} />
        <Route path="profile" element={<Profile />} />
        <Route path="vendor/:vendorId" element={<VendorProfile />} />
      </Route>
    </Routes>
  )
}
