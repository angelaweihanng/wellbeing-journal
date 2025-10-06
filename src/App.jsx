import React, { useEffect, useMemo, useState } from 'react'
import History from './components/History.jsx'
import { fetchToday, saveEntry } from './api.js'

const GAS_URL = import.meta.env.VITE_GAS_URL
const ALLOWED_USERNAME = import.meta.env.VITE_ALLOWED_USERNAME
const ALLOWED_PASSWORD = import.meta.env.VITE_ALLOWED_PASSWORD

const likertItems = [
  { key: 'emotional_state', label: 'Emotional State', prompt: '“I felt emotionally balanced and in control today.”' },
  { key: 'physical_state', label: 'Physical State', prompt: '“I felt physically well and energised today.”' },
  { key: 'social_connectedness', label: 'Social Connectedness', prompt: '“I felt meaningfully connected to others today.”' },
  { key: 'accomplishment', label: 'Sense of Accomplishment', prompt: '“I accomplished what mattered most to me today.”' },
  { key: 'growth', label: 'Personal Growth', prompt: '“I learned something new or grew as a person today.”' },
  { key: 'alignment', label: 'Reflection / Alignment', prompt: '“My actions today were aligned with my values and long-term goals.”' },
]

function todayISO() {
  const now = new Date()
  const yyyy = now.getFullYear()
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function endOfToday() {
  const d = new Date()
  d.setHours(23, 59, 59, 999)
  return d.getTime()
}

export default function App() {
  const [tab, setTab] = useState('journal')
  const [authed, setAuthed] = useState(false)
  const [usernameInput, setUsernameInput] = useState('')
  const [passwordInput, setPasswordInput] = useState('')

  const [form, setForm] = useState({
    date: todayISO(),
    emotional_state: '',
    physical_state: '',
    social_connectedness: '',
    accomplishment: '',
    growth: '',
    alignment: '',
    task_1: '',
    task_2: '',
    task_3: '',
    proud_of: '',
  })

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [existingRowNumber, setExistingRowNumber] = useState(null)

  const canEdit = useMemo(() => {
    const isToday = form.date === todayISO()
    const notExpired = Date.now() <= endOfToday()
    return isToday && notExpired
  }, [form.date])

  useEffect(() => {
    const session = localStorage.getItem('wj_session')
    if (session) {
      try {
        const parsed = JSON.parse(session)
        if (parsed.expiresAt && Date.now() < parsed.expiresAt && parsed.username === ALLOWED_USERNAME) {
          setAuthed(true)
        }
      } catch {}
    }
  }, [])

  useEffect(() => {
    if (!authed) return
    loadToday()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed])

  async function loadToday() {
    setLoading(true)
    setMessage('')
    try {
      const json = await fetchToday(form.date)
      if (json.ok && json.entry) {
        setExistingRowNumber(json.entry.rowNumber)
        setForm({
          date: json.entry.date,
          emotional_state: json.entry.emotional_state || '',
          physical_state: json.entry.physical_state || '',
          social_connectedness: json.entry.social_connectedness || '',
          accomplishment: json.entry.accomplishment || '',
          growth: json.entry.growth || '',
          alignment: json.entry.alignment || '',
          task_1: json.entry.task_1 || '',
          task_2: json.entry.task_2 || '',
          task_3: json.entry.task_3 || '',
          proud_of: json.entry.proud_of || '',
        })
        setMessage('Loaded today’s saved entry.')
      } else if (json.ok) {
        setExistingRowNumber(null)
        setMessage('No entry yet for today.')
      } else {
        setMessage(json.error || 'Failed to load entry.')
      }
    } catch (err) {
      setMessage(String(err))
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = (e) => {
    e.preventDefault()
    if (usernameInput === ALLOWED_USERNAME && passwordInput === ALLOWED_PASSWORD) {
      setAuthed(true)
      localStorage.setItem('wj_session', JSON.stringify({ username: ALLOWED_USERNAME, expiresAt: endOfToday() }))
    } else {
      setMessage('Invalid credentials.')
    }
  }

  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const labelFor = (k) => {
    switch(k){
      case 'task_1': return 'Task 1'
      case 'task_2': return 'Task 2'
      case 'task_3': return 'Task 3'
      case 'proud_of': return 'Proud Of'
      default: return k
    }
  }

  const validate = () => {
    const likertKeys = likertItems.map(i => i.key)
    for (const k of likertKeys) {
      const n = Number(form[k])
      if (!Number.isInteger(n) || n < 1 || n > 6) return `Please rate ${k.replace('_',' ')} from 1 to 6.`
    }
    const textKeys = ['task_1','task_2','task_3','proud_of']
    for (const k of textKeys) {
      const t = (form[k] || '').trim()
      if (t.length < 5) return `“${labelFor(k)}” should not be empty.`
      if (t.length > 600) return `“${labelFor(k)}” is a bit long; please keep it concise.`
    }
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage('')
    const err = validate()
    if (err) { setMessage(err); return; }

    setLoading(true)
    try {
      const json = await saveEntry(form)
      if (json.ok) {
        setExistingRowNumber(json.rowNumber || existingRowNumber)
        setMessage(json.updated ? 'Entry updated for today.' : 'Entry saved for today.')
      } else {
        setMessage(json.error || 'Failed to save.')
      }
    } catch (err) {
      setMessage(String(err))
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem('wj_session')
    setAuthed(false)
    setUsernameInput('')
    setPasswordInput('')
  }

  // Inject iOS slider CSS
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = sliderCSS;
    document.head.appendChild(style);
    return () => style.remove();
  }, []);

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Wellbeing Journal</h1>

        {!authed ? (
          <form onSubmit={handleLogin} style={styles.form}>
            <label style={styles.label}>Username</label>
            <input style={styles.input} value={usernameInput} onChange={e=>setUsernameInput(e.target.value)} placeholder="username" />
            <label style={styles.label}>Password</label>
            <input style={styles.input} type="password" value={passwordInput} onChange={e=>setPasswordInput(e.target.value)} placeholder="password" />
            <button style={styles.button} type="submit">Log in</button>
            {message && <p style={styles.message}>{message}</p>}
          </form>
        ) : (
          <>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:12, flexWrap:'wrap' }}>
              <div style={{ display:'flex', gap:12, alignItems:'center', flexWrap:'wrap' }}>
                <p style={{ margin:0, opacity:0.8 }}>Signed in as <strong>{ALLOWED_USERNAME}</strong></p>
                <nav style={{ display:'flex', gap:8 }}>
                  <button onClick={()=>setTab('journal')} style={{ ...styles.tabBtn, ...(tab==='journal'?styles.tabActive:{}) }}>Journal</button>
                  <button onClick={()=>setTab('history')} style={{ ...styles.tabBtn, ...(tab==='history'?styles.tabActive:{}) }}>History</button>
                </nav>
              </div>
              <button onClick={logout} style={styles.linkBtn}>Log out</button>
            </div>

            {tab === 'journal' ? (
              <form onSubmit={handleSubmit} style={styles.form}>
                <label style={styles.label}>Date</label>
                <input style={styles.input} type="date" value={form.date} onChange={e=>setField('date', e.target.value)} />

                <div style={styles.section}>
                  {likertItems.map(item => (
                    <div key={item.key} style={styles.likertRow}>
                      <div style={{flex:1}}>
                        <div style={styles.itemLabel}>{item.label}</div>
                        <div style={styles.prompt}>{item.prompt}</div>
                      </div>
                      <div style={styles.sliderWrapper}>
                        <input
                          type="range"
                          min="1"
                          max="6"
                          step="1"
                          value={form[item.key] || 1}
                          onChange={(e)=>setField(item.key, Number(e.target.value))}
                          onInput={(e)=> {
                            const percent = ((e.target.value - e.target.min) / (e.target.max - e.target.min)) * 100;
                            e.target.style.setProperty('--percent', `${percent}%`);
                          }}
                          style={styles.slider}
                        />
                        <div style={styles.sliderLabels}>
                          <span>1</span>
                          <span>6</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={styles.section}>
                  {[
                    { key: 'task_1', title: 'Task 1', desc: 'Briefly describe the most significant task you worked on today.' },
                    { key: 'task_2', title: 'Task 2', desc: 'Briefly describe another meaningful task you completed today.' },
                    { key: 'task_3', title: 'Task 3', desc: 'Briefly describe one more task you spent time on today.' },
                    { key: 'proud_of', title: 'Proud Of', desc: 'What are you most proud of achieving or experiencing today?' },
                  ].map(item => (
                    <div key={item.key} style={styles.openEndedCard}>
                      <div style={styles.openEndedTitle}>{item.title}</div>
                      <div style={styles.openEndedDescription}>{item.desc}</div>
                      <input
                        type="text"
                        style={styles.openEndedInput}
                        value={form[item.key]}
                        onChange={e => setField(item.key, e.target.value)}
                        placeholder="Reflection"
                      />
                    </div>
                  ))}
                </div>

                {message && <p style={styles.message}>{message}</p>}

                <button style={{...styles.button, opacity: loading?0.7:1}} type="submit" disabled={loading || !canEdit}>
                  {existingRowNumber ? (canEdit ? 'Update today’s entry' : 'Editing closed for today') : 'Submit today’s entry'}
                </button>
                {!canEdit && (
                  <p style={{...styles.message, fontSize:12}}>Editing is disabled after the day ends. You can still view your saved entry.</p>
                )}
              </form>
            ) : (
              <History />
            )}
          </>
        )}
      </div>
    </div>
  )
}

// iOS slider CSS
const sliderCSS = `
input[type="range"] {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  background: transparent;
}
input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #fff;
  border: 1px solid #ccc;
  box-shadow: 0 2px 4px rgba(0,0,0,0.15);
  cursor: pointer;
  margin-top: -12px;
}
input[type="range"]::-moz-range-thumb {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #fff;
  border: 1px solid #ccc;
  box-shadow: 0 2px 4px rgba(0,0,0,0.15);
  cursor: pointer;
}
input[type="range"]::-webkit-slider-runnable-track {
  height: 4px;
  border-radius: 2px;
  background: linear-gradient(to right, #007AFF var(--percent, 0%), #d1d1d6 var(--percent, 0%));
}
input[type="range"]::-moz-range-track {
  height: 4px;
  border-radius: 2px;
  background: #d1d1d6;
}
`

const styles = {
  page: {
    minHeight: '100vh',
    display:'flex',
    alignItems:'center',
    justifyContent:'center',
    padding:'32px',
    background: 'linear-gradient(180deg, #f6f7f9 0%, #e9ecf0 100%)',
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Arial, sans-serif',
  },
  card: {
    width: '100%',
    maxWidth: 700,
    background: 'rgba(255, 255, 255, 0.7)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderRadius: 20,
    padding: '32px 28px',
    boxShadow: '0 4px 30px rgba(0,0,0,0.05)',
    border: '1px solid rgba(255, 255, 255, 0.5)',
  },
  title: {
    fontSize: 28,
    fontWeight: 600,
    margin: '0 0 24px',
    color: '#111',
    letterSpacing: '-0.3px'
  },
  form: { display:'grid', gap: 20 },
  label: {
    fontWeight: 600,
    fontSize: 14,
    color: '#222',
    letterSpacing: '-0.1px',
    marginBottom: 4
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 10,
    border: '1px solid #d1d1d6',
    background: 'rgba(255,255,255,0.8)',
    outline: 'none',
    fontSize: 14,
    transition: 'border-color 0.2s',
  },
  section: { display:'grid', gap: 16 },
  likertRow: {
    display:'flex',
    flexDirection:'column',
    gap: 6,
    padding: '16px 18px',
    border: '1px solid #e5e5ea',
    borderRadius: 14,
    background: 'rgba(250, 250, 250, 0.8)',
  },
  itemLabel: { fontWeight: 600, fontSize: 15, color: '#111' },
  prompt: { fontSize: 13, opacity: 0.7, color: '#444', marginTop: 2 },
  sliderWrapper: { width: '100%', display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8 },
  slider: {
    width: '100%',
    cursor: 'pointer',
  },
  sliderLabels: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 12,
    opacity: 0.6,
    color: '#444'
  },
  openEndedCard: {
    display: 'grid',
    gap: 6,
    padding: '16px 18px',
    border: '1px solid #e5e5ea',
    borderRadius: 14,
    background: 'rgba(250, 250, 250, 0.8)',
  },
  openEndedTitle: {
    fontWeight: 600,
    fontSize: 15,
    color: '#111',
  },
  openEndedDescription: {
    fontSize: 13,
    opacity: 0.7,
    color: '#444',
  },
  openEndedInput: {
    marginTop: 8,
    width: '100%',
    padding: '10px 12px',
    borderRadius: 10,
    border: '1px solid #d1d1d6',
    background: '#f5f5f7',
    fontSize: 14,
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  button: {
    marginTop: 8,
    padding: '12px 16px',
    borderRadius: 12,
    border: 'none',
    cursor: 'pointer',
    background: '#007AFF',
    color: 'white',
    fontWeight: 600,
    fontSize: 15,
    transition: 'background 0.2s',
  },
  linkBtn: {
    background: 'transparent',
    color: '#007AFF',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 500,
    fontSize: 14
  },
  message: { margin: 0, opacity: 0.85, fontSize: 14, color: '#333' },
  tabBtn: {
    padding: '8px 14px',
    borderRadius: 10,
    border: '1px solid #d1d1d6',
    background:'#fff',
    cursor:'pointer',
    fontSize: 14,
  },
  tabActive: {
    background:'#007AFF',
    color:'#fff',
    borderColor:'#007AFF'
  }
}
