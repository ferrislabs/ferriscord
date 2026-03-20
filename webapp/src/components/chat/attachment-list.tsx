import { useState, useEffect } from 'react'
import { FileText, Download, ChevronDown, ChevronUp, ZoomIn, X, Film } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createPortal } from 'react-dom'
import type { Schemas } from '@/api/api.client'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TEXT_PREVIEWABLE_TYPES = new Set([
  'application/json', 'application/xml', 'application/yaml',
  'application/x-yaml', 'application/toml',
])
const TEXT_PREVIEWABLE_EXTS = new Set([
  'txt', 'md', 'mdx', 'rst', 'json', 'xml', 'yaml', 'yml', 'toml', 'csv',
  'rs', 'py', 'js', 'ts', 'jsx', 'tsx', 'go', 'java', 'c', 'cpp', 'h',
  'css', 'html', 'sh', 'bash', 'zsh', 'fish', 'env', 'ini', 'conf', 'log',
])

function isTextPreviewable(contentType: string, filename: string): boolean {
  if (contentType.startsWith('text/')) return true
  if (TEXT_PREVIEWABLE_TYPES.has(contentType)) return true
  const ext = filename.split('.').pop()?.toLowerCase() ?? ''
  return TEXT_PREVIEWABLE_EXTS.has(ext)
}

// ─── ImageLightbox ────────────────────────────────────────────────────────────

function ImageLightbox({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(id)
  }, [])

  useEffect(() => {
    const handle = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handle)
    return () => document.removeEventListener('keydown', handle)
  }, [onClose])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return createPortal(
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center transition-all duration-200',
        visible ? 'bg-black/85 backdrop-blur-sm' : 'bg-black/0 backdrop-blur-none',
      )}
      onClick={onClose}
    >
      <div
        className={cn(
          'relative transition-all duration-200',
          visible ? 'opacity-100 scale-100' : 'opacity-0 scale-95',
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={src}
          alt={alt}
          className="max-w-[90vw] max-h-[90vh] rounded-lg shadow-2xl object-contain"
        />
        <button
          onClick={onClose}
          className="absolute top-2 right-2 w-8 h-8 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center transition-colors"
          aria-label="Fermer"
        >
          <X className="w-4 h-4" />
        </button>
        {alt && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 bg-black/60 text-white text-xs rounded-full max-w-xs truncate">
            {alt}
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}

// ─── TextAttachmentPreview ────────────────────────────────────────────────────

const PREVIEW_CHARS = 600

function TextAttachmentPreview({ att }: { att: Schemas.Attachment }) {
  const [text, setText] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch(att.url)
      .then((r) => r.text())
      .then((t) => { if (!cancelled) { setText(t); setLoading(false) } })
      .catch(() => { if (!cancelled) { setText(null); setLoading(false) } })
    return () => { cancelled = true }
  }, [att.url])

  const preview = text === null ? null : expanded ? text : text.slice(0, PREVIEW_CHARS)
  const isTruncated = text !== null && text.length > PREVIEW_CHARS

  return (
    <div className="max-w-sm w-full border border-border rounded-lg overflow-hidden text-sm">
      <div className="flex items-center justify-between gap-2 px-3 py-2 bg-accent border-b border-border">
        <div className="flex items-center gap-2 min-w-0">
          <FileText className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
          <span className="font-medium text-foreground truncate">{att.filename}</span>
        </div>
        <a
          href={att.url}
          download={att.filename}
          className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
          title="Télécharger"
        >
          <Download className="w-4 h-4" />
        </a>
      </div>
      <div className="bg-muted/30 px-3 py-2">
        {loading && <span className="text-xs text-muted-foreground">Chargement…</span>}
        {!loading && text === null && <span className="text-xs text-muted-foreground">Aperçu indisponible</span>}
        {preview !== null && (
          <>
            <pre className="text-xs text-foreground font-mono whitespace-pre-wrap break-all max-h-48 overflow-y-auto leading-relaxed">
              {preview}
            </pre>
            {isTruncated && (
              <button
                onClick={() => setExpanded((v) => !v)}
                className="mt-1.5 flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
              >
                {expanded
                  ? <><ChevronUp className="w-3 h-3" /> Voir moins</>
                  : <><ChevronDown className="w-3 h-3" /> Voir plus ({text.length - PREVIEW_CHARS} caractères)</>}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ─── AttachmentList ───────────────────────────────────────────────────────────

interface AttachmentListProps {
  attachments: Schemas.Attachment[]
  className?: string
}

export function AttachmentList({ attachments, className }: AttachmentListProps) {
  const [lightbox, setLightbox] = useState<{ src: string; alt: string } | null>(null)

  if (attachments.length === 0) return null

  return (
    <>
      <div className={cn('mt-2 flex flex-wrap gap-2', className)}>
        {attachments.map((att) => {
          const isImage = att.content_type.startsWith('image/')
          const isVideo = att.content_type.startsWith('video/')
          const isText = isTextPreviewable(att.content_type, att.filename)

          if (isImage) {
            return (
              <button
                key={att.id}
                type="button"
                className="group relative block rounded-lg overflow-hidden border border-border focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() => setLightbox({ src: att.url, alt: att.filename })}
              >
                <img
                  src={att.url}
                  alt={att.filename}
                  className="max-w-xs max-h-72 object-cover transition-transform duration-200 group-hover:scale-[1.02]"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200 flex items-center justify-center">
                  <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 drop-shadow transition-opacity duration-200" />
                </div>
              </button>
            )
          }

          if (isVideo) {
            return (
              <div key={att.id} className="flex flex-col gap-1">
                <video
                  src={att.url}
                  controls
                  className="max-w-xs max-h-72 rounded-lg border border-border"
                />
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground px-1">
                  <Film className="w-3 h-3" />
                  <span className="truncate max-w-[16rem]">{att.filename}</span>
                  <a
                    href={att.url}
                    download={att.filename}
                    className="ml-auto hover:text-foreground transition-colors"
                    title="Télécharger"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            )
          }

          if (isText) {
            return <TextAttachmentPreview key={att.id} att={att} />
          }

          return (
            <a
              key={att.id}
              href={att.url}
              download={att.filename}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 bg-accent hover:bg-accent/70 rounded-lg border border-border text-sm text-foreground transition-colors max-w-xs"
            >
              <FileText className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
              <span className="truncate flex-1">{att.filename}</span>
              <Download className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
            </a>
          )
        })}
      </div>

      {lightbox && (
        <ImageLightbox
          src={lightbox.src}
          alt={lightbox.alt}
          onClose={() => setLightbox(null)}
        />
      )}
    </>
  )
}
