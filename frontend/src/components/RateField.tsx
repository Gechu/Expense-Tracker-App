import { RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { getFxRate } from '../api/fx'

interface RateFieldProps {
  rate: string
  onChange: (rate: string) => void
  fromCurrency: string
  toCurrency: string
}

export default function RateField({ rate, onChange, fromCurrency, toCurrency }: RateFieldProps) {
  const [fetching, setFetching] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function fetchRate() {
    setFetching(true)
    setError(null)
    try {
      const { rate: fetched } = await getFxRate(fromCurrency, toCurrency)
      onChange(String(fetched))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nie udało się pobrać kursu')
    } finally {
      setFetching(false)
    }
  }

  return (
    <label className="field" style={{ flex: 1 }}>
      <span className="text-label">Kurs</span>
      <div style={{ display: 'flex', gap: 6 }}>
        <input
          type="number"
          step="0.0001"
          className="input"
          value={rate}
          onChange={(e) => onChange(e.target.value)}
          placeholder="np. 4.20"
          required
        />
        <button
          type="button"
          className="field-icon-btn"
          style={{ width: 38, height: 38, flex: 'none' }}
          onClick={fetchRate}
          disabled={fetching || fromCurrency === toCurrency}
          aria-label="Pobierz aktualny kurs"
          title="Pobierz aktualny kurs"
        >
          <RefreshCw size={14} className={fetching ? 'spin' : undefined} />
        </button>
      </div>
      {error && <span style={{ display: 'block', marginTop: 4, color: '#e5484d', fontSize: 11.5 }}>{error}</span>}
    </label>
  )
}
