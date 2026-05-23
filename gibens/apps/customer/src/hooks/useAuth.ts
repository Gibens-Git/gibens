// Re-export from the single shared AuthContext so all components
// that import useAuth from this hook get the same context instance.
export { useAuth } from '../contexts/AuthContext'
