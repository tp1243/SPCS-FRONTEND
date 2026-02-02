import { useEffect, useState } from 'react'
import { Bar } from 'react-chartjs-2'
import { Chart, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js'
import { policeApi } from '../../services/police'

Chart.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

type Props = { token: string }

export default function PoliceReports({ token }: Props) {
  const [data, setData] = useState<{ pending: number; inProgress: number; solved: number }>({ pending: 0, inProgress: 0, solved: 0 })
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    policeApi.listComplaints(token, { fields: 'summary', limit: 200 }).then((res) => {
      const stats = res.complaints.reduce((acc: any, c: any) => {
        acc[c.status] = (acc[c.status] || 0) + 1
        return acc
      }, {})
      setData({ pending: stats['Pending'] || 0, inProgress: (stats['In Progress'] || 0) + (stats['Under Review'] || 0), solved: stats['Solved'] || 0 })
    }).catch((err) => setError(err.message || 'Failed to load analytics'))
  }, [token])

  const chartData = {
    labels: ['Pending', 'In Progress', 'Solved'],
    datasets: [{ label: 'Count', data: [data.pending, data.inProgress, data.solved], backgroundColor: ['#f59e0b','#3b82f6','#10b981'] }],
  }

  function exportCsv() {
    const rows = [['Status','Count'], ['Pending', String(data.pending)], ['In Progress', String(data.inProgress)], ['Solved', String(data.solved)]]
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'report.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  function exportPdf() {
    import('jspdf').then(({ default: jsPDF }) => {
      const doc = new jsPDF()
      doc.text('Complaints Report', 20, 20)
      doc.text(`Pending: ${data.pending}`, 20, 40)
      doc.text(`In Progress: ${data.inProgress}`, 20, 50)
      doc.text(`Solved: ${data.solved}`, 20, 60)
      doc.save('report.pdf')
    })
  }

  return (
    <div className="panel">
      <div className="label">Reports & Analytics</div>
      {error && <div className="form-error">{error}</div>}
      <div className="card" style={{ padding: 12 }}>
        <Bar data={chartData} options={{ plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }} />
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
        <button className="btn" onClick={exportCsv}>Export CSV</button>
        <button className="btn ghost" onClick={exportPdf}>Download PDF</button>
      </div>
      <div className="muted" style={{ marginTop: 8 }}>AI insights will be added later, e.g., “This week, cybercrime increased by 12%”.</div>
    </div>
  )
}