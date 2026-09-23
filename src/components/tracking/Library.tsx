'use client'

import { useEffect, useState } from 'react'
import { store, useApp } from '@/lib/tracking/store'
import { loadFile, loadProject, saveProject, toast } from '@/lib/tracking/actions'
import { Corners } from '@/components/site/Viewfinder'

interface SavedProject {
  id: string
  name: string
  videoName: string
  duration: number | null
  createdAt: number
  data: Record<string, unknown>
}

/** Cloud library: save the current edit to Postgres, reopen it on any device. */
export function Library() {
  const video = useApp((s) => s.video)
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<SavedProject[]>([])
  const [busy, setBusy] = useState(false)
  const [drag, setDrag] = useState(false)

  const refresh = async () => {
    try {
      const res = await fetch('/api/projects', { cache: 'no-store' })
      if (res.ok) {
        const rows = (await res.json()) as SavedProject[]
        setItems(rows.sort((a, b) => b.createdAt - a.createdAt))
      }
    } catch {
      /* offline */
    }
  }

  useEffect(() => {
    if (open) void refresh()
  }, [open])

  const save = async () => {
    const st = store.get()
    if (!st.video) return toast('Load a video first')
    setBusy(true)
    const name = st.video.name.replace(/\.[^.]+$/, '')
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          videoName: st.video.name,
          duration: st.video.duration,
          data: {
            version: 1,
            videoName: st.video.name,
            videoWidth: st.video.width,
            videoHeight: st.video.height,
            videoFps: st.video.fps,
            videoDuration: st.video.duration,
            tracks: st.tracks,
            attachments: st.attachments,
            camera: st.camera,
            keys: st.keys,
            fx: st.fx,
            aspect: st.aspect,
            speedKeys: st.speedKeys,
            freezeFrames: st.freezeFrames,
            trimStart: st.trimStart,
            trimEnd: st.trimEnd,
            enhance: st.enhance,
            colorGrade: st.colorGrade,
          },
        }),
      })
      if (!res.ok) throw new Error(String(res.status))
      toast('Saved to your library')
      await refresh()
      setOpen(true)
    } catch {
      toast('Couldn’t save — check the connection')
    } finally {
      setBusy(false)
    }
  }

  const load = (p: SavedProject) => {
    if (!store.get().video) return toast('Load the source video first')
    const file = new File([JSON.stringify(p.data)], p.name + '.twm.json', { type: 'application/json' })
    loadProject(file)
    setOpen(false)
  }

  const remove = async (id: string) => {
    setItems((it) => it.filter((i) => i.id !== id))
    await fetch(`/api/projects?id=${encodeURIComponent(id)}`, { method: 'DELETE' }).catch(() => {})
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-1.5">
        <button onClick={save} disabled={!video || busy} className="tl-btn hidden sm:inline-flex">
          {busy ? 'Saving…' : 'Save'}
        </button>
        <button onClick={() => setOpen((o) => !o)} className="tl-btn" aria-expanded={open}>
          Library
          {items.length > 0 && <span className="font-mono text-[10.5px] text-white/45">{items.length}</span>}
        </button>
      </div>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-10 z-50 w-[330px] overflow-hidden rounded-[16px] bg-[#1c1c1e]/95 shadow-[0_24px_60px_rgba(0,0,0,0.6)] ring-1 ring-white/10 backdrop-blur-xl">
            <div className="flex items-center justify-between px-4 pb-2 pt-3.5">
              <span className="text-[15px] font-semibold">Library</span>
              <span className="text-[12px] text-white/40">{items.length} saved</span>
            </div>

            <label
              onDragOver={(e) => {
                e.preventDefault()
                setDrag(true)
              }}
              onDragLeave={() => setDrag(false)}
              onDrop={(e) => {
                e.preventDefault()
                setDrag(false)
                const f = e.dataTransfer.files?.[0]
                if (f) loadProject(f)
              }}
              className={`mx-3 mb-2 flex cursor-pointer items-center gap-3 rounded-[12px] px-3 py-2.5 text-[13px] transition-colors ${
                drag ? 'bg-lock/15 text-lock' : 'bg-white/[0.05] text-white/70 hover:bg-white/[0.08]'
              }`}
            >
              <input
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && loadProject(e.target.files[0])}
              />
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M8 2.5v8M4.5 7L8 10.5 11.5 7M3 13.5h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Open a .twm project file…
            </label>

            <div className="max-h-[300px] overflow-y-auto border-t border-white/[0.08]" data-lenis-prevent>
              {items.length === 0 ? (
                <div className="px-4 py-8 text-center text-[13px] text-white/35">Nothing saved yet</div>
              ) : (
                items.map((p, i) => (
                  <div key={p.id} className="group relative flex items-center gap-3 px-4 py-3">
                    {i > 0 && <span className="absolute left-4 right-0 top-0 h-px bg-white/[0.08]" />}
                    <button onClick={() => load(p)} className="min-w-0 flex-1 text-left">
                      <div className="truncate text-[14px] text-white/90">{p.name}</div>
                      <div className="truncate font-mono text-[10.5px] text-white/40">
                        {p.videoName} · {new Date(p.createdAt).toLocaleDateString()}
                      </div>
                    </button>
                    <button
                      onClick={() => remove(p.id)}
                      className="text-[12.5px] font-medium text-rec opacity-0 transition-opacity group-hover:opacity-100"
                      aria-label={`Delete ${p.name}`}
                    >
                      Delete
                    </button>
                  </div>
                ))
              )}
            </div>
            <button
              onClick={() => void saveProject()}
              className="w-full border-t border-white/[0.08] px-4 py-3 text-left text-[13px] font-medium text-lock hover:bg-white/[0.03]"
            >
              Download a .twm copy to this device
            </button>
          </div>
        </>
      )}
    </div>
  )
}

