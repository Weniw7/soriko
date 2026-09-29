import Link from "next/link";

const categories = [
  { tag: "30.º ANIVERSARIO", title: "Celebración", copy: "El gran momento Pokémon de 2026: nostalgia, clásicos y nuevas rarezas.", tone: "yellow", href: "/shop/#anniversary" },
  { tag: "JAPAN SELECT", title: "Booster Boxes JP", copy: "Cajas japonesas, lanzamientos y piezas difíciles de encontrar en Europa.", tone: "red", href: "/shop/#japan" },
  { tag: "MODERN CLASSIC", title: "Pokémon 151", copy: "Kanto, nostalgia y uno de los sets modernos que mejor conecta generaciones.", tone: "blue", href: "/shop/#151" },
  { tag: "THE VAULT", title: "Sellado", copy: "Producto pensado para conservar, exponer y disfrutar sin abrir.", tone: "night", href: "/shop/#sealed" },
  { tag: "SORIKO LAB", title: "Accesorios", copy: "Soportes, displays y soluciones propias para cuidar la colección.", tone: "green", href: "/lab/" },
];

const products = [
  { badge: "30 YEARS", meta: "POKÉMON TCG · JAPÓN", title: "30th Anniversary", copy: "Booster Box · edición japonesa", tone: "anniversary", status: "SORIKO WATCH" },
  { badge: "JAPAN", meta: "POKÉMON TCG · JAPÓN", title: "Mega Dream ex", copy: "Booster Box · factory sealed", tone: "dream", status: "JAPAN SELECT" },
  { badge: "151", meta: "POKÉMON TCG · JAPÓN", title: "Pokémon Card 151", copy: "Booster Box · Kanto collection", tone: "kanto", status: "COLLECTOR PICK" },
  { badge: "SEALED", meta: "POKÉMON TCG · VAULT", title: "Collector Sealed", copy: "Selección Soriko para conservar", tone: "sealed", status: "THE VAULT" },
];

const journal = [
  { issue: "ISSUE 001 · 1996", title: "Dónde empezó todo.", copy: "Japón, las primeras cartas y el origen de un hobby que treinta años después sigue creciendo." },
  { issue: "GUIDE · JAPAN", title: "Por qué el producto japonés se siente diferente.", copy: "Cajas, impresión, rarezas, lanzamientos y qué mirar antes de comprar." },
  { issue: "30 YEARS · 2026", title: "Treinta años, una nueva era.", copy: "Más de 150 cartas, nostalgia y una celebración diseñada para unir generaciones de coleccionistas." },
];

