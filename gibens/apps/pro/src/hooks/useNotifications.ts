import { useState, useEffect, useRef } from 'react'
import { supabase, subscribeToNotifications } from '@gibens/supabase'
import type { Notification } from '@gibens/supabase'

export function useNotifications(userId: string | undefined) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [toast, setToast] = useState<Notification | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!userId) return

    supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data }) => {
        if (data) {
          setNotifications(data)
          setUnreadCount(data.filter(n => !n.is_read).length)
        }
      })

    const channel = subscribeToNotifications(userId, (n) => {
      const notif = n as Notification
      setNotifications(prev => [notif, ...prev])
      setUnreadCount(c => c + 1)
      setToast(notif)
      if (toastTimer.current) clearTimeout(toastTimer.current)
      toastTimer.current = setTimeout(() => setToast(null), 5000)
    })

    return () => {
      supabase.removeChannel(channel)
      if (toastTimer.current) clearTimeout(toastTimer.current)
    }
  }, [userId])

  const markRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
    setUnreadCount(c => Math.max(0, c - 1))
  }

  const dismissToast = () => {
    setToast(null)
    if (toastTimer.current) clearTimeout(toastTimer.current)
  }

  return { notifications, unreadCount, markRead, toast, dismissToast }
}
