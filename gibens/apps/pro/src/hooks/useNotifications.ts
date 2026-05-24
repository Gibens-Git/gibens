import { useState, useEffect, useRef } from 'react'
import { supabase, subscribeToNotifications } from '@gibens/supabase'
import type { Notification } from '@gibens/supabase'

export function useNotifications(userId: string | undefined) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [toast, setToast] = useState<Notification | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const lastNotifAt = useRef<string>('')

  const showToast = (notif: Notification) => {
    setToast(notif)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 5000)
  }

  useEffect(() => {
    if (!userId) return

    const startedAt = new Date().toISOString()

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
          lastNotifAt.current = data.length > 0 ? data[0].created_at : startedAt
        } else {
          lastNotifAt.current = startedAt
        }
      })

    // Realtime subscription (works when notifications table is in supabase_realtime publication)
    const channel = subscribeToNotifications(userId, (n) => {
      const notif = n as Notification
      setNotifications(prev => [notif, ...prev])
      setUnreadCount(c => c + 1)
      lastNotifAt.current = notif.created_at
      showToast(notif)
    })

    // Polling fallback — catches new notifications and refreshes unread count
    pollRef.current = setInterval(async () => {
      if (!lastNotifAt.current) return

      // Check for genuinely new notifications (show toast)
      const { data: newData } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .gt('created_at', lastNotifAt.current)
        .order('created_at', { ascending: true })

      if (newData?.length) {
        lastNotifAt.current = newData[newData.length - 1].created_at
        const incoming = newData as Notification[]
        setNotifications(prev => [...incoming.slice().reverse(), ...prev])
        showToast(incoming[incoming.length - 1])
      }

      // Always re-count unread so badge clears when chat is opened elsewhere
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false)

      if (count !== null) setUnreadCount(count)
    }, 8000)

    return () => {
      supabase.removeChannel(channel)
      if (pollRef.current) clearInterval(pollRef.current)
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