/** Empty studio: the viewfinder is on standby until a clip is dropped in. */
export function StudioStart() {
  const [drag, setDrag] = useState(false)
  const pick = (f?: File | null) => f && loadFile(f)

  return (
    <div className="flex min-h-0 flex-1 items-center justify-center overflow-y-auto p-4 sm:p-8">
      <label
        onDragOver={(e) => {
          e.preventDefault()
          setDrag(true)
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDrag(false)
          pick(e.dataTransfer.files?.[0])
        }}
        className={`relative flex min-h-[460px] w-full max-w-5xl cursor-pointer flex-col items-center justify-center overflow-hidden rounded-[28px] px-6 py-16 text-center ring-1 transition-colors duration-300 sm:aspect-video sm:min-h-0 ${
          drag ? 'bg-lock/[0.06] ring-lock' : 'bg-[#0c0c0d] ring-white/[0.08] hover:ring-white/20'
        }`}
      >
        <div className="thirds pointer-events-none absolute inset-0 opacity-80" />
        <Corners inset={18} />
        <div className="osd absolute left-7 top-7 flex items-center gap-2 text-white/50">
          <i className="inline-block h-2 w-2 rounded-full bg-white/30" />
          Standby
        </div>
        <div className="osd absolute right-7 top-7 text-white/35">No clip</div>

        <svg className="af-idle relative h-24 w-24 text-lock" viewBox="0 0 100 100" fill="none" aria-hidden="true">
          <rect x="1.5" y="1.5" width="97" height="97" rx="3" stroke="currentColor" strokeWidth="2" />
          <path d="M50 1.5v10M50 98.5v-10M1.5 50h10M98.5 50h-10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>

        <h1 className="relative mt-9 text-[clamp(1.9rem,4vw,3rem)] font-semibold tracking-[-0.045em]">
          Drop a clip to lock on.
        </h1>
        <p className="relative mt-3 max-w-md text-[15px] leading-relaxed text-white/50">
          MP4, MOV or WebM. It&apos;s decoded and analysed inside this tab — nothing is uploaded anywhere.
        </p>
        <span className="btn-lock relative mt-8">Choose a video</span>
        <input type="file" accept="video/*" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />

        <div className="osd absolute inset-x-0 bottom-7 hidden justify-center gap-6 text-white/35 sm:flex">
          <span>Space · Play</span>
          <span>← → · Step</span>
          <span>⇧ · ×10</span>
          <span>Esc · Exit</span>
        </div>
      </label>
    </div>
  )
}
