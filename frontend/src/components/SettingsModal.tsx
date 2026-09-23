import { ChevronRight, Download, Upload, X } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { updateMe, type User } from '../api/auth'
import Avatar from './Avatar'
import AvatarPicker from './AvatarPicker'
import { CURRENCIES } from '../lib/currencies'
import { getInitialTheme } from '../styles/theme'

interface SettingsModalProps {
  user: User
  onUserChanged: (user: User) => void
  onClose: () => void
}

interface SettingsRowProps {
  label: string
  description: string
  danger?: boolean
  /** Czy działanie jest już podpięte pod ten wiersz - dopóki false (domyślnie),
     wiersz dostaje etykietkę "jeszcze nie zrobione". Tylko do orientacji
     w trakcie budowania, nie dla końcowego użytkownika. */
  done?: boolean
  /** Kontrolka wprost w wierszu (input/select/przełącznik/ikona akcji/popover-
     -trigger) - gdy podana, wiersz to zwykły <div> (kontrolka jest własnym,
     niezależnym elementem, np. polem tekstowym - stąd nie może siedzieć
     wewnątrz jednego dużego <button>, tak jak wiersze poniżej). */
  control?: ReactNode
  /** Wiersze BEZ kontrolki - cały wiersz to przycisk otwierający coś osobno
     (na razie: docelowo mały modal, np. zmiana hasła). */
  onClick?: () => void
}

function SettingsRow({ label, description, danger, done = false, control, onClick }: SettingsRowProps) {
  const text = (
    <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0, flex: 1 }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span className="settings-row-label">{label}</span>
        {!done && <span className="settings-row-todo">jeszcze nie zrobione</span>}
      </span>
      <span className="settings-row-desc">{description}</span>
    </span>
  )

  if (control) {
    return (
      <div className={`settings-row settings-row--static ${danger ? 'settings-row--danger' : ''}`}>
        {text}
        <span className="settings-row-control">{control}</span>
      </div>
    )
  }

  return (
    <button type="button" className={`settings-row ${danger ? 'settings-row--danger' : ''}`} onClick={onClick}>
      {text}
      <ChevronRight size={16} className="settings-row-chevron" />
    </button>
  )
}

function SettingsSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="settings-section">
      <h3 className="settings-section-title">{title}</h3>
      <div className="settings-list">{children}</div>
    </div>
  )
}

/** Mały klikalny podgląd awatara wprost w wierszu - otwiera popover z pełnym
   AvatarPicker zamiast rozpychać listę (odrzucony wcześniej akordeon) albo
   podmieniać całe okno (odrzucony wcześniej "widok szczegółowy"). Zamyka się
   po zapisie albo kliknięciu poza sobą. */
function AvatarRowControl({ user, onSaved }: { user: User; onSaved: (user: User) => void }) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleClickOutside(event: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <button type="button" className="settings-avatar-trigger" onClick={() => setOpen((o) => !o)} aria-label="Zmień awatar">
        <Avatar user={user} size={30} />
      </button>
      {open && (
        <div className="settings-popover" onClick={(e) => e.stopPropagation()}>
          <AvatarPicker
            user={user}
            onSaved={(updated) => {
              onSaved(updated)
              setOpen(false)
            }}
          />
        </div>
      )}
    </div>
  )
}

/** Pole tekstowe wprost w wierszu - zapisuje się samo przy utracie fokusu,
   bez osobnego przycisku "Zapisz" (za mało tu do tego, żeby uzasadnić
   osobny formularz). */
function NameRowControl({ user, onSaved }: { user: User; onSaved: (user: User) => void }) {
  const [name, setName] = useState(user.name ?? '')
  const [busy, setBusy] = useState(false)

  async function commit() {
    const trimmed = name.trim()
    if (trimmed === (user.name ?? '')) return
    setBusy(true)
    try {
      const updated = await updateMe({ name: trimmed || null })
      onSaved(updated)
    } catch {
      setName(user.name ?? '')
    } finally {
      setBusy(false)
    }
  }

  return (
    <input
      type="text"
      className="settings-inline-input"
      value={name}
      onChange={(e) => setName(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
      }}
      placeholder="np. Kamil"
      disabled={busy}
    />
  )
}

/** Makieta - wizualnie prawdziwy przełącznik motywu, ale jeszcze nie
   podpięty pod realne jasny/ciemny (patrz ThemeToggle.tsx, który to już
   robi naprawdę w sidebarze). Do wdrożenia osobno. */
