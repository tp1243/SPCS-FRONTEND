import { useEffect, useRef } from 'react'
const dingUrl = new URL('../assets/Iphone SMS (Ting).mp3', import.meta.url).href

type Options = {
  volume?: number
  cooldownMs?: number
  enabled?: boolean
}

export function useNotificationSound(options?: Options) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const lastPlayRef = useRef<number>(0)
  const enabledRef = useRef<boolean>(options?.enabled ?? true)
  const primedRef = useRef<boolean>(false)
  const cooldown = options?.cooldownMs ?? 2000
  const volume = options?.volume ?? 0.8

  useEffect(() => {
    const a = new Audio()
    a.src = dingUrl
    a.preload = 'auto'
    a.volume = volume
    audioRef.current = a
    return () => {
      try { audioRef.current?.pause() } catch {}
      audioRef.current = null
    }
  }, [volume])

  function play() {
    if (!enabledRef.current) return
    if (document.visibilityState !== 'visible') return
    const now = Date.now()
    if (now - lastPlayRef.current < cooldown) return
    lastPlayRef.current = now
    const a = audioRef.current
    if (a) {
      try {
        a.currentTime = 0
        const p = a.play()
        if (p && typeof p.then === 'function') {
          p.catch(() => {
            try { a.pause() } catch {}
            beep()
          })
        }
      } catch {
        beep()
      }
    }
  }

  // Prime playback once on a user gesture: play muted to satisfy autoplay policies
  function prime() {
    const a = audioRef.current
    if (!a || primedRef.current) return
    try {
      a.muted = true
      a.currentTime = 0
      const p = a.play()
      if (p && typeof p.then === 'function') {
        p.then(() => {
          a.pause()
          a.muted = false
          primedRef.current = true
        }).catch(() => { /* ignore */ })
      } else {
        a.pause()
        a.muted = false
        primedRef.current = true
      }
    } catch {
      // ignore
    }
  }

  function setEnabled(v: boolean) { enabledRef.current = v }

  function beep() {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      o.type = 'sine'
      o.frequency.value = 880
      g.gain.value = 0.0001 + (volume * 0.1)
      o.connect(g)
      g.connect(ctx.destination)
      const now = ctx.currentTime
      o.start(now)
      g.gain.exponentialRampToValueAtTime(0.00001, now + 0.18)
      o.stop(now + 0.2)
      setTimeout(() => { try { ctx.close() } catch {} }, 400)
    } catch {}
  }

  return { play, setEnabled, prime }
}