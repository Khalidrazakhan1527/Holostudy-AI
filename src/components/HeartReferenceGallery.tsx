import { useState } from 'react'
import { BookOpen, ChevronLeft, ChevronRight, Maximize2, X } from 'lucide-react'

const REFERENCES = [
  {
    file: 'heart-reference-01.png',
    title: 'Heart Anatomy',
    category: 'ANATOMICAL REFERENCE',
    description: 'Reference view of the human heart and its anatomical structures.',
  },
  {
    file: 'heart-reference-02.png',
    title: 'Heart Structure',
    category: 'ANATOMICAL REFERENCE',
    description: 'Anatomical illustration for studying the cardiovascular system.',
  },
  {
    file: 'heart-reference-03.png',
    title: 'Circulatory System',
    category: 'SYSTEM OVERVIEW',
    description: 'Overview of the human body and its major organ systems.',
  },
  {
    file: 'heart-reference-04.png',
    title: 'Heart Chambers',
    category: 'EXTERNAL ANATOMY',
    description: 'Reference showing the positions of the right and left heart chambers.',
  },
  {
    file: 'heart-reference-05.png',
    title: 'Internal Heart',
    category: 'SECTIONAL ANATOMY',
    description: 'Cutaway reference for studying the four chambers and internal structures.',
  },
  {
    file: 'heart-reference-06.png',
    title: 'Cardiovascular System',
    category: 'SYSTEM OVERVIEW',
    description: 'Heart positioned within the body’s major blood vessels.',
  },
  {
    file: 'heart-reference-07.png',
    title: 'Blood Flow',
    category: 'CIRCULATION',
    description: 'Reference illustration for understanding blood circulation through the heart.',
  },
]

const imageUrl = (file: string) => `/models/${file}`

type HeartReferenceGalleryProps = {
  onClose?: () => void
}

