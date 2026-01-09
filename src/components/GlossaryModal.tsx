import React, { useMemo, useState } from "react"
import type { GlossaryItem } from "../glossary"
import type { Lang } from "../i18n"
import { t } from "../i18n"

type Props = {
  open: boolean
  onClose: () => void
  items: GlossaryItem[]
  lang: Lang
  title?: string
}

export default function GlossaryModal({ open, onClose, items, lang, title = "Financial Glossary" }: Props) {
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
        background: "rgba(0,0,0,0.4)",
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
          width: "min(900px, 100%)",
          maxHeight: "85vh",
          overflow: "auto",
          background: "white",
          borderRadius: 8,
          border: "1px solid #e5e7eb",
          boxShadow: "0 10px 40px rgba(0,0,0,0.15)"
        }}
      >
        <div 
          style={{ 
            background: '#004878',
            padding: "28px 32px",
            display: "flex", 
            alignItems: "center", 
            justifyContent: "space-between",
            borderTopLeftRadius: 8,
            borderTopRightRadius: 8
          }}
        >
          <h2 style={{ margin: 0, fontSize: 32, fontWeight: 300, color: "white" }}>{title}</h2>
          <button
            onClick={onClose}
            style={{
              borderRadius: 6,
              padding: "10px 24px",
              border: "1px solid rgba(255,255,255,0.3)",
              background: "rgba(255,255,255,0.1)",
              color: "white",
              cursor: "pointer",
              fontWeight: 500,
              fontSize: 14,
              transition: "all 0.2s"
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.2)"}
            onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
          >
            Close
          </button>
        </div>

        <div style={{ padding: "28px 32px" }}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t(lang, "glossary.search")}
            style={{
              width: "100%",
              borderRadius: 6,
              padding: "14px 16px",
              border: "1px solid #d1d5db",
              fontSize: 14,
              outline: "none",
              transition: "border-color 0.2s"
            }}
            onFocus={(e) => e.currentTarget.style.borderColor = '#004878'}
            onBlur={(e) => e.currentTarget.style.borderColor = '#d1d5db'}
          />
        </div>

        <div style={{ padding: "0 32px 32px", maxHeight: "500px", overflowY: "auto" }}>
          <div style={{ display: "grid", gap: 16 }}>
            {filtered.map((it) => (
              <div
                key={it.term}
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: 8,
                  padding: 20,
                  background: "white"
                }}
              >
                <div style={{ fontWeight: 600, fontSize: 18, color: '#004878', marginBottom: 8 }}>{it.term}</div>
                <div style={{ color: "#374151", lineHeight: 1.6, fontSize: 15, fontWeight: 300 }}>{it.definition}</div>
                {it.example ? (
                  <div style={{ marginTop: 12, fontSize: 14, color: "#6b7280", fontStyle: "italic", paddingLeft: 12, borderLeft: "3px solid #dbeafe" }}>
                    <strong>Example:</strong> {it.example}
                  </div>
                ) : null}
              </div>
            ))}
            {filtered.length === 0 ? (
              <div style={{ color: "#6b7280", textAlign: "center", padding: 40, fontSize: 15 }}>No matching terms found.</div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}