function ThemeRowMock() {
  const [value, setValue] = useState(getInitialTheme)
  return (
    <div className="settings-segment">
      <button type="button" className={`settings-segment-btn ${value === 'light' ? 'is-active' : ''}`} onClick={() => setValue('light')}>
        Jasny
      </button>
      <button type="button" className={`settings-segment-btn ${value === 'dark' ? 'is-active' : ''}`} onClick={() => setValue('dark')}>
        Ciemny
      </button>
    </div>
  )
}

/** Makieta - select z prawdziwą listą walut, ale wybór jeszcze nigdzie się
   nie zapisuje. */
function CurrencyRowMock() {
  const [value, setValue] = useState('PLN')
  return (
    <select className="settings-inline-input" value={value} onChange={(e) => setValue(e.target.value)}>
      {CURRENCIES.map((c) => (
        <option key={c.code} value={c.code}>
          {c.code}
        </option>
      ))}
    </select>
  )
}

/** Okno ustawień - otwierane kliknięciem w kafelek konta w sidebarze.
 * Na desktopie nakładka na środku ekranu (jak reszta modali), na mobile
 * pełny ekran (patrz .settings-modal w theme.css). Lista pogrupowana w
 * sekcje (wzorzec "Ustawień" iOS/Windows). Mechanizm dopasowany DO
 * KONKRETNEGO ustawienia, nie jeden uniwersalny na wszystko (próbowaliśmy
 * kolejno: podmiana całego okna, potem akordeon - oba odrzucone):
 * - proste pojedyncze wartości (imię, motyw, waluta) -> kontrolka wprost
 *   w wierszu, bez żadnego "otwierania";
 * - awatar (za duży wybór na wiersz) -> mały popover przy kliknięciu;
 * - eksport/import -> to akcja (ikona), nie ustawienie do skonfigurowania;
 * - zmiana hasła/e-maila/usunięcie konta -> docelowo osobny, mały modal
 *   (jak TabModal/EntryModal), bo to wielopolowe formularze/potwierdzenia. */
export default function SettingsModal({ user, onUserChanged, onClose }: SettingsModalProps) {
  return (
    <div className="scrim scrim--settings" onClick={onClose}>
      <div className="modal settings-modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Ustawienia</h2>
          <button type="button" className="close-btn" onClick={onClose} aria-label="Zamknij">
            <X size={14} />
          </button>
        </div>

        <div className="modal-body settings-body">
          <SettingsSection title="Profil">
            <SettingsRow
              label="Awatar"
              description="Kolor kwadracika z inicjałem"
              done
              control={<AvatarRowControl user={user} onSaved={onUserChanged} />}
            />
            <SettingsRow
              label="Imię"
              description="Wyświetlane zamiast samego adresu e-mail"
              done
              control={<NameRowControl user={user} onSaved={onUserChanged} />}
            />
          </SettingsSection>

          <SettingsSection title="Konto">
            <SettingsRow label="Zmień hasło" description="Ustaw nowe hasło do logowania" />
            <SettingsRow label="Zmień adres e-mail" description="Zmień adres używany do logowania" />
            <SettingsRow label="Usuń konto" description="Trwale usuwa konto i wszystkie dane" danger />
          </SettingsSection>

          <SettingsSection title="Aplikacja">
            <SettingsRow
              label="Motyw"
              description="Jasny albo ciemny - to samo co przełącznik w sidebarze"
              control={<ThemeRowMock />}
            />
            <SettingsRow label="O aplikacji" description="Wersja i informacje o Ledgerze" control={<span className="text-meta">v0.1.0</span>} />
          </SettingsSection>

          <SettingsSection title="Dane">
            <SettingsRow
              label="Eksportuj dane (JSON)"
              description="Pełna kopia zakładek i pól - można ją później zaimportować"
              control={
                <button type="button" className="field-icon-btn" aria-label="Eksportuj do JSON">
                  <Download size={13} />
                </button>
              }
            />
            <SettingsRow
              label="Eksportuj do CSV"
              description="Czytelny plik do otwarcia w Excelu albo Arkuszach Google"
              control={
                <button type="button" className="field-icon-btn" aria-label="Eksportuj do CSV">
                  <Download size={13} />
                </button>
              }
            />
            <SettingsRow
              label="Importuj dane"
              description="Wczytaj wcześniej wyeksportowany plik JSON"
              control={
                <button type="button" className="field-icon-btn" aria-label="Importuj dane">
                  <Upload size={13} />
                </button>
              }
            />
          </SettingsSection>

          <SettingsSection title="Waluta">
            <SettingsRow
              label="Domyślna waluta"
              description="Waluta docelowa proponowana przy nowym polu walutowym"
              control={<CurrencyRowMock />}
            />
          </SettingsSection>
        </div>
      </div>
    </div>
  )
}
