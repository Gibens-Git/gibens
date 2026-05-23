import { useState, useEffect } from 'react'

export interface GeoLocation { lat: number; lon: number; address?: string }

export function useLocation() {
  const [location, setLocation] = useState<GeoLocation | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const detect = () => {
    setLoading(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude })
        setLoading(false)
      },
      (err) => { setError(err.message); setLoading(false) },
      { timeout: 10000 }
    )
  }

  useEffect(() => { detect() }, [])

  return { location, error, loading, detect }
}
