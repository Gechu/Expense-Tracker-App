import { Cat, Coffee, Heart, Moon, Rocket, Smile, Star, Sun, Zap, type LucideIcon } from 'lucide-react'

/** Odgórnie ustalona lista "kształtów" awatara - żadnego uploadu zdjęcia
   (brak infrastruktury na pliki), tylko gotowe ikony z lucide-react (już
   w projekcie). `avatar_icon: null` = domyślna litera-inicjał, nie wymaga
   wpisu tutaj - to jest 10. "kształt", zawsze dostępny. */
export const AVATAR_ICONS: Record<string, LucideIcon> = {
  star: Star,
  heart: Heart,
  sun: Sun,
  moon: Moon,
  zap: Zap,
  coffee: Coffee,
  cat: Cat,
  rocket: Rocket,
  smile: Smile,
}

export type AvatarIconKey = keyof typeof AVATAR_ICONS
