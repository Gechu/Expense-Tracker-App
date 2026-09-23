const numberFormat = new Intl.NumberFormat('pl-PL', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export function formatAmount(value: string | number): string {
  return numberFormat.format(Number(value))
}

/** Backend zwraca datę jako "YYYY-MM-DD" - tu tylko zamiana na "DD.MM.YYYY" */
export function formatDate(value: string): string {
  const [year, month, day] = value.split('-')
  if (!year || !month || !day) return value
  return `${day}.${month}.${year}`
}
