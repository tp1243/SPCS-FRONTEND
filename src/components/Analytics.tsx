import { useEffect, useState } from 'react'
import { Line, Bar } from 'react-chartjs-2'
import { Chart, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend } from 'chart.js'
import { complaintsApi } from '../services/complaints'

Chart.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend)

type Props = { token: string; refreshSignal?: number }

export default function Analytics({ token, refreshSignal }: Props) {
  const [monthly, setMonthly] = useState<number[]>(Array(12).fill(0))
  const [solvedRate, setSolvedRate] = useState<number[]>(Array(12).fill(0))

  useEffect(() => {
    let active = true
    complaintsApi.listMine(token).then(res => {
      if (!active) return
      const byMonth = Array(12).fill(0)
      const solvedByMonth = Array(12).fill(0)
      res.complaints.forEach(c => {
        const d = new Date(c.createdAt || Date.now())
        const m = d.getMonth()
        byMonth[m]++
        if (c.status === 'Solved') solvedByMonth[m]++
      })
      setMonthly(byMonth)
      const rates = byMonth.map((v, i) => v ? Math.round((solvedByMonth[i] / v) * 100) : 0)
      setSolvedRate(rates)
    }).catch(() => {})
    return () => { active = false }
  }, [token, refreshSignal])

  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

  return (
    <div className="panel">
      <h3>Analytics</h3>
      <div className="grid two">
        <div>
          <Bar data={{
            labels: months,
            datasets: [{ label: 'Complaints (Monthly)', data: monthly, backgroundColor: 'rgba(14,165,233,0.5)' }],
          }} options={{ plugins: { legend: { display: false } } }} />
        </div>
        <div>
          <Line data={{
            labels: months,
            datasets: [{ label: 'Resolution Rate (%)', data: solvedRate, borderColor: '#34d399', backgroundColor: 'rgba(34,197,94,0.2)' }],
          }} options={{ scales: { y: { min: 0, max: 100 } } }} />
        </div>
      </div>
      <div style={{ marginTop: 12 }}>
        <button className="btn ghost" onClick={() => exportAnalyticsPdf(months, monthly, solvedRate)}>Download Analytics PDF</button>
      </div>
    </div>
  )
}

function exportAnalyticsPdf(months: string[], monthly: number[], solvedRate: number[]) {
  import('jspdf').then(({ default: jsPDF }) => {
    const doc = new jsPDF()
    doc.setFontSize(16)
    doc.text('Analytics Summary', 14, 20)
    doc.setFontSize(12)
    let y = 30
    doc.text('Monthly Complaints:', 14, y); y += 8
    months.forEach((m, i) => { doc.text(`${m}: ${monthly[i]}`, 18, y); y += 6 })
    y += 6
    doc.text('Resolution Rate (%):', 14, y); y += 8
    months.forEach((m, i) => { doc.text(`${m}: ${solvedRate[i]}%`, 18, y); y += 6 })
    doc.save('analytics-summary.pdf')
  })
}