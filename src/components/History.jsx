import React, { useEffect, useState } from 'react'
import { listEntries } from '../api'

export default function History() {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [limit, setLimit] = useState(60)

  useEffect(() => {
    (async () => {
      try {
        setLoading(true)
        const json = await listEntries(limit)
        if (json.ok) setEntries(json.entries || [])
        else setError(json.error || 'Failed to load history.')
      } catch (e) {
        setError(String(e))
      } finally {
        setLoading(false)
      }
    })()
  }, [limit])

  return (
    <div style={{ display:'grid', gap: 12 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:8 }}>
        <h2 style={{ margin: 0 }}>Past Entries (read‑only)</h2>
        <label style={{ fontSize: 14 }}>
          Show last&nbsp;
          <select value={limit} onChange={e=>setLimit(Number(e.target.value))}>
            {[15,30,60,120,365].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
          &nbsp;days
        </label>
      </div>

      {loading ? <p>Loading…</p> : error ? <p style={{color:'#A62222'}}>{error}</p> : (
        <div style={{ overflowX:'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Emo</th>
                <th>Phys</th>
                <th>Social</th>
                <th>Accomp</th>
                <th>Growth</th>
                <th>Align</th>
                <th>Task 1</th>
                <th>Task 2</th>
                <th>Task 3</th>
                <th>Proud Of</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e, i) => (
                <tr key={i}>
                  <td><strong>{e.date}</strong></td>
                  <td>{e.emotional_state}</td>
                  <td>{e.physical_state}</td>
                  <td>{e.social_connectedness}</td>
                  <td>{e.accomplishment}</td>
                  <td>{e.growth}</td>
                  <td>{e.alignment}</td>
                  <td style={{whiteSpace:'pre-wrap'}}>{e.task_1}</td>
                  <td style={{whiteSpace:'pre-wrap'}}>{e.task_2}</td>
                  <td style={{whiteSpace:'pre-wrap'}}>{e.task_3}</td>
                  <td style={{whiteSpace:'pre-wrap'}}>{e.proud_of}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
