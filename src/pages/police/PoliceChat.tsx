import { useEffect, useState } from 'react'
import { policeApi } from '../../services/police'

type Props = { token: string; officer?: { username: string } }

export default function PoliceChat({ token, officer }: Props) {
  const [messages, setMessages] = useState<Array<{ _id?: string; text: string; from?: string; to?: string; createdAt?: string }>>([])
  const [text, setText] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    policeApi.listChats(token).then((res) => setMessages(res.messages || [])).catch((err) => setError(err.message || 'Failed to load messages'))
  }, [token])

  async function send() {
    if (!text.trim()) return
    try {
      const res = await policeApi.sendChat(token, { text })
      setMessages(prev => [...prev, res.message])
      setText('')
    } catch (err: any) {
      setError(err.message || 'Failed to send')
    }
  }

  return (
    <div className="panel">
      <div className="label">Real-Time Communication</div>
      {error && <div className="form-error">{error}</div>}
      <div className="chat-box" style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 12, borderRadius: 8, background: 'var(--panel)' }}>
        <div className="messages" style={{ maxHeight: 360, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {messages.map((m) => (
            <div key={m._id} className="message" style={{ alignSelf: m.from === officer?.username ? 'flex-end' : 'flex-start' }}>
              <div className="card sm" style={{ background: m.from === officer?.username ? 'var(--accent-700)' : 'var(--panel-700)' }}>
                <div className="muted" style={{ fontSize: 11 }}>{m.from || 'Citizen'}</div>
                <div>{m.text}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a message" />
          <button className="btn" onClick={send}>Send</button>
        </div>
      </div>
      <div className="muted" style={{ marginTop: 8 }}>Push notifications and in-app calls can be integrated later.</div>
    </div>
  )
}