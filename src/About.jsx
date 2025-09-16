import React from 'react';

export default function About() {
  return (
    <section className="aboutFancy" aria-label="About — HIV/AIDS LEGACY">
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
          font-family: 'Arial Black', Arial, Helvetica, sans-serif;
          font-weight: 900;
          font-size: clamp(22px, 6vw, 64px);
          letter-spacing: .04em;
          color: #fff;
          text-transform: none;
          line-height: .96;
          word-spacing: .16em;
        }
        .aboutKicker { color: #ffffff; font-size: .65em; letter-spacing: .08em; }

        /* Flowing multi‑column body that doesn’t feel blocky */
        .aboutBody {
          column-count: 2;
          column-gap: clamp(18px, 3vw, 36px);
          column-fill: balance;
        }
        @media (max-width: 980px) {
          .aboutBody { column-count: 1; }
        }

        /* Paragraph styling: airy, rhythmic, with gentle micro‑motion on hover */
        .aboutP {
          break-inside: avoid;
          margin: 0 0 1.1em 0;
          font-family: 'Arial Black', Arial, Helvetica, sans-serif; /* requested */
          color: #ffffff;
          font-size: clamp(13px, 1.7vw, 18px);
          line-height: 1.45;
          letter-spacing: .01em;
          text-wrap: pretty;
          text-align: left;
          transition: transform .18s ease;
          hyphens: auto;
          -webkit-hyphens: auto;
          -ms-hyphens: auto;
        }
        .aboutP:hover { transform: translateY(-2px); }

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
          font-size: 3.2em;
          line-height: .85;
          padding: .04em .12em 0 0;
          color: #ffffff;
        }

        .aboutRule { height: 1px; background: rgba(255,255,255,.9); opacity: .9; margin: 6px 0 8px; }

        .aboutPull { margin: .8em 0 1.2em; padding: 10px 12px; border: 2px solid rgba(255,255,255,1); border-radius: 10px; color: #ffffff; font-family: 'Arial Black', Arial, Helvetica, sans-serif; font-weight: 900; letter-spacing: .02em; line-height: 1.2; background: transparent; box-shadow: none; }
      `}</style>

      <div className="aboutWrap">
        <h2 className="aboutTitle">
          HIV/AIDS LEGACY <span className="aboutKicker">— ARCHIVING DIGITAL TRACES</span>
        </h2>
        <div className="aboutRule" />

        <div className="aboutBody">
          <p className="aboutP"><strong>HIV/AIDS LEGACY: ARCHIVING DIGITAL TRACES (Attempt #1)</strong> is an approach towards making the discursive expansion of HIV and AIDS history in the digital realm more tangible. How can known and unknown historical traces of HIV and AIDS be tracked online? How do digital media platforms, social networks, and user communication contribute to the historicization of HIV and AIDS? This open archive collects and documents digital references to the reception of HIV and AIDS, extending traditional archival approaches from physical and material spaces into the digital. <strong>HIV/AIDS LEGACY</strong> also aims to address the ongoing social impact of HIV and AIDS and question canonical forms of historiography and archiving.</p>

          <p className="aboutP">The archive is a first step towards rethinking the collectivization processes of memories and translating them into communicative social practices in order to create a more differentiated understanding of HIV and AIDS. The phrase <strong>“Attempt #1”</strong> emphasizes the open and potential nature of this archive. It illustrates a digital transformation of an open archive from below. In doing so, it does not claim to be comprehensive. Rather, it should be understood as a space of opportunity to generate a different perception of HIV/AIDS history and contribute to the preservation of this history in a digital form. It is an artistic-scientific endeavor aimed at expanding and reshaping archival strategies of collecting and organizing.</p>

          <p className="aboutP">Focusing on the notion of collective memory as ascending from our understandings of collectivity and community as well as collectivizing processes, this first attempt aims to center the emotional and affective traces of an HIV/AIDS history and shed light on archival strategies as a social and communicative practice.</p>

          <div className="aboutPull">COLLECTIVIZING MEMORY — When we talk about collective memory, we are also talking about identity or identities. The collective memory of a community is filled with memories of shared events, stories, and feelings of the people in that community. It is the invisible space in which we remember what has shaped them as a group—whether joy or pain, achievements or losses.</div>

          <p className="aboutP">In order to keep these memories alive, artifacts and testimonies of the past are needed. On the other hand, we need active forms of storytelling, cultural practices that enable us to keep them alive. Memories do not stand for themselves but generate knowledge about ourselves—a knowledge that we do not carry alone but together with many, passed on to the next generation, a living echo of the past that resounds into the future.</p>

          <p className="aboutP">At this point, however, I would like to take a step back to where memories are formed. Collective memory appears to be the place where these memories are present, where they are stored. But what does the process of filing look like? I am asking here about the process of collectivizing memories. Two levels become visible. Firstly, that of shared experience. The experience is collectivized by the fact that it happens to a group as a whole. Individual experiences come together to form a collective experience. Here, experiences of oppression, trauma, but also of liberation and achievement are perceived as shared when they take place on the basis of certain characteristics of the group.</p>

          <p className="aboutP">On a second level, the process of collectivization becomes visible through collecting and preserving as well as actively keeping alive. Individual stories are collectivized because they are connected to an event, to an experience of many. The individual experiences and stories construct the foundation of the collective memory. Through the process of collectivizing memories, connections are made between an event and the real emotional and affective effects of this event on the members of a group. The collectivization process is therefore also a process of acknowledging/recognizing commonality. Through it, the collective memory can be shaped and, if necessary, reshaped.</p>

          <p className="aboutP"><strong>HIV/AIDS LEGACY</strong> not only attempts to preserve a history and maintain a collective memory; it is also about expanding it and questioning our identity by collectivizing new, possibly previously hidden memories and traces. Because it is a participatory open archive, new affiliations to HIV/AIDS history are discussed with the help of the stored digital traces, and the collective memory is reformulated and expanded by the users. This enables the genesis of new associations and can further develop a practice of solidarity and emancipation.</p>
        </div>
      </div>
    </section>
  );
}