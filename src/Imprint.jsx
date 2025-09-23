import React from 'react';

export default function Imprint() {
  return (
    <section className="imprintFancy" aria-label="Imprint & Legal">
      <style>{`
        .imprintFancy { position: relative; }
        .imprintWrap {
          --maxW: min(1180px, 92vw);
          margin: 0 auto;
          width: var(--maxW);
          display: grid;
          gap: clamp(14px, 2.4vw, 28px);
          color: #fff;
        }
        .imprintTitle {
          margin: 0;
          display: grid;
          gap: clamp(6px, 1.6vw, 18px);
          font-family: 'Arial Black', Arial, Helvetica, sans-serif;
          font-weight: 900;
          text-transform: uppercase;
        }
        .imprintTitleLine {
          font-size: clamp(30px, 6.8vw, 92px);
          letter-spacing: .08em;
          line-height: .9;
        }
        .imprintSubtitle {
          font-size: clamp(18px, 3.8vw, 48px);
          letter-spacing: .14em;
          line-height: .92;
          color: rgba(255,255,255,0.75);
        }
        .imprintRule { height: 1.5px; background: rgba(255,255,255,.92); opacity: .92; margin: clamp(10px, 2vw, 18px) 0 clamp(22px, 4vw, 36px); }
        .imprintBody {
          column-count: 1;
          column-gap: clamp(18px, 3vw, 36px);
          column-fill: balance;
          font-family: Arial, Helvetica, sans-serif;
          font-size: clamp(15px, 2.3vw, 20px);
          line-height: 1.62;
          text-wrap: pretty;
        }
        @media (min-width: 1100px) {
          .imprintBody { column-count: 2; }
        }
        .imprintP {
          margin: 0 0 clamp(14px, 2.2vw, 20px);
          break-inside: avoid;
        }
        .imprintHighlight {
          break-inside: avoid;
          margin: clamp(12px, 2.4vw, 20px) 0;
          padding: clamp(12px, 2.6vw, 22px);
          border-radius: 14px;
          border: 2px solid rgba(255,255,255,0.85);
          background: rgba(255,255,255,0.08);
          font-family: 'Arial Black', Arial, Helvetica, sans-serif;
          font-size: clamp(13px, 2.4vw, 16px);
          letter-spacing: .12em;
          text-transform: uppercase;
        }
        .imprintList {
          margin: clamp(8px, 1.8vw, 14px) 0;
          padding: 0;
          list-style: none;
          display: grid;
          gap: clamp(8px, 1.6vw, 16px);
        }
        .imprintListItem {
          break-inside: avoid;
          padding: clamp(10px, 2vw, 16px);
          border-radius: 12px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.12);
          box-shadow: 0 14px 32px rgba(0,0,0,0.22);
        }
        .imprintListItem strong { font-family: 'Arial Black', Arial, Helvetica, sans-serif; letter-spacing: .08em; }
        .imprintContact {
          display: grid;
          gap: clamp(6px, 1.2vw, 10px);
          font-size: clamp(14px, 2.2vw, 18px);
        }
        .imprintContact a { color: #fff; text-decoration: underline; }
        .imprintContact a:hover { text-decoration-thickness: 3px; }
      `}</style>

      <div className="imprintWrap">
        <h2 className="imprintTitle">
          <span className="imprintTitleLine">Open HIV Archive</span>
          <span className="imprintSubtitle">Imprint · Legal & Contact</span>
        </h2>
        <div className="imprintRule" />

        <div className="imprintBody">
          <p className="imprintP"><strong>Open HIV Archive</strong> is an artist-led, non-commercial platform that gathers and contextualises digital traces connected to HIV/AIDS histories. The site is maintained as a living research notebook rather than a permanent repository; entries may evolve or be withdrawn as the project develops.</p>

          <p className="imprintP">Unless otherwise noted, copyrights remain with the respective rights holders. We reference original authors, artists, and sources wherever possible and link back to originating material. If you identify content that should be removed or re-attributed, please contact us so we can respond quickly.</p>

          <p className="imprintP">Contributions uploaded by the community reflect the perspectives of the respective authors. We do not verify every submission prior to publication; responsibility for accuracy and legality lies with the contributor. Upon notification of infringing or unlawful material, we will review the report and remove or revise the contribution.</p>

          <p className="imprintP">External links are curated with care, yet we cannot influence the content of the linked sites. At the time of linking, no legal violations were evident. Should you become aware of problematic content on a linked page, please inform us; we will remove the link immediately after review.</p>

          <div className="imprintHighlight">Contact · pleasearchiveme@gmail.com</div>

          <p className="imprintP">This website is provided “as is”. We do not warrant uninterrupted availability, error-free operation, or freedom from harmful components. Liability for damages arising from the use or non-use of the site is excluded to the extent permitted by applicable law.</p>

          <ul className="imprintList">
            <li className="imprintListItem">
              <strong>Project Purpose</strong>
              <div>The archive documents digital echoes of HIV/AIDS activism, memory work, and cultural production. It serves as a tool for research and critical reflection, not as a comprehensive historical record.</div>
            </li>
            <li className="imprintListItem">
              <strong>Content Liability</strong>
              <div>We curate and contextualise materials with care but cannot guarantee completeness or contemporaneity. Editorial notes signal the status of each contribution.</div>
            </li>
            <li className="imprintListItem">
              <strong>User Contributions</strong>
              <div>Uploads must respect third-party rights and data protection. Submitters confirm that they hold the necessary permissions. We reserve the right to edit, annotate, or remove content at any time.</div>
            </li>
            <li className="imprintListItem">
              <strong>Amendments</strong>
              <div>The project evolves continuously. Sections of the website, including this imprint, may be updated without prior notice.</div>
            </li>
          </ul>

          <div className="imprintContact">
            <div><strong>Contact for legal notices & takedowns</strong></div>
            <div><a href="mailto:pleasearchiveme@gmail.com">pleasearchiveme@gmail.com</a></div>
          </div>
        </div>
      </div>
    </section>
  );
}
