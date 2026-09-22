import { useState } from 'react'
import type { FormulaOperator, FormulaToken } from '../api/widgets'
import { evalFormula } from '../lib/evalFormula'
import { formatAmount } from '../lib/format'

const OPERATORS: FormulaOperator[] = ['+', '-', '*', '/', '(', ')']

export const OP_LABELS: Record<FormulaOperator, string> = {
  '+': '+',
  '-': '−',
  '*': '×',
  '/': '÷',
  '(': '(',
  ')': ')',
}

export interface ReferenceField {
  id: number
  label: string
  tabColor: string
  value: number
}

/** Czy token na końcu wyrażenia jest "otwarty", czyli wyrażenie wymaga jeszcze
   jakiejś wartości (pola/liczby/nawiasu), żeby mieć sens - np. zaraz po
   operatorze +, -, ×, ÷ albo po "(". Puste wyrażenie też jest w tym stanie. */
function expectsValue(tokens: FormulaToken[]): boolean {
  const last = tokens[tokens.length - 1]
  return !last || (last.kind === 'op' && last.value !== ')')
}

function openParenCount(tokens: FormulaToken[]): number {
  return tokens.reduce((count, t) => {
    if (t.kind === 'op' && t.value === '(') return count + 1
    if (t.kind === 'op' && t.value === ')') return count - 1
    return count
  }, 0)
}

/** Formułę można zapisać tylko wtedy, gdy nie kończy się w połowie działania
   (np. samym operatorem) i gdy wszystkie nawiasy są domknięte. Puste
   wyrażenie (wynik 0) jest dozwolone. */
export function isFormulaComplete(tokens: FormulaToken[]): boolean {
  return tokens.length === 0 || (!expectsValue(tokens) && openParenCount(tokens) === 0)
}

interface FormulaBuilderProps {
  tokens: FormulaToken[]
  onChange: (tokens: FormulaToken[]) => void
  referenceFields: ReferenceField[]
  /** kolor bieżącej zakładki - używany do pigułek pól i podglądu wyniku */
  color: string
}

