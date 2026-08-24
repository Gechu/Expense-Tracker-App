import { Plus, X } from 'lucide-react'
import type { FormulaTerm } from '../api/widgets'

export interface ReferenceOption {
  id: number
  label: string
  tabName: string
}

interface FormulaTermsFieldProps {
  /** widget_id puste ('') dopóki użytkownik nie wybierze pola */
  terms: { widgetId: number | ''; sign: '+' | '-' }[]
  onChange: (terms: { widgetId: number | ''; sign: '+' | '-' }[]) => void
  options: ReferenceOption[]
}

export function termsToConfig(terms: { widgetId: number | ''; sign: '+' | '-' }[]): FormulaTerm[] {
  return terms.filter((t): t is { widgetId: number; sign: '+' | '-' } => t.widgetId !== '').map((t) => ({
    widget_id: t.widgetId,
    sign: t.sign,
  }))
}

export default function FormulaTermsField({ terms, onChange, options }: FormulaTermsFieldProps) {
  function updateTerm(index: number, patch: Partial<{ widgetId: number | ''; sign: '+' | '-' }>) {
    onChange(terms.map((t, i) => (i === index ? { ...t, ...patch } : t)))
  }

  function removeTerm(index: number) {
    onChange(terms.filter((_, i) => i !== index))
  }

  function addTerm() {
    onChange([...terms, { widgetId: '', sign: '+' }])
  }

  return (
    <div style={{ marginTop: 16 }}>
      <span className="text-label">Składniki</span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 9 }}>
        {terms.map((term, index) => (
          <div key={index} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <button
              type="button"
              className="btn-ghost"
              style={{ flex: 'none', padding: '10px 13px' }}
              onClick={() => updateTerm(index, { sign: term.sign === '+' ? '-' : '+' })}
              aria-label="Przełącz znak"
            >
              {term.sign}
            </button>
            <select
              className="input"
              style={{ flex: 1 }}
              value={term.widgetId}
              onChange={(e) => updateTerm(index, { widgetId: e.target.value ? Number(e.target.value) : '' })}
            >
              <option value="">Wybierz pole…</option>
              {options.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.tabName} — {option.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="field-icon-btn"
              onClick={() => removeTerm(index)}
              aria-label="Usuń składnik"
            >
              <X size={12} />
            </button>
          </div>
        ))}
      </div>
      <button type="button" className="add-entry-btn" style={{ marginTop: 8 }} onClick={addTerm}>
        <Plus size={12} />
        <span>Dodaj składnik</span>
      </button>
    </div>
  )
}
