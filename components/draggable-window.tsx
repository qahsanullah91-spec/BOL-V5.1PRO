"use client"

import React, { useEffect, useRef, useState } from "react"

type WindowState = {
  x: number
  y: number
  width: number
  height: number
  hidden?: boolean
}

const STORAGE_KEY = "sky-finder-window-state"

export default function DraggableWindow({ children }: { children: React.ReactNode }) {
  const elRef = useRef<HTMLDivElement | null>(null)
  const headerRef = useRef<HTMLDivElement | null>(null)
  const resizeRef = useRef<HTMLDivElement | null>(null)
  const dragging = useRef(false)
  const resizing = useRef(false)
  const origin = useRef({ x: 0, y: 0, w: 0, h: 0 })

  const [state, setState] = useState<WindowState>(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (raw) return JSON.parse(raw)
    } catch {}
    return { x: 40, y: 80, width: Math.min(1200, window.innerWidth - 160), height: Math.min(720, window.innerHeight - 200) }
  })
  const [active, setActive] = useState(true)

  useEffect(() => {
    const onPointerMove = (ev: PointerEvent) => {
      if (!elRef.current) return
      if (dragging.current) {
        const dx = ev.clientX - origin.current.x
        const dy = ev.clientY - origin.current.y
        let nx = origin.current.w + dx
        let ny = origin.current.h + dy
        // origin.w/h used to store initial left/top
        nx = Math.max(8, Math.min(nx, window.innerWidth - (state.width + 8)))
        ny = Math.max(8, Math.min(ny, window.innerHeight - (state.height + 8)))
        setState((s) => ({ ...s, x: nx, y: ny }))
      }
      if (resizing.current) {
        const dx = ev.clientX - origin.current.x
        const dy = ev.clientY - origin.current.y
        const nw = Math.max(400, origin.current.w + dx)
        const nh = Math.max(240, origin.current.h + dy)
        const w = Math.min(nw, window.innerWidth - state.x - 8)
        const h = Math.min(nh, window.innerHeight - state.y - 8)
        setState((s) => ({ ...s, width: w, height: h }))
      }
    }

    const onPointerUp = () => {
      if (dragging.current || resizing.current) {
        dragging.current = false
        resizing.current = false
        document.body.style.userSelect = "auto"
        saveState()
      }
    }

    window.addEventListener("pointermove", onPointerMove)
    window.addEventListener("pointerup", onPointerUp)
    return () => {
      window.removeEventListener("pointermove", onPointerMove)
      window.removeEventListener("pointerup", onPointerUp)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.width, state.height, state.x, state.y])

  useEffect(() => {
    const onToggle = () => setState((s) => ({ ...s, hidden: false }))
    window.addEventListener("sky-finder-toggle", onToggle as EventListener)
    return () => window.removeEventListener("sky-finder-toggle", onToggle as EventListener)
  }, [])

  const saveState = () => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {}
  }

  const onPointerDownHeader = (ev: React.PointerEvent) => {
    const target = ev.target as HTMLElement
    // only start drag when clicking header itself (and not actionable buttons inside)
    if (target.closest("button")) return
    dragging.current = true
    origin.current = { x: ev.clientX, y: ev.clientY, w: state.x, h: state.y }
    document.body.style.userSelect = "none"
    setActive(true)
  }

  const onPointerDownResize = (ev: React.PointerEvent) => {
    resizing.current = true
    origin.current = { x: ev.clientX, y: ev.clientY, w: state.width, h: state.height }
    document.body.style.userSelect = "none"
  }

  const onDoubleClick = () => {
    // maximize / restore
    if (state.width >= window.innerWidth - 16) {
      // restore
      setState({ x: 40, y: 80, width: Math.min(1200, window.innerWidth - 160), height: Math.min(720, window.innerHeight - 200) })
    } else {
      setState({ x: 8, y: 8, width: window.innerWidth - 16, height: window.innerHeight - 16 })
    }
    setTimeout(saveState, 50)
  }

  const doClose = () => {
    setState((s) => ({ ...s, hidden: true }))
    saveState()
  }

  const doMinimize = () => {
    setState((s) => ({ ...s, hidden: true }))
    // notify dock (apps) to be able to restore
    window.dispatchEvent(new Event("sky-finder-minimized"))
  }

  const doMaxRestore = () => {
    if (state.width >= window.innerWidth - 16) {
      setState({ x: 40, y: 80, width: Math.min(1200, window.innerWidth - 160), height: Math.min(720, window.innerHeight - 200) })
    } else {
      setState({ x: 8, y: 8, width: window.innerWidth - 16, height: window.innerHeight - 16 })
    }
    saveState()
  }

  if (state.hidden) return null

  return (
    <div
      ref={elRef}
      className={`draggable-window ${active ? "draggable-window--active" : ""}`}
      style={{ left: state.x, top: state.y, width: state.width, height: state.height, position: "fixed" }}
      onPointerDown={() => setActive(true)}
    >
      <div ref={headerRef} onDoubleClick={onDoubleClick} onPointerDown={onPointerDownHeader} className="draggable-window__header">
        <div className="draggable-window__controls">
          <button aria-label="Close" className="traffic red" onClick={doClose} />
          <button aria-label="Minimize" className="traffic yellow" onClick={doMinimize} />
          <button aria-label="Maximize" className="traffic green" onClick={doMaxRestore} />
        </div>
        <div className="draggable-window__title">Finder - Files & Media Center</div>
        <div className="draggable-window__spacer" />
      </div>

      <div className="draggable-window__content">{children}</div>

      <div ref={resizeRef} onPointerDown={onPointerDownResize} className="draggable-window__resize-handle" />
    </div>
  )
}