export default function HomePage() {
  return (
    <main>
      <div className="announcement pokemonAnnouncement">
        <span>1996 — 2026</span>
        <strong>Pokémon TCG cumple 30 años</strong>
        <span>SORIKO CLUB · APERTURA PRÓXIMAMENTE</span>
      </div>

      <header className="siteHeader pageWidth premiumHeader">
        <Link className="brand" href="/">
          <span className="brandMark">S</span>
          <span>SORIKO<small>POKÉMON TCG CLUB</small></span>
        </Link>
        <nav className="mainNav" aria-label="Principal">
          <Link href="/shop/">Tienda Pokémon</Link>
          <Link href="/shop/#japan">Japón</Link>
          <Link href="/shop/#anniversary">30.º Aniversario</Link>
          <Link href="/club/">Club</Link>
          <Link href="/journal/">Journal</Link>
          <Link href="/lab/">Lab</Link>
        </nav>
        <Link className="headerCta shopCta" href="/shop/">Entrar en la tienda ↗</Link>
      </header>

      <section className="pokemonHero">
        <div className="pageWidth pokemonHeroGrid">
          <div className="heroCopy pokemonHeroCopy">
            <div className="heroLabelRow">
              <span className="heroBadge">POKÉMON TCG</span>
              <span className="heroBadge ghostBadge">JAPÓN · EUROPA</span>
            </div>
            <h1>Tu próxima carta<br />favorita <em>empieza aquí.</em></h1>
            <p className="heroText">
              Pokémon TCG japonés, español e inglés. Booster boxes, producto sellado,
              drops, accesorios y una comunidad creada para quienes disfrutan tanto
              buscando una carta como encontrándola.
            </p>
            <div className="heroActions">
              <Link className="button primary pokemonPrimary" href="/shop/">Explorar Pokémon</Link>
              <Link className="button ghost pokemonGhost" href="/shop/#japan">Descubrir Japón</Link>
            </div>
            <div className="heroProof pokemonProof">
              <span>Producto auténtico</span><span>Selección japonesa</span><span>Collector-first</span><span>Envíos desde España / UE</span>
            </div>
          </div>

          <div className="pokemonHeroArt" aria-label="Soriko Pokémon TCG collector preview">
            <div className="electricGlow glowYellow" />
            <div className="electricGlow glowBlue" />
            <div className="tcgStack tcgBack"><span>THE VAULT</span><strong>SEALED</strong><small>KEEP THE MOMENT</small></div>
            <div className="tcgStack tcgMid"><span>JAPAN DROP</span><strong>JP</strong><small>SORIKO SELECT</small></div>
            <div className="tcgStack tcgFront"><span>1996 — 2026</span><strong>30</strong><small>YEARS OF POKÉMON TCG</small></div>
            <div className="spark sparkOne">✦</div><div className="spark sparkTwo">✦</div><div className="spark sparkThree">✦</div>
            <div className="heroStamp">CARDS · CULTURE · COMMUNITY</div>
          </div>
        </div>
      </section>

      <section className="trustRail">
        <div className="pageWidth trustRailInner">
          <span><b>01</b> Factory sealed</span><span><b>02</b> Japón seleccionado</span><span><b>03</b> Stock y condición claros</span><span><b>04</b> Comunidad Soriko</span>
        </div>
      </section>

      <section className="pageWidth shopBySection">
        <div className="sectionHeading">
          <div><p className="kicker">SHOP BY OBSESSION</p><h2>¿Qué Pokémon estás persiguiendo?</h2></div>
          <p>La navegación de Soriko empieza por lo que mueve al coleccionista: nostalgia, Japón, sellado, aperturas y piezas difíciles.</p>
        </div>
        <div className="pokemonCategoryGrid">
          {categories.map((item) => (
            <Link className={"pokemonCategoryCard " + item.tone} href={item.href} key={item.title}>
              <span>{item.tag}</span><div className="categoryOrb" /><h3>{item.title}</h3><p>{item.copy}</p><b>Explorar →</b>
            </Link>
          ))}
        </div>
      </section>

      <section className="hotSection">
        <div className="pageWidth">
          <div className="sectionHeading lightHeading">
            <div><p className="kicker">HOT IN THE HOBBY</p><h2>Lo que todo coleccionista mira ahora.</h2></div>
            <Link href="/shop/">Ver Pokémon Store →</Link>
          </div>
          <div className="pokemonProductGrid">
            {products.map((product) => (
              <article className="pokemonProductCard" key={product.title}>
                <div className={"pokemonProductVisual " + product.tone}>
                  <span className="productBadge">{product.badge}</span>
                  <div className="packShape"><span>SORIKO</span><strong>{product.title}</strong><small>POKÉMON TCG</small></div>
                </div>
                <div className="pokemonProductInfo">
                  <span>{product.meta}</span><h3>{product.title}</h3><p>{product.copy}</p>
                  <div className="productBottom"><b>{product.status}</b><Link href="/club/">Avísame →</Link></div>
                </div>
              </article>
            ))}
          </div>
          <p className="demoNote">Vista previa de catálogo. El stock y precio final se publicarán únicamente cuando Soriko tenga disponibilidad confirmada.</p>
        </div>
      </section>

      <section className="japanFeature">
        <div className="pageWidth japanFeatureGrid">
          <div className="japanPoster"><span>東京 → EUROPE</span><strong>JAPAN<br/>SELECT</strong><small>CURATED BY SORIKO</small></div>
          <div className="japanCopy">
            <p className="kicker">SORIKO JAPAN</p>
            <h2>Japón sin convertirlo en una lotería.</h2>
            <p className="clubLead darkLead">Buscamos producto japonés con origen claro, calculamos el coste real puesto en Europa y solo traemos lo que encaja por autenticidad, condición y valor para el coleccionista.</p>
            <div className="japanSteps">
              <article><span>01</span><strong>Rastrear</strong><p>Mercado japonés, distribuidores y oportunidades.</p></article>
              <article><span>02</span><strong>Validar</strong><p>Precio, autenticidad, condición y coste puesto en España.</p></article>
              <article><span>03</span><strong>Seleccionar</strong><p>Solo entra en Soriko lo que tiene sentido para el coleccionista.</p></article>
            </div>
            <Link className="button primary pokemonPrimary" href="/shop/#japan">Ver Japan Select</Link>
          </div>
        </div>
      </section>

      <section className="anniversarySection">
        <div className="pageWidth anniversaryGrid">
          <div className="anniversaryNumber">30</div>
          <div>
            <p className="kicker">1996 — 2026 · POKÉMON TCG</p>
            <h2>Treinta años abriendo sobres. Y todavía sentimos lo mismo.</h2>
            <p>2026 celebra tres décadas del Juego de Cartas Coleccionables Pokémon. Para Soriko será el hilo conductor entre producto, historia y comunidad: clásicos, nuevas rarezas, recuerdos y la próxima generación de coleccionistas.</p>
            <Link className="textLink" href="/journal/">Explorar la historia en Soriko Journal →</Link>
          </div>
        </div>
      </section>

      <section className="journalPreview pageWidth">
        <div className="sectionHeading">
          <div><p className="kicker">SORIKO JOURNAL</p><h2>Comprar es una parte. Saber qué tienes, otra.</h2></div>
          <p>Contenido pensado para el coleccionista Pokémon: historia, Japón, guías, rarezas, conservación y contexto de cada era.</p>
        </div>
        <div className="journalCardGrid">
          {journal.map((item, index) => (
            <Link href="/journal/" className={"journalStory story" + (index + 1)} key={item.issue}>
              <span>{item.issue}</span><h3>{item.title}</h3><p>{item.copy}</p><b>Leer →</b>
            </Link>
          ))}
        </div>
      </section>

      <section className="clubSection pokemonClubSection">
        <div className="pageWidth clubGrid">
          <div>
            <p className="kicker">SORIKO CLUB</p>
            <h2>No queremos clientes. Queremos coleccionistas que vuelvan.</h2>
            <p className="clubLead">Restocks, Japan Drops, wishlist, historias del TCG, guías y una newsletter que tenga algo que contar incluso cuando no quieras comprar nada.</p>
            <div className="heroActions"><Link className="button light" href="/club/">Entrar al Club</Link><Link className="button ghost clubGhost" href="/journal/">Leer Journal</Link></div>
          </div>
          <div className="clubFeatures">
            <article><span>01</span><strong>The Drop</strong><p>Reposiciones, preventas y producto difícil de encontrar.</p></article>
            <article><span>02</span><strong>Soriko Chronicle</strong><p>Pokémon actual + treinta años de historia en una newsletter.</p></article>
            <article><span>03</span><strong>Collector Profile</strong><p>Wishlist, objetivos y alertas alrededor de tu colección.</p></article>
            <article><span>04</span><strong>Soriko Lab</strong><p>Accesorios propios para proteger y exponer Pokémon TCG.</p></article>
          </div>
        </div>
      </section>

      <section className="labHome pageWidth">
        <div className="labHomeVisual"><div className="displayStand"><span>POKÉMON TCG</span></div></div>
        <div className="labHomeCopy"><p className="kicker">SORIKO LAB</p><h2>La colección también se diseña.</h2><p>Displays, soportes y accesorios propios para booster boxes, cartas protegidas y slabs. Producto Soriko pensado desde la mesa y la estantería del coleccionista.</p><Link className="button primary pokemonPrimary" href="/lab/">Entrar en Soriko Lab</Link></div>
      </section>

      <section className="newsletter pokemonNewsletter pageWidth">
        <div><p className="kicker">SORIKO CHRONICLE</p><h2>Pokémon en tu bandeja. Pero sin spam.</h2></div>
        <div className="newsletterBox"><p>Un correo con lo que merece la pena: nuevos sets, Japón, una historia del archivo, un Soriko Pick y los drops de la semana.</p><Link className="button primary pokemonPrimary" href="/club/">Quiero el primer número</Link></div>
      </section>

      <footer className="siteFooter pokemonFooter">
        <div className="pageWidth footerGrid">
          <div><Link className="brand footerBrand" href="/"><span className="brandMark">S</span><span>SORIKO<small>POKÉMON TCG CLUB</small></span></Link><p>Pokémon TCG · Japón · sellado · cultura · comunidad.</p></div>
          <div><strong>Pokémon Store</strong><Link href="/shop/#anniversary">30.º Aniversario</Link><Link href="/shop/#japan">Japón</Link><Link href="/shop/#sealed">Sellado</Link><Link href="/lab/">Accesorios</Link></div>
          <div><strong>Soriko</strong><Link href="/club/">Club</Link><Link href="/journal/">Journal</Link><span>Operado por AMM CORE SOLUTIONS S.L.</span><span>© 2026 Soriko Club</span></div>
        </div>
        <div className="pageWidth legalLine">Soriko Club es un comercio independiente de productos Pokémon TCG y no está afiliado, patrocinado ni respaldado por The Pokémon Company.</div>
      </footer>
    </main>
  );
}
