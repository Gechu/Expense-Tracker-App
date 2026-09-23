import type { User } from '../api/auth'
import { AVATAR_ICONS } from '../lib/avatarIcons'

interface AvatarProps {
  user: User
  /** Domyślnie tak jak dotychczasowy kwadracik w Sidebarze (30px) */
  size?: number
}

/** Kwadracik z inicjałem albo wybraną ikoną - używany wszędzie, gdzie
   pokazujemy tożsamość użytkownika. Bez ustawionego avatar_color/avatar_icon
   wygląda dokładnie jak dotychczasowy, sztywny gradientowy kwadracik. */
export default function Avatar({ user, size = 30 }: AvatarProps) {
  const Icon = user.avatar_icon ? AVATAR_ICONS[user.avatar_icon] : undefined
  const initial = (user.name || user.email).charAt(0).toUpperCase()

  return (
    <span
      className="avatar"
      style={{
        width: size,
        height: size,
        background: user.avatar_color ?? undefined,
        fontSize: size * 0.42,
      }}
    >
      {Icon ? <Icon size={size * 0.55} /> : initial}
    </span>
  )
}
