import { toast as sonnerToast } from 'sonner'
import { playSound } from '@/lib/sound-engine'
import { error003Sound } from '@/lib/error-003'

function playErrorSound() {
  playSound(error003Sound.dataUri).catch(() => {})
}

export const toast: typeof sonnerToast = new Proxy(sonnerToast, {
  get(target, prop) {
    if (prop === 'error') {
      return (...args: Parameters<typeof sonnerToast.error>) => {
        playErrorSound()
        return sonnerToast.error(...args)
      }
    }
    const value = (target as any)[prop]
    return typeof value === 'function' ? value.bind(target) : value
  },
})
