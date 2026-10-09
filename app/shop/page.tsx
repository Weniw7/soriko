import Link from "next/link";
import ShopCatalog from "../../components/commerce/ShopCatalog";
import "../../components/commerce/storefront.css";

export default function ShopPage() {
  return (
    <main>
      <div className="announcement pokemonAnnouncement">
        <span>POKÉMON TCG</span><strong>SORIKO STORE PREVIEW</strong><span>APERTURA PRÓXIMAMENTE</span>
      </div>
      <header className="siteHeader pageWidth premiumHeader">
        <Link className="brand" href="/"><span className="brandMark">S</span><span>SORIKO<small>POKÉMON TCG CLUB</small></span></Link>
        <nav className="mainNav"><Link href="/shop/">Tienda Pokémon</Link><Link href="#japan">Japón</Link><Link href="#anniversary">30.º Aniversario</Link><Link href="/club/">Club</Link><Link href="/journal/">Journal</Link><Link href="/lab/">Lab</Link></nav>
        <Link className="headerCta shopCta" href="/">Inicio</Link>
      </header>

      <section className="shopHero">
        <div className="pageWidth shopHeroGrid">
          <div>
            <div className="heroLabelRow"><span className="heroBadge">SORIKO POKÉMON STORE</span><span className="heroBadge ghostBadge">PREVIEW</span></div>
            <h1>Todo lo que quieres abrir.<br/><em>Y lo que no quieres abrir nunca.</em></h1>
            <p>Booster boxes, Pokémon japonés, producto en español e inglés, sellado para coleccionistas y accesorios. Soriko estará organizado para encontrar rápido lo que buscas y descubrir lo que todavía no sabías que querías.</p>
          </div>
          <div className="shopHeroStat"><span>OUR FOCUS</span><strong>Pokémon<br/>TCG only.</strong><small>Sin ruido. Sin catálogo genérico.</small></div>
        </div>
      </section>

      <ShopCatalog />

      <section className="shopPromise">
        <div className="pageWidth shopPromiseGrid">
          <article><span>01</span><h3>Autenticidad primero.</h3><p>Origen, idioma y condición claros. Disponibilidad real en cada ficha: si una caja no tiene existencias, aparecerá agotada y sin opción de compra.</p></article>
          <article><span>02</span><h3>Japón, pero fácil.</h3><p>Soriko absorbe la complejidad de proxies, importación y selección para que el cliente compre desde Europa.</p></article>
          <article><span>03</span><h3>El sellado es producto.</h3><p>Precinto, golpes, almacenamiento y presentación importan tanto como la caja que hay dentro.</p></article>
          <article><span>04</span><h3>No vendemos y desaparecemos.</h3><p>Wishlist, alertas, Journal y Club mantienen viva la relación con el coleccionista después del checkout.</p></article>
        </div>
      </section>

      <section className="japanFeature compactJapan">
        <div className="pageWidth japanFeatureGrid">
          <div className="japanPoster"><span>JAPAN → SORIKO</span><strong>JP<br/>DROP</strong><small>BOOSTER BOXES · SEALED</small></div>
          <div className="japanCopy"><p className="kicker">JAPAN SELECT</p><h2>Producto japonés presentado como merece.</h2><p className="clubLead darkLead">Cada drop japonés debe sentirse limitado, seleccionado y deseable: información clara, condición del producto, por qué merece la pena y una presentación que haga justicia a la caja.</p><Link className="button primary pokemonPrimary" href="/club/">Recibir Japan Drops</Link></div>
        </div>
      </section>

      <section className="newsletter pokemonNewsletter pageWidth">
        <div><p className="kicker">RESTOCK & DROP ALERTS</p><h2>No vuelvas a llegar tarde a una caja.</h2></div>
        <div className="newsletterBox"><p>Únete al Club para recibir alertas de reposición, preventas, lanzamientos japoneses y Soriko Picks.</p><Link className="button primary pokemonPrimary" href="/club/">Quiero las alertas</Link></div>
      </section>

      <footer className="siteFooter pokemonFooter"><div className="pageWidth legalLine">Soriko Club es un comercio independiente de productos Pokémon TCG y no está afiliado, patrocinado ni respaldado por The Pokémon Company.</div></footer>
    </main>
  );
}
