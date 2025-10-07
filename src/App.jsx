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

export default function App() {
  const [tab, setTab] = useState('journal')
  const [authed, setAuthed] = useState(false)
  const [usernameInput, setUsernameInput] = useState('')
  const [passwordInput, setPasswordInput] = useState('')

  const [form, setForm] = useState({
    date: todayISO(),
    emotional_state: 4,
    physical_state: 4,
    social_connectedness: 4,
    accomplishment: 4,
    growth: 4,
    alignment: 4,
    task_1: '',
    task_2: '',
    task_3: '',
    proud_of: '',
  })

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [existingRowNumber, setExistingRowNumber] = useState(null)

  // ✅ Allow editing any date now
  const canEdit = useMemo(() => true, [form.date])

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
    loadEntry(form.date)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed, form.date])

  async function loadEntry(date) {
    setLoading(true)
    setMessage('')
    try {
      const json = await fetchToday(date)
      if (json.ok && json.entry) {
        setExistingRowNumber(json.entry.rowNumber)
        setForm({
          date: json.entry.date,
          emotional_state: Number(json.entry.emotional_state) || 4,
          physical_state: Number(json.entry.physical_state) || 4,
          social_connectedness: Number(json.entry.social_connectedness) || 4,
          accomplishment: Number(json.entry.accomplishment) || 4,
          growth: Number(json.entry.growth) || 4,
          alignment: Number(json.entry.alignment) || 4,
          task_1: json.entry.task_1 || '',
          task_2: json.entry.task_2 || '',
          task_3: json.entry.task_3 || '',
          proud_of: json.entry.proud_of || '',
        })
        setMessage('Loaded saved entry.')
      } else if (json.ok) {
        setExistingRowNumber(null)
        setMessage('No entry yet for this date.')
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
      localStorage.setItem('wj_session', JSON.stringify({ username: ALLOWED_USERNAME, expiresAt: Date.now() + 24*60*60*1000 }))
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
      if (!Number.isInteger(n) || n < 1 || n > 7) return `Please rate ${k.replace('_',' ')} from 1 to 7.`
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
        setMessage(json.updated ? 'Entry updated.' : 'Entry saved.')
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
    const style = document.createElement('style')
    style.textContent = sliderCSS
    document.head.appendChild(style)
    return () => style.remove()
  }, [])

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
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:12, flexWrap:'wrap', marginBottom:20 }}>
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

                <div style={styles.sectionHeader}>MOOD</div>
                <div style={styles.groupBox}>
                  {likertItems.map((item, i) => (
                    <div key={item.key} style={styles.cell}>
                      <div>
                        <div style={styles.itemLabel}>{item.label}</div>
                        <div style={styles.prompt}>{item.prompt}</div>
                      </div>
                      <div style={styles.sliderWrapper}>
                        <input
                          type="range"
                          min="1"
                          max="7"
                          step="1"
                          value={form[item.key] || 4}
                          onChange={(e)=>setField(item.key, Number(e.target.value))}
                          onInput={(e)=> {
                            const percent = ((e.target.value - e.target.min) / (e.target.max - e.target.min)) * 100;
                            e.target.style.setProperty('--percent', `${percent}%`);
                          }}
                          style={styles.slider}
                        />
                        <div style={styles.sliderLabels}>
                          <span>1</span>
                          <span>7</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={styles.sectionHeader}>REFLECTIONS</div>
                <div style={styles.groupBox}>
                  {['task_1','task_2','task_3','proud_of'].map(k => (
                    <div key={k} style={styles.cell}>
                      <div style={styles.itemLabel}>{labelFor(k)}</div>
                      <input
                        style={styles.textField}
                        value={form[k]}
                        onChange={e=>setField(k, e.target.value)}
                        placeholder="type reflection..."
                      />
                    </div>
                  ))}
                </div>

                {message && <p style={styles.message}>{message}</p>}

                <button style={{...styles.button, opacity: loading?0.7:1}} type="submit" disabled={loading || !canEdit}>
                  {existingRowNumber ? 'Update entry' : 'Submit entry'}
                </button>
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
  background: linear-gradient(to right, #007AFF var(--percent, 50%), #d1d1d6 var(--percent, 50%));
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
    background: '#f2f2f7',
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Arial, sans-serif',
  },
  card: {
    width: '100%',
    maxWidth: 700,
  },
  title: {
    fontSize: 34,
    fontWeight: 700,
    margin: '0 0 20px',
    color: '#111',
    letterSpacing: '-0.5px'
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
    background: '#fff',
    outline: 'none',
    fontSize: 14,
    transition: 'border-color 0.2s',
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: 600,
    color: '#6e6e73',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginTop: 10,
  },
  groupBox: {
    background: '#fff',
    borderRadius: 14,
    overflow: 'hidden',
    border: '1px solid #e5e5ea',
  },
  cell: {
    padding: '16px 18px',
    display:'flex',
    flexDirection:'column',
    gap: 10,
    borderBottom: '1px solid #e5e5ea',
  },
  itemLabel: { fontWeight: 600, fontSize: 15, color: '#111' },
  prompt: { fontSize: 13, opacity: 0.7, color: '#444', marginTop: 2 },
  sliderWrapper: { width: '100%', display: 'flex', flexDirection: 'column', gap: 6, marginTop: 6 },
  slider: { width: '100%', cursor: 'pointer' },
  sliderLabels: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 12,
    opacity: 0.6,
    color: '#444'
  },
  textField: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 10,
    border: '1px solid #d1d1d6',
    background: '#f9f9f9',
    outline: 'none',
    fontSize: 14,
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