export default function HeartReferenceGallery({ onClose }: HeartReferenceGalleryProps) {
  const [selected, setSelected] = useState(0)
  const [expanded, setExpanded] = useState(false)

  const current = REFERENCES[selected]

  const previous = () =>
    setSelected((index) => (index - 1 + REFERENCES.length) % REFERENCES.length)

  const next = () =>
    setSelected((index) => (index + 1) % REFERENCES.length)

  return (
    <section
      aria-label="Heart holographic reference gallery"
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 20,
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        overflow: 'hidden',
        color: '#dff7ff',
        background: 'radial-gradient(ellipse at 50% 35%, #102b46 0%, #050b17 65%, #020610 100%)',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          padding: '14px 18px',
          borderBottom: '1px solid rgba(75,205,255,.25)',
          background: 'rgba(7,19,36,.8)',
        }}
      >
        <div>
          <div style={{ fontSize: 10, letterSpacing: 3, color: '#48d9ff' }}>
            HOLOSTUDY AI / CARDIOVASCULAR LAB
          </div>
          <h2 style={{ margin: '5px 0 0', fontSize: 18, fontWeight: 650 }}>
            Heart Anatomy Explorer
          </h2>
        </div>
        {onClose && (
          <button onClick={onClose} aria-label="Close reference gallery" style={iconButton}>
            <X size={18} />
          </button>
        )}
      </header>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 190px',
          gap: 14,
          flex: 1,
          minHeight: 0,
          padding: 16,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 10,
              marginBottom: 10,
              color: '#71cbe8',
              fontSize: 10,
              letterSpacing: 2,
            }}
          >
            <span>{current.category}</span>
            <span>{String(selected + 1).padStart(2, '0')} / {REFERENCES.length}</span>
          </div>

          <div
            style={{
              position: 'relative',
              flex: 1,
              minHeight: 180,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              border: '1px solid rgba(73,204,255,.48)',
              borderRadius: 14,
              background: 'radial-gradient(ellipse at 50% 45%, rgba(12,49,77,.7), rgba(1,8,19,.96) 72%)',
              boxShadow: 'inset 0 0 55px rgba(29,151,255,.2), 0 0 28px rgba(29,151,255,.14)',
            }}
          >
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                inset: 0,
                pointerEvents: 'none',
                opacity: 0.3,
                backgroundImage:
                  'linear-gradient(rgba(70,185,255,.08) 1px, transparent 1px), linear-gradient(90deg, rgba(70,185,255,.08) 1px, transparent 1px)',
                backgroundSize: '26px 26px',
              }}
            />

            <img
              key={current.file}
              src={imageUrl(current.file)}
              alt={current.title}
              style={{
                position: 'relative',
                zIndex: 1,
                maxWidth: '94%',
                maxHeight: '94%',
                width: 'auto',
                height: 'auto',
                objectFit: 'contain',
                borderRadius: 5,
                animation: 'heartReferenceReveal .45s ease-out, heartHologramFloat 6s ease-in-out infinite',
                filter: 'saturate(1.12) drop-shadow(0 0 9px rgba(65,205,255,.48)) drop-shadow(0 0 24px rgba(39,157,255,.2))',
                transformStyle: 'preserve-3d',
                backfaceVisibility: 'hidden',
              }}
            />

            <div aria-hidden="true" className="heart-holo-scanlines" />
            <div aria-hidden="true" className="heart-holo-beam" />
            <div aria-hidden="true" className="heart-holo-vignette" />

            <button onClick={previous} aria-label="Previous reference" style={{ ...iconButton, position: 'absolute', left: 10, top: '50%', zIndex: 2 }}>
              <ChevronLeft size={20} />
            </button>
            <button onClick={next} aria-label="Next reference" style={{ ...iconButton, position: 'absolute', right: 10, top: '50%', zIndex: 2 }}>
              <ChevronRight size={20} />
            </button>
            <button
              onClick={() => setExpanded(true)}
              aria-label="Expand reference"
              style={{ ...iconButton, position: 'absolute', right: 10, top: 10, zIndex: 2 }}
            >
              <Maximize2 size={16} />
            </button>
          </div>

          <div style={{ padding: '13px 2px 2px' }}>
            <h3 style={{ margin: 0, fontSize: 17 }}>{current.title}</h3>
            <p style={{ margin: '6px 0 0', color: '#9ab8cf', fontSize: 12, lineHeight: 1.6 }}>
              {current.description}
            </p>
          </div>
        </div>

        <aside style={{ display: 'flex', flexDirection: 'column', minHeight: 0, gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3, fontSize: 11, color: '#76d9f5' }}>
            <BookOpen size={15} />
            REFERENCE VIEWS
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto', paddingRight: 3 }}>
            {REFERENCES.map((reference, index) => (
              <button
                key={reference.file}
                onClick={() => setSelected(index)}
                aria-pressed={selected === index}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 7,
                  padding: 7,
                  textAlign: 'left',
                  color: selected === index ? '#e7fbff' : '#9bb5c9',
                  background: selected === index ? 'rgba(26,137,190,.2)' : 'rgba(13,27,44,.72)',
                  border: `1px solid ${selected === index ? '#43d5ff' : 'rgba(113,172,207,.18)'}`,
                  borderRadius: 9,
                  cursor: 'pointer',
                }}
              >
                <img
                  src={imageUrl(reference.file)}
                  alt=""
                  loading="lazy"
                  style={{ width: '100%', height: 65, objectFit: 'contain', background: '#07101d', borderRadius: 4 }}
                />
                <span style={{ fontSize: 11, lineHeight: 1.35 }}>
                  {String(index + 1).padStart(2, '0')} · {reference.title}
                </span>
              </button>
            ))}
          </div>
        </aside>
      </div>

      <footer
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          padding: '10px 16px',
          borderTop: '1px solid rgba(75,205,255,.2)',
          color: '#7ea8bf',
          fontSize: 10,
          letterSpacing: 1.1,
        }}
      >
        <span>LOCAL ANATOMY REFERENCES · {REFERENCES.length} VIEWS</span>
        <span>SELECT A VIEW TO EXPLORE</span>
      </footer>

      {expanded && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${current.title} enlarged`}
          onClick={() => setExpanded(false)}
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            background: 'rgba(0,4,12,.96)',
            cursor: 'zoom-out',
          }}
        >
          <button
            onClick={() => setExpanded(false)}
            aria-label="Close enlarged reference"
            style={{ ...iconButton, position: 'absolute', top: 16, right: 16 }}
          >
            <X size={20} />
          </button>
          <div className="heart-holo-expanded">
            <img
              src={imageUrl(current.file)}
              alt={current.title}
              onClick={(event) => event.stopPropagation()}
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
                filter: 'saturate(1.08) drop-shadow(0 0 18px rgba(65,205,255,.4))',
              }}
            />
            <div aria-hidden="true" className="heart-holo-scanlines" />
            <div aria-hidden="true" className="heart-holo-beam" />
          </div>
        </div>
      )}

      <style>{`
        @keyframes heartReferenceReveal {
          from { opacity: .2; transform: scale(.96) translateY(8px); filter: blur(2px); }
          to { opacity: 1; transform: scale(1) translateY(0); filter: blur(0); }
        }

        @keyframes heartHologramFloat {
          0%, 100% { translate: 0 0; }
          50% { translate: 0 -5px; }
        }

        @keyframes heartHoloScan {
          0% { transform: translateY(-110%); opacity: 0; }
          8% { opacity: .75; }
          88% { opacity: .55; }
          100% { transform: translateY(110%); opacity: 0; }
        }

        @keyframes heartHoloFlicker {
          0%, 100% { opacity: .2; }
          45% { opacity: .36; }
          48% { opacity: .18; }
          52% { opacity: .32; }
          75% { opacity: .24; }
        }

        .heart-holo-scanlines {
          position: absolute;
          inset: 0;
          z-index: 2;
          pointer-events: none;
          background: repeating-linear-gradient(
            to bottom,
            rgba(100,220,255,.075) 0px,
            rgba(100,220,255,.075) 1px,
            transparent 2px,
            transparent 5px
          );
          mix-blend-mode: screen;
          animation: heartHoloFlicker 4s linear infinite;
        }

        .heart-holo-beam {
          position: absolute;
          inset: -30% 0;
          z-index: 3;
          pointer-events: none;
          background: linear-gradient(
            to bottom,
            transparent 43%,
            rgba(54,206,255,.025) 47%,
            rgba(81,223,255,.42) 50%,
            rgba(54,206,255,.08) 53%,
            transparent 57%
          );
          animation: heartHoloScan 5s linear infinite;
        }

        .heart-holo-vignette {
          position: absolute;
          inset: 0;
          z-index: 2;
          pointer-events: none;
          box-shadow: inset 0 0 55px rgba(30,174,255,.15);
          background: radial-gradient(ellipse at center, transparent 48%, rgba(0,7,18,.32) 100%);
        }

        .heart-holo-expanded {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          max-width: 100%;
          max-height: 100%;
          overflow: hidden;
          border: 1px solid rgba(70,215,255,.45);
          border-radius: 12px;
          box-shadow: 0 0 35px rgba(30,174,255,.12), inset 0 0 25px rgba(30,174,255,.1);
        }

        @media (prefers-reduced-motion: reduce) {
          .heart-holo-scanlines,
          .heart-holo-beam {
            animation: none;
          }
        }

        @media (max-width: 650px) {
          .heart-gallery-placeholder { display: none; }
        }
      `}</style>
    </section>
  )
}

const iconButton: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 36,
  height: 36,
  flexShrink: 0,
  color: '#a9eaff',
  background: 'rgba(20,55,82,.7)',
  border: '1px solid rgba(95,207,255,.35)',
  borderRadius: 9,
  cursor: 'pointer',
}
