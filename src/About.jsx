import React from 'react';

export default function About() {
  return (
    <section className="aboutFancy" aria-label="About — Tracing HIV Archive">
      <style>{`
        .aboutFancy { position: relative; }
        /* Layout */
        .aboutWrap {
          --maxW: min(1200px, 92vw);
          margin: 0 auto;
          width: var(--maxW);
          display: grid;
          gap: clamp(14px, 2.2vw, 28px);
        }
        /* Title */
        .aboutTitle {
          margin: 0;
          display: grid;
          gap: clamp(6px, 1.6vw, 18px);
          font-family: 'Arial Black', Arial, Helvetica, sans-serif;
          font-weight: 900;
          text-transform: uppercase;
          color: #fff;
        }
        .aboutTitleLine {
          font-size: clamp(36px, 7.4vw, 96px);
          letter-spacing: .08em;
          line-height: .88;
        }
        .aboutSubtitle {
          font-size: clamp(22px, 4.8vw, 58px);
          letter-spacing: .16em;
          line-height: .92;
          color: rgba(255,255,255,0.82);
        }
        .aboutMeta {
          font-size: clamp(14px, 2.2vw, 24px);
          letter-spacing: .22em;
          color: rgba(255,255,255,0.75);
        }

        /* Flowing multi‑column body that doesn’t feel blocky */
        .aboutBody {
          column-count: 1;
          max-width: min(960px, 100%);
          column-gap: clamp(18px, 3vw, 36px);
          column-fill: balance;
        }
        @media (min-width: 1100px) {
          .aboutBody { column-count: 2; }
        }

        /* Paragraph styling: airy, rhythmic, with gentle micro‑motion on hover */
        .aboutP {
          break-inside: avoid;
          margin: 0 0 1.1em 0;
          font-family: 'Arial Black', Arial, Helvetica, sans-serif; /* requested */
          color: #ffffff;
          font-size: clamp(16px, 2.6vw, 24px);
          line-height: 1.58;
          letter-spacing: .015em;
          text-wrap: pretty;
          text-align: left;
          transition: transform .18s ease;
          hyphens: auto;
          -webkit-hyphens: auto;
          -ms-hyphens: auto;
        }
        .aboutP:hover { transform: translateY(-3px); }

        /* Emphasis in white, bold */
        .aboutP strong {
          font-weight: 900;
          color: #ffffff;
        }

        /* Fancy drop‑cap on the very first paragraph */
        .aboutBody .aboutP:first-of-type::first-letter {
          float: left;
          font-family: 'Arial Black', Arial, Helvetica, sans-serif;
          font-weight: 900;
          font-size: 3.8em;
          line-height: .84;
          padding: .02em .14em 0 0;
          color: #ffffff;
        }

        .aboutRule {
          height: 1.5px;
          background: rgba(255,255,255,.92);
          opacity: .92;
          margin: clamp(14px, 3vw, 28px) 0 clamp(30px, 6vw, 52px);
        }

        .aboutPull {
          margin: 1.4em 0 0;
          padding: 12px 16px;
          border: 2px solid rgba(255,255,255,0.92);
          border-radius: 12px;
          color: #ffffff;
          font-family: 'Arial Black', Arial, Helvetica, sans-serif;
          font-weight: 900;
          letter-spacing: .16em;
          line-height: 1.26;
          background: rgba(255,255,255,0.06);
          text-transform: uppercase;
        }
      `}</style>

      <div className="aboutWrap">
        <h2 className="aboutTitle">
          <span className="aboutTitleLine">Tracing HIV Archive</span>
          <span className="aboutSubtitle">Archive for Viral Memory</span>
          <span className="aboutMeta">Elias Capelle · Paul Dombrowski</span>
        </h2>
        <div className="aboutRule" />

        <div className="aboutBody">
          <p className="aboutP"><strong>Tracing HIV Archive</strong> behaves like a working score for viral memory. We read residues in caches, classifieds, livestreams, club flyers, memorial threads. Each artefact is handled as material that still vibrates, a signal carrying the entanglement of care, surveillance, activism, and desire.</p>

          <p className="aboutP">The archive advances through rehearsals rather than completions. Entries arrive as annotations, glitches, drafts, or echoes that refuse closure. We stage them so that research, nightlife, mutual aid and policy language remain in friction, showing how knowledge about HIV is continually rehearsed in public and clandestine spaces alike.</p>

          <p className="aboutP">Our method borrows from performance studies, queer archival practices, and media forensics. Context is written with attentiveness and doubt: How do lines of code carry the violence of legislation? Where does intimacy slip through official historiography? Which bodies become metadata once platforms deprecate their architecture?</p>

          <p className="aboutP">You are invited to extend the score—upload documentation, rumours, protest ephemera, legal fragments, whispered instructions. Each contribution retunes the archive and resists any single authoritative narrative of the HIV/AIDS crisis.</p>

          <div className="aboutPull">ARCHIVE AS CONTINUOUS CHOREOGRAPHY.</div>
        </div>
      </div>
    </section>
  );
}
