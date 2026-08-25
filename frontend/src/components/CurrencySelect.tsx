import { CURRENCIES } from '../lib/currencies'

interface CurrencySelectProps {
  label: string
  value: string
  onChange: (value: string) => void
}

export default function CurrencySelect({ label, value, onChange }: CurrencySelectProps) {
  return (
    <label className="field" style={{ flex: 1 }}>
      <span className="text-label">{label}</span>
      <select className="input" value={value} onChange={(e) => onChange(e.target.value)} required>
        {CURRENCIES.map((currency) => (
          <option key={currency.code} value={currency.code}>
            {currency.name}
          </option>
        ))}
      </select>
    </label>
  )
}
