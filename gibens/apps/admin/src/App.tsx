import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import AdminLayout from './components/AdminLayout'
import Login from './pages/Login'
import Overview from './pages/Overview'
import Customers from './pages/Customers'
import Vendors from './pages/Vendors'
import Jobs from './pages/Jobs'
import Disputes from './pages/Disputes'
import Categories from './pages/Categories'
import LeadPricing from './pages/LeadPricing'
import Settings from './pages/Settings'

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Loading...</div>
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'admin') return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<AdminRoute><AdminLayout /></AdminRoute>}>
        <Route index element={<Overview />} />
        <Route path="customers" element={<Customers />} />
        <Route path="vendors" element={<Vendors />} />
        <Route path="jobs" element={<Jobs />} />
        <Route path="disputes" element={<Disputes />} />
        <Route path="categories" element={<Categories />} />
        <Route path="pricing" element={<LeadPricing />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  )
}
