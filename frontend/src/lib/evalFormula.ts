import type { FormulaToken } from '../api/widgets'

/** Odpowiednik silnika liczącego z backendu (app/service.py), tylko do podglądu
   na żywo w edytorze formuły - żeby nie odpytywać API przy każdym kliknięciu.
   Backend i tak liczy wynik od nowa przy każdym odczycie, to tu jest tylko podgląd. */
export function evalFormula(tokens: FormulaToken[], valueOf: (widgetId: number) => number): number {
  let pos = 0
  const peek = () => (pos < tokens.length ? tokens[pos] : null)
  const consume = () => tokens[pos++]

  function factor(): number {
    const tok = peek()
    if (!tok) return 0

    if (tok.kind === 'op' && tok.value === '(') {
      consume()
      const value = expr()
      const next = peek()
      if (next && next.kind === 'op' && next.value === ')') consume()
      return value
    }
    if (tok.kind === 'op' && tok.value === '-') {
      consume()
      return -factor()
    }
    if (tok.kind === 'op' && tok.value === '+') {
      consume()
      return factor()
    }
    if (tok.kind === 'number') {
      consume()
      return tok.value
    }
    if (tok.kind === 'field') {
      consume()
      return valueOf(tok.widget_id)
    }
    consume()
    return 0
  }

  function term(): number {
    let value = factor()
    for (;;) {
      const tok = peek()
      if (tok && tok.kind === 'op' && (tok.value === '*' || tok.value === '/')) {
        consume()
        const right = factor()
        value = tok.value === '*' ? value * right : right === 0 ? 0 : value / right
      } else {
        break
      }
    }
    return value
  }

  function expr(): number {
    let value = term()
    for (;;) {
      const tok = peek()
      if (tok && tok.kind === 'op' && (tok.value === '+' || tok.value === '-')) {
        consume()
        const right = term()
        value = tok.value === '+' ? value + right : value - right
      } else {
        break
      }
    }
    return value
  }

  const result = expr()
  return Number.isFinite(result) ? result : 0
}
