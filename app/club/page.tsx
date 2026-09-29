import Link from "next/link";

const features = [
  ["THE DROP", "Alertas útiles", "Reposiciones, preventas, lanzamientos japoneses y producto que merece la pena vigilar."],
  ["CHRONICLE", "Newsletter con memoria", "Actualidad del hobby mezclada con historias, sets y cartas que explican cómo hemos llegado hasta aquí."],
  ["COLLECTOR PROFILE", "Tu rincón", "Wishlist, productos buscados y más adelante seguimiento de colección y objetivos personales."],
  ["SORIKO LAB", "Exponer también es coleccionar", "Soportes, displays y accesorios propios para ordenar y disfrutar la colección."],
];

export default function ClubPage() {
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
        <p className="kicker">NOT JUST CUSTOMERS</p>
        <h1>Bienvenido<br />al Club.</h1>
        <p>
          Soriko quiere que comprar sea solo una parte de la relación. El verdadero activo será una comunidad que vuelve porque aprende,
          descubre producto, encuentra oportunidades y comparte colección.
        </p>
      </section>

      <section className="pageWidth clubPageGrid">
        {features.map(([label, title, copy]) => (
          <article className="clubPageCard" key={label}>
            <span>{label}</span>
            <h2>{title}</h2>
            <p>{copy}</p>
          </article>
        ))}
      </section>

      <section className="clubSection">
        <div className="pageWidth clubGrid">
          <div>
            <p className="kicker">SORIKO CHRONICLE</p>
            <h2>Una newsletter que no parece publicidad.</h2>
            <p className="clubLead">
              Un número semanal o quincenal: qué acaba de salir, qué ocurre en Japón, una historia del archivo,
              una pieza de la semana y las alertas que de verdad importan.
            </p>
          </div>
          <div className="clubFeatures">
            <article><span>01</span><strong>Now</strong><p>Qué acaba de cambiar esta semana.</p></article>
            <article><span>02</span><strong>Then</strong><p>Una historia de los últimos 30 años.</p></article>
            <article><span>03</span><strong>Japan</strong><p>Qué se está moviendo en el mercado japonés.</p></article>
            <article><span>04</span><strong>The Drop</strong><p>Stock, reposiciones y próximos lanzamientos.</p></article>
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
