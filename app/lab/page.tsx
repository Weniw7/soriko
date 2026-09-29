import Link from "next/link";

const labItems = [
  ["DISPLAY STANDS", "Soportes modulares", "Para booster boxes, slabs, top loaders y cartas favoritas."],
  ["SHELF SYSTEM", "Exposición de colección", "Bases y elevadores para convertir una estantería en una vitrina limpia."],
  ["STORAGE", "Orden sin perder estilo", "Separadores, organizadores y soluciones para cartas y accesorios."],
  ["CUSTOM FIT", "Diseñado por Soriko", "Iteraciones propias pensadas alrededor de medidas reales del coleccionismo."],
];

export default function LabPage() {
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
        <p className="kicker">SORIKO LAB</p>
        <h1>Tu colección también<br />merece escenario.</h1>
        <p>
          Una línea propia de accesorios para proteger, ordenar y exponer cartas
          y producto sellado. Diseñada desde Soriko, fabricada en series pequeñas
          y mejorada con feedback de coleccionistas.
        </p>
      </section>

      <section className="pageWidth clubPageGrid">
        {labItems.map(([label, title, copy]) => (
          <article className="clubPageCard labCard" key={label}>
            <span>{label}</span>
            <div className="labObject" aria-hidden="true" />
            <h2>{title}</h2>
            <p>{copy}</p>
          </article>
        ))}
      </section>

      <section className="labStatement">
        <div className="pageWidth">
          <p className="kicker">DESIGNED FOR COLLECTORS</p>
          <h2>Menos merchandising.<br />Más utilidad.</h2>
          <p>
            Soriko Lab se centrará en accesorios genéricos de coleccionismo con
            diseño propio, evitando depender de reproducciones no licenciadas de
            personajes o logotipos.
          </p>
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