export default function FormulaBuilder({ tokens, onChange, referenceFields, color }: FormulaBuilderProps) {
  const [numberDraft, setNumberDraft] = useState('')

  function pushToken(token: FormulaToken) {
    onChange([...tokens, token])
  }

  /** Pole/liczba wstawiane bez operatora między nimi są po prostu pomijane przy
     liczeniu (wyrażenie kończy się na pierwszej wartości) - więc jeśli poprzedni
     token to już gotowa wartość (pole, liczba albo zamykający nawias), dokładamy
     "+" automatycznie, żeby zawsze powstawało poprawne wyrażenie. */
  function pushValueToken(token: FormulaToken) {
    const last = tokens[tokens.length - 1]
    const needsPlus = last && (last.kind === 'field' || last.kind === 'number' || (last.kind === 'op' && last.value === ')'))
    onChange(needsPlus ? [...tokens, { kind: 'op', value: '+' }, token] : [...tokens, token])
  }

  function removeLast() {
    onChange(tokens.slice(0, -1))
  }

  function pushNumber() {
    if (numberDraft.trim().length === 0) return
    const value = Number(numberDraft)
    if (!Number.isFinite(value)) return
    pushValueToken({ kind: 'number', value })
    setNumberDraft('')
  }

  const needsValue = expectsValue(tokens)
  const openParens = openParenCount(tokens)

  /** Czy dany przycisk operatora ma teraz sens gramatyczny:
     - × ÷ zawsze potrzebują czegoś z lewej strony (nie mają wersji jednoargumentowej)
     - ) zamyka nawias tylko wtedy, gdy jest coś do zamknięcia i wyrażenie w środku się skończyło
     - + jako jednoargumentowy plus niczego nie zmienia ("+5" = "5"), więc ma sens
       tylko jako dodawanie - czyli gdy po lewej jest już jakaś wartość
     - − jako jednoargumentowy minus (negacja) ma sens, ale nie pozwalamy go
       stackować pod rząd ("− −") - po jednym znaku wymagamy już konkretnej wartości
     - ( jest sensowne zawsze - w razie potrzeby dostawiamy przed nim "+" */
  function canUseOperator(op: FormulaOperator): boolean {
    if (op === ')') return !needsValue && openParens > 0
    if (op === '*' || op === '/') return !needsValue
    if (op === '+') return !needsValue
    if (op === '-') {
      if (!needsValue) return true
      const last = tokens[tokens.length - 1]
      return !(last && last.kind === 'op' && last.value === '-')
    }
    return true // '('
  }

  function pushOperator(op: FormulaOperator) {
    if (op === '(' && !needsValue) {
      // "(" zaraz po gotowej wartości - jak z polem/liczbą, dostawiamy "+" przed nim
      onChange([...tokens, { kind: 'op', value: '+' }, { kind: 'op', value: '(' }])
      return
    }
    pushToken({ kind: 'op', value: op })
  }

  const valueLookup = new Map(referenceFields.map((f) => [f.id, f.value]))
  const preview = evalFormula(tokens, (id) => valueLookup.get(id) ?? 0)

  return (
    <div className="builder-box">
      <div className="builder-header">
        <span className="text-label">Formuła</span>
        <div style={{ display: 'flex', gap: 6 }}>
          <button type="button" className="mini-btn" onClick={removeLast} aria-label="Cofnij ostatni token">
            ⌫
          </button>
          <button type="button" className="mini-btn" onClick={() => onChange([])}>
            wyczyść
          </button>
        </div>
      </div>

      <div className="formula-strip">
        {tokens.map((token, index) => {
          if (token.kind === 'field') {
            const field = referenceFields.find((f) => f.id === token.widget_id)
            // Kolor pigułki bierze się z zakładki, do której faktycznie należy
            // pole (field.tabColor), a nie z bieżącej zakładki (color) - żeby
            // było widać, skąd formuła czerpie dane (patrz field-picker niżej,
            // gdzie kropki już tak działają).
            const fieldColor = field?.tabColor ?? color
            return (
              <span
                key={index}
                className="token-field"
                style={{ border: `1px solid ${fieldColor}3a`, background: `${fieldColor}20` }}
              >
                {field?.label ?? 'usunięte pole'}
              </span>
            )
          }
          if (token.kind === 'number') {
            return (
              <span key={index} className="token-number">
                {token.value}
              </span>
            )
          }
          return (
            <span key={index} className="token-op">
              {OP_LABELS[token.value]}
            </span>
          )
        })}
        {tokens.length === 0 && (
          <span className="text-meta">Wybierz pola i operatory - wynik liczy się na żywo.</span>
        )}
      </div>

      <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginTop: 12 }}>
        {OPERATORS.map((op) => (
          <button
            key={op}
            type="button"
            className="op-btn"
            onClick={() => pushOperator(op)}
            disabled={!canUseOperator(op)}
          >
            {OP_LABELS[op]}
          </button>
        ))}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginLeft: 'auto' }}>
          <input
            type="text"
            inputMode="decimal"
            className="input"
            style={{ width: 92, padding: '7px 9px', fontSize: 12.5, borderRadius: 9 }}
            value={numberDraft}
            onChange={(e) => setNumberDraft(e.target.value)}
            placeholder="liczba"
          />
          <button type="button" className="mini-btn" onClick={pushNumber}>
            dodaj
          </button>
        </div>
      </div>

      <div style={{ marginTop: 14 }}>
        <span className="text-meta">Pola, do których możesz się odwołać</span>
        <div className="field-picker">
          {referenceFields.map((field) => (
            <button
              key={field.id}
              type="button"
              className="field-picker-row"
              onClick={() => pushValueToken({ kind: 'field', widget_id: field.id })}
            >
              <span className="tab-dot" style={{ background: field.tabColor, width: 6, height: 6 }} />
              <span className="field-picker-name">{field.label}</span>
              <span className="field-picker-value">{formatAmount(field.value)}</span>
            </button>
          ))}
          {referenceFields.length === 0 && <span className="text-meta">Brak innych pól do wyboru.</span>}
        </div>
      </div>

      <div className="builder-preview-row">
        <span className="text-meta">Wynik</span>
        <span className="builder-preview-value" style={{ color }}>
          {formatAmount(preview)}
        </span>
      </div>
    </div>
  )
}
