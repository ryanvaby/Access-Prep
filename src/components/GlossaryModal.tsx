import React, { useMemo, useState } from "react"
import type { GlossaryItem } from "../glossary"

type Props = {
  open: boolean
  onClose: () => void
  items: GlossaryItem[]
  title?: string
}

export default function GlossaryModal({ open, onClose, items, title = "Glossary" }: Props) {
  const [query, setQuery] = useState("")

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return items
    return items.filter((it) => {
      return (
        it.term.toLowerCase().includes(q) ||
        it.definition.toLowerCase().includes(q)
      )
    })
  }, [items, query])

  if (!open) return null

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.35)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        zIndex: 1000
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(860px, 100%)",
          maxHeight: "80vh",
          overflow: "auto",
          background: "white",
          borderRadius: 16,
          border: "1px solid rgba(0,0,0,0.12)",
          boxShadow: "0 10px 30px rgba(0,0,0,0.18)",
          padding: 20
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <h2 style={{ margin: 0, fontSize: 22 }}>{title}</h2>
          <div style={{ marginLeft: "auto", display: "flex", gap: 10 }}>
            <button
              onClick={onClose}
              style={{
                borderRadius: 999,
                padding: "8px 14px",
                border: "1px solid rgba(0,0,0,0.15)",
                background: "white",
                cursor: "pointer"
              }}
            >
              Close
            </button>
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search a term..."
            style={{
              width: "100%",
              borderRadius: 12,
              padding: "10px 12px",
              border: "1px solid rgba(0,0,0,0.15)"
            }}
          />
        </div>

        <div style={{ marginTop: 14, display: "grid", gap: 12 }}>
          {filtered.map((it) => (
            <div
              key={it.term}
              style={{
                border: "1px solid rgba(0,0,0,0.12)",
                borderRadius: 14,
                padding: 14
              }}
            >
              <div style={{ fontWeight: 700, fontSize: 16 }}>{it.term}</div>
              <div style={{ marginTop: 6 }}>{it.definition}</div>
              {it.example ? (
                <div style={{ marginTop: 8, opacity: 0.8 }}>
                  Example: {it.example}
                </div>
              ) : null}
            </div>
          ))}
          {filtered.length === 0 ? (
            <div style={{ opacity: 0.7 }}>No matches.</div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
