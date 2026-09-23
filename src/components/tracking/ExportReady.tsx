'use client'

import { useEffect, useState } from 'react'
import { Icon } from './Icons'

/** A short, deliberate "render finished" beat before the download settles in. */
export function ExportReady({ onComplete }: { onComplete: () => void }) {
  const [p, setP] = useState(0)
  useEffect(() => {
    const started = performance.now()
    let raf = 0
    const tick = () => {
      const t = Math.min(1, (performance.now() - started) / 900)
      setP(t)
      if (t < 1) raf = requestAnimationFrame(tick)
      else onComplete()
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [onComplete])

  return (
    <div className="flex items-center gap-3 rounded-[14px] bg-white/[0.05] px-4 py-3">
      <span className="grid h-7 w-7 place-items-center rounded-full bg-lock text-black">
        <Icon name="check" size={14} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[13px] font-medium text-white/85">Preparing your download</div>
        <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-lock transition-[width] duration-75" style={{ width: `${p * 100}%` }} />
        </div>
      </div>
    </div>
  )
}
