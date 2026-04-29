import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { cacheGet, cacheSet } from '../lib/cache'
import { fetchWithTimeout } from '../lib/fetchWithTimeout'
import { IconStar, IconPin, IconKalender, IconStift, IconInfos, IconKontakte } from '../components/Icons'

const CACHE_KEY = 'infos_content'

export default function InfosPage() {
  const cached = cacheGet(CACHE_KEY)
  const [content, setContent] = useState(cached || [])
  const [loading, setLoading] = useState(!cached)
  const [error, setError] = useState(false)

  useEffect(() => { loadContent() }, [])

  async function loadContent() {
    setError(false)
    const { data, error } = await fetchWithTimeout(
      supabase.from('content').select('*')
        .is('festival_id', null).eq('visibility', 'all').order('sort_order')
    )
    if (!error && data) {
      setContent(data)
      cacheSet(CACHE_KEY, data, 8 * 60 * 60 * 1000)
    } else if (error) {
      setError(true)
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

        {!loading && error && (
          <div className="card" style={{ textAlign: 'center', padding: 32 }}>
            <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'center' }}><IconStar size={32} /></div>
            <p className="card-sub" style={{ marginBottom: 16 }}>Verbindung unterbrochen.</p>
            <button className="button" onClick={loadContent}>Nochmal versuchen</button>
          </div>
        )}

        {!loading && content.length === 0 && (
          <div className="card" style={{ textAlign: 'center', padding: 32 }}>
            <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'center' }}><IconStar size={40} /></div>
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
              { icon: <IconStift size={26}/>, title: 'Trockentoiletten reinigen', sub: 'Schritt-für-Schritt Anleitung' },
              { icon: <IconStar size={26}/>,  title: 'Abfallsortierung', sub: 'Was kommt wohin' },
              { icon: <IconStar size={26}/>,  title: 'Bei Regen', sub: 'Was tun wenn das Wetter umschlägt' },
              { icon: <IconKontakte size={26}/>, title: 'Notfallprotokoll', sub: 'Ablauf bei medizinischen Notfällen' },
            ].map((item, i) => (
              <div key={i} className="card" style={{ opacity: 0.5 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{item.icon}</span>
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
    anleitung:     <IconStift size={26}/>,
    lageplan:      <IconPin size={26}/>,
    notfallnummern:<IconKontakte size={26}/>,
    schichtplan:   <IconKalender size={26}/>,
    info:          <IconInfos size={26}/>,
  }[item.content_type] || <IconStar size={26}/>

  return (
    <div className="card" style={{ cursor: item.body ? 'pointer' : 'default' }} onClick={() => item.body && setExpanded(!expanded)}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{typeIcon}</span>
        <div style={{ flex: 1 }}>
          <div className="card-title">{item.title}</div>
        </div>
        {item.body && (
          <span style={{ color: 'var(--grau-dunkel)', flexShrink: 0, display: 'flex', alignItems: 'center' }}>
            <svg role="presentation" focusable="false" width="8" height="6" viewBox="0 0 8 6"
              style={{
                display: 'block',
                transform: expanded ? 'rotate(0deg)' : 'rotate(-90deg)',
                transition: 'transform 0.2s ease',
              }}>
              <path d="m1 1.5 3 3 3-3" fill="none" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
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
