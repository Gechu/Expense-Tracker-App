import { useState } from 'react'
import { updateMe, type User } from '../api/auth'
import { AVATAR_ICONS } from '../lib/avatarIcons'
import { PALETTE } from '../lib/palette'
import Avatar from './Avatar'

interface AvatarPickerProps {
  user: User
  onSaved: (user: User) => void
}

/** Wybór koloru tła + "kształtu" (litera-inicjał albo jedna z gotowych ikon)
   - bez uploadu zdjęcia, żeby nie potrzebować żadnego magazynu plików.
   Draft trzymany lokalnie, commit dopiero na "Zapisz" - ten sam wzorzec co
   TabModal. */
export default function AvatarPicker({ user, onSaved }: AvatarPickerProps) {
  const [color, setColor] = useState(user.avatar_color ?? PALETTE[0])
  const [icon, setIcon] = useState<string | null>(user.avatar_icon)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const previewUser: User = { ...user, avatar_color: color, avatar_icon: icon }

  async function handleSave() {
    setError(null)
    setBusy(true)
    try {
      const updated = await updateMe({ avatar_color: color, avatar_icon: icon })
      onSaved(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nie udało się zapisać awatara')
      setBusy(false)
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}>
        <Avatar user={previewUser} size={48} />
      </div>

      <span className="text-label">Kolor</span>
      <div className="swatch-row">
        {PALETTE.map((c) => (
          <button
            key={c}
            type="button"
            className="swatch"
            style={{
              background: color === c ? c : `${c}2e`,
              borderColor: color === c ? c : `${c}44`,
              boxShadow: color === c ? `0 0 0 3px ${c}2a` : 'none',
            }}
            onClick={() => setColor(c)}
            aria-label={`Wybierz kolor ${c}`}
          />
        ))}
      </div>

      <span className="text-label" style={{ display: 'block', marginTop: 20 }}>
        Kształt
      </span>
      <div className="avatar-shape-row">
        <button
          type="button"
          className={`avatar-shape ${icon === null ? 'is-active' : ''}`}
          onClick={() => setIcon(null)}
          aria-label="Litera"
        >
          {(user.name || user.email).charAt(0).toUpperCase()}
        </button>
        {Object.entries(AVATAR_ICONS).map(([key, Icon]) => (
          <button
            key={key}
            type="button"
            className={`avatar-shape ${icon === key ? 'is-active' : ''}`}
            onClick={() => setIcon(key)}
            aria-label={key}
          >
            <Icon size={17} />
          </button>
        ))}
      </div>

      {error && (
        <span style={{ display: 'block', marginTop: 14, color: '#e5484d', fontSize: 13 }}>{error}</span>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 18 }}>
        <button type="button" className="btn-cta" style={{ width: 'auto', padding: '9px 15px' }} onClick={handleSave} disabled={busy}>
          Zapisz
        </button>
      </div>
    </div>
  )
}
