import { useRef } from 'react'

interface AmountInputProps {
  value: string
  onChange: (value: string) => void
  required?: boolean
  autoFocus?: boolean
  placeholder?: string
}

/* Klawiatura numeryczna na telefonach (iOS, część Androidów) nie ma minusa,
   więc zamiast type="number" jest zwykłe pole tekstowe z inputMode="decimal"
   plus przycisk +/- w polu. Przecinek zamieniamy na kropkę (polska
   klawiatura dziesiętna wstawia przecinek), a reszta znaków jest odrzucana. */
function sanitize(raw: string): string {
  const cleaned = raw.replace(/,/g, '.').replace(/[^\d.-]/g, '')
  const negative = cleaned.startsWith('-')
  const [integer, ...fraction] = cleaned.replace(/-/g, '').split('.')
  return (negative ? '-' : '') + integer + (fraction.length ? '.' + fraction.join('') : '')
}

export default function AmountInput({ value, onChange, required, autoFocus, placeholder = '0.00' }: AmountInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  function toggleSign() {
    onChange(value.startsWith('-') ? value.slice(1) : `-${value}`)
    // Bez tego dotknięcie przycisku zamyka klawiaturę na telefonie
    inputRef.current?.focus()
  }

  return (
    <div className="amount-wrap">
      <input
        ref={inputRef}
        type="text"
        inputMode="decimal"
        className="input"
        value={value}
        onChange={(e) => onChange(sanitize(e.target.value))}
        placeholder={placeholder}
        pattern="-?\d+(\.\d{1,2})?"
        title="Kwota, np. 12.50 lub -12.50 (maks. 2 miejsca po przecinku)"
        required={required}
        autoFocus={autoFocus}
      />
      <button type="button" className="amount-sign-btn" onClick={toggleSign} aria-label="Zmień znak kwoty (plus/minus)">
        +/−
      </button>
    </div>
  )
}
