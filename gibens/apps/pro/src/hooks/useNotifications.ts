import { useState, useEffect } from 'react'
import { supabase, subscribeToNotifications } from '@gibens/supabase'
import type { Notification } from '@gibens/supabase'

export function useNotifications(userId: string | undefined) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

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
      setNotifications(prev => [n as Notification, ...prev])
      setUnreadCount(c => c + 1)
    })

    return () => { supabase.removeChannel(channel) }
  }, [userId])

  const markRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
    setUnreadCount(c => Math.max(0, c - 1))
  }

  return { notifications, unreadCount, markRead }
}
