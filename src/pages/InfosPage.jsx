import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { cacheGet, cacheSet } from '../lib/cache'

const CACHE_KEY = 'infos_content'

export default function InfosPage() {
  const cached = cacheGet(CACHE_KEY)
  const [content, setContent] = useState(cached || [])
  const [loading, setLoading] = useState(!cached)

  useEffect(() => {
    loadContent()
  }, [])

  async function loadContent() {
    const { data, error } = await supabase
      .from('content')
      .select('*')
      .is('festival_id', null)
      .eq('visibility', 'all')
      .order('sort_order')

    if (!error && data) {
      setContent(data)
      cacheSet(CACHE_KEY, data, 30 * 60 * 1000)
    }
    setLoading(false)
  }

  return (
    <div>
      <div className="header">
        <Link to="/" style={{ textDecoration: 'none', fontSize: 20, color: 'var(--schwarz)', fontWeight: 700 }}>←</Link>
        <span className="header-logo" style={{ fontSize: '0.9rem' }}>Anleitungen & Infos</span>
        <span style={{ width: 20 }} />
      </div>

      <div className="page" style={{ paddingTop: 16 }}>
        {loading && <div className="loading">Lädt...</div>}

        {!loading && content.length === 0 && (
          <div className="card" style={{ textAlign: 'center', padding: 32 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📖</div>
            <p className="card-sub">
              Hier erscheinen bald Anleitungen und Infos für euch.
            </p>
          </div>
        )}

        {content.map(c => (
          <ContentCard key={c.id} item={c} />
        ))}

        {/* Placeholder bis Inhalte eingetragen sind */}
        {content.length === 0 && !loading && (
          <div style={{ marginTop: 16 }}>
            <div className="section-title">Demnächst hier</div>
            {[
              { icon: '🚽', title: 'Trockentoiletten reinigen', sub: 'Schritt-für-Schritt Anleitung' },
              { icon: '♻️', title: 'Abfallsortierung', sub: 'Was kommt wohin' },
              { icon: '🌧️', title: 'Bei Regen', sub: 'Was tun wenn das Wetter umschlägt' },
              { icon: '🆘', title: 'Notfallprotokoll', sub: 'Ablauf bei medizinischen Notfällen' },
            ].map((item, i) => (
              <div key={i} className="card" style={{ opacity: 0.5 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 28 }}>{item.icon}</span>
                  <div>
                    <div className="card-title">{item.title}</div>
                    <div className="card-sub">{item.sub}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function ContentCard({ item }) {
  const [expanded, setExpanded] = useState(false)

  const typeIcon = {
    anleitung: '📋',
    lageplan: '🗺️',
    notfallnummern: '🚨',
    schichtplan: '📅',
    info: '💡'
  }[item.content_type] || '📄'

  return (
    <div className="card" style={{ cursor: item.body ? 'pointer' : 'default' }} onClick={() => item.body && setExpanded(!expanded)}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 28, flexShrink: 0 }}>{typeIcon}</span>
        <div style={{ flex: 1 }}>
          <div className="card-title">{item.title}</div>
        </div>
        {item.body && (
          <span style={{ color: 'var(--grau-dunkel)', fontSize: 18 }}>
            {expanded ? '▲' : '▼'}
          </span>
        )}
      </div>

      {expanded && item.body && (
        <div style={{
          marginTop: 12,
          paddingTop: 12,
          borderTop: '1px solid var(--border)',
          fontSize: 14,
          lineHeight: 1.7,
          whiteSpace: 'pre-wrap',
          color: 'var(--schwarz)'
        }}>
          {item.body}
        </div>
      )}

      {item.file_url && (
        <a
          href={item.file_url}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-secondary"
          style={{ marginTop: 12, textDecoration: 'none' }}
          onClick={e => e.stopPropagation()}
        >
          📄 Dokument öffnen
        </a>
      )}
    </div>
  )
}
