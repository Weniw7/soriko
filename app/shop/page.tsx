import Link from "next/link";

const products = [
  { meta: "JP · SEALED", title: "30th Celebration", copy: "Edición japonesa · selección Soriko", tone: "gold" },
  { meta: "JP · BOOSTER BOX", title: "Mega Dream ex", copy: "Japón · caja sellada", tone: "jp" },
  { meta: "JP · BOOSTER BOX", title: "Pokémon 151", copy: "Japón · clásico moderno", tone: "blue" },
  { meta: "EU · SEALED", title: "Soriko Vault", copy: "Piezas seleccionadas para conservar", tone: "green" },
];

export default function ShopPage() {
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
        <p className="kicker">SORIKO STORE</p>
        <h1>Compra según<br />cómo coleccionas.</h1>
        <p>
          Producto Pokémon TCG seleccionado por idioma, tipo de coleccionista y origen.
          Estamos preparando el catálogo real y conectándolo con nuestro sistema interno de stock.
        </p>
      </section>

      <div className="categoryStrip pageWidth">
        <a href="#japan">Japón</a>
        <a href="#sealed">Sellado</a>
        <a href="#open">Para abrir</a>
        <span>Español</span>
        <span>Inglés</span>
        <span>Accesorios</span>
        <span>Preventas</span>
      </div>

      <section className="catalogSection pageWidth" id="japan">
        <div className="catalogHeading">
          <h2>Japan Select</h2>
          <span>Vista previa · catálogo en preparación</span>
        </div>

        <div className="productGrid">
          {products.map((product) => (
            <article className="productCard" key={product.title}>
              <div className={"productArt " + product.tone} />
              <div className="productInfo">
                <div className="productMeta">
                  <span>{product.meta}</span>
                  <span>SORIKO</span>
                </div>
                <h3>{product.title}</h3>
                <p>{product.copy}</p>
                <Link className="soon" href="/club/">Avisarme cuando llegue →</Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="pageWidth valueGrid" id="sealed">
        <article>
          <span>AUTHENTICITY</span>
          <h3>Origen claro</h3>
          <p>Queremos que cada producto tenga proveedor, idioma y condición definidos antes de llegar al catálogo.</p>
        </article>
        <article>
          <span>CONDITION</span>
          <h3>Sellado importa</h3>
          <p>Para el coleccionista, una caja no es solo contenido: precinto, golpes y conservación forman parte del producto.</p>
        </article>
        <article id="open">
          <span>EU STOCK</span>
          <h3>Comprar sin incertidumbre</h3>
          <p>El objetivo es importar y almacenar en Europa para que el cliente no tenga que resolver aduanas ni proxies.</p>
        </article>
      </section>

      <footer className="siteFooter">
        <div className="pageWidth legalLine">
          Soriko Club es un comercio independiente y no está afiliado ni patrocinado por The Pokémon Company.
        </div>
      </footer>
    </main>
  );
}
