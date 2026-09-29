import Link from "next/link";

export default function JournalPage() {
  return (
    <main>
      <header className="siteHeader pageWidth">
        <Link className="brand" href="/">
          <span className="brandMark">S</span>
          <span>SORIKO<small>CLUB</small></span>
        </Link>
        <nav className="mainNav">
          <Link href="/shop/">Tienda</Link>
          <Link href="/shop/#japan">Japón</Link>
          <Link href="/journal/">Journal</Link>
          <Link href="/club/">Club</Link>
        </nav>
        <Link className="headerCta" href="/">Volver</Link>
      </header>

      <section className="innerHero pageWidth">
        <p className="kicker">SORIKO JOURNAL</p>
        <h1>Las cartas también<br />cuentan historias.</h1>
        <p>
          El archivo editorial de Soriko: historia del TCG, cultura japonesa, guías de coleccionismo,
          conservación, lanzamientos y contexto para entender por qué una colección importa.
        </p>
      </section>

      <section className="pageWidth editorialGrid">
        <article className="editorialCard">
          <span>ISSUE 001 · HISTORY</span>
          <h2>1996: el comienzo de una obsesión de 30 años.</h2>
          <p>
            Del lanzamiento japonés a una comunidad global. El primer gran relato de Soriko Chronicle empieza donde empezó el hobby.
          </p>
        </article>
        <article className="editorialCard alt">
          <span>COLLECTING · JAPAN</span>
          <h2>Por qué Japón se siente diferente.</h2>
          <p>
            Diseño, idiomas, cajas, exclusivas y el ritual alrededor del producto japonés.
          </p>
        </article>
      </section>

      <section className="historySection pageWidth">
        <div className="historyIntro">
          <p className="kicker">THE ARCHIVE</p>
          <h2>Una línea temporal viva.</h2>
          <p>
            El Journal crecerá hasta convertirse en una guía visual por eras, sets, rarezas y momentos clave.
            Una manera de descubrir producto antiguo sin convertir la web en una enciclopedia fría.
          </p>
        </div>
        <div className="timeline">
          <div className="timelineItem">
            <span>1996</span>
            <div><strong>Primeras cartas en Japón.</strong><p>El punto de partida de la historia que Soriko quiere documentar.</p></div>
          </div>
          <div className="timelineItem active">
            <span>2026</span>
            <div><strong>30.º aniversario.</strong><p>Una nueva generación descubre clásicos mientras los primeros coleccionistas vuelven a ellos.</p></div>
          </div>
          <div className="timelineItem">
            <span>∞</span>
            <div><strong>El archivo sigue abierto.</strong><p>Cada nueva expansión añade otro capítulo.</p></div>
          </div>
        </div>
      </section>

      <footer className="siteFooter">
        <div className="pageWidth legalLine">
          Soriko Club es un comercio independiente y no está afiliado ni patrocinado por The Pokémon Company.
        </div>
      </footer>
    </main>
  );
}
