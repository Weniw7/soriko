import Link from "next/link";

const paths = [
  {
    number: "01",
    title: "Abrir",
    copy: "Sets actuales, booster boxes y productos pensados para disfrutar el ritual de abrir.",
    href: "/shop/#open",
  },
  {
    number: "02",
    title: "Guardar",
    copy: "Sellado seleccionado para quien colecciona cajas, artes y momentos del hobby.",
    href: "/shop/#sealed",
  },
  {
    number: "03",
    title: "Japón",
    copy: "Una puerta directa a ediciones japonesas, exclusivas y productos difíciles de encontrar en Europa.",
    href: "/shop/#japan",
  },
  {
    number: "04",
    title: "Completar",
    copy: "Alertas, wishlist y herramientas para perseguir esa pieza que todavía falta.",
    href: "/club/",
  },
];

const drops = [
  {
    tag: "30 YEARS",
    title: "Celebración 30.º Aniversario",
    copy: "Tres décadas de cartas, nostalgia y nuevas ilustraciones. La historia vuelve a la carpeta.",
    tone: "gold",
  },
  {
    tag: "JAPAN RADAR",
    title: "Directo desde Japón",
    copy: "Soriko rastrea producto japonés para encontrar stock auténtico y oportunidades con sentido.",
    tone: "red",
  },
  {
    tag: "THE VAULT",
    title: "Coleccionar también es conservar",
    copy: "Sellado, displays y piezas elegidas para quienes disfrutan tanto de guardar como de abrir.",
    tone: "blue",
  },
];

export default function HomePage() {
  return (
    <main>
      <div className="announcement">
        <span>1996 — 2026</span>
        <strong>30 años de Pokémon TCG</strong>
        <span>SORIKO CLUB · OPENING SOON</span>
      </div>

      <header className="siteHeader pageWidth">
        <Link className="brand" href="/">
          <span className="brandMark">S</span>
          <span>
            SORIKO
            <small>CLUB</small>
          </span>
        </Link>

        <nav className="mainNav" aria-label="Principal">
          <Link href="/shop/">Tienda</Link>
          <Link href="/shop/#japan">Japón</Link>
          <Link href="/journal/">Journal</Link>
          <Link href="/club/">Club</Link>
        </nav>

        <Link className="headerCta" href="/club/">
          Entrar al club
        </Link>
      </header>

      <section className="heroV2 pageWidth">
        <div className="heroCopy">
          <p className="kicker">POKÉMON CARDS · CULTURE · COMMUNITY</p>
          <h1>
            No queremos ser
            <br />
            <em>otra tienda.</em>
          </h1>
          <p className="heroText">
            Soriko Club nace para comprar Pokémon con criterio, descubrir Japón,
            entender la historia detrás de cada colección y compartir el hobby
            con gente que lo vive igual que tú.
          </p>
          <div className="heroActions">
            <Link className="button primary" href="/shop/">
              Explorar Soriko
            </Link>
            <Link className="button ghost" href="/club/">
              Conocer el Club
            </Link>
          </div>
          <div className="heroProof">
            <span>Producto auténtico</span>
            <span>Stock europeo</span>
            <span>Selección japonesa</span>
          </div>
        </div>

        <div className="heroArt" aria-label="Soriko collector display">
          <div className="orb orbOne" />
          <div className="orb orbTwo" />
          <div className="collectorCard cardBack">
            <span>1996</span>
            <strong>THE BEGINNING</strong>
          </div>
          <div className="collectorCard cardMiddle">
            <span>JAPAN</span>
            <strong>SORIKO SELECT</strong>
          </div>
          <div className="collectorCard cardFront">
            <span>2026</span>
            <strong>30 YEARS</strong>
            <small>COLLECT THE STORY</small>
          </div>
          <div className="heroStamp">EUROPE / JAPAN</div>
        </div>
      </section>

      <section className="ticker">
        <div>
          <span>SEALED</span>
          <i>✦</i>
          <span>JAPANESE</span>
          <i>✦</i>
          <span>BOOSTER BOXES</span>
          <i>✦</i>
          <span>ACCESSORIES</span>
          <i>✦</i>
          <span>COMMUNITY</span>
          <i>✦</i>
          <span>STORIES</span>
        </div>
      </section>

      <section className="pageWidth sectionBlock">
        <div className="sectionHeading">
          <div>
            <p className="kicker">START YOUR JOURNEY</p>
            <h2>¿Cómo vives el hobby?</h2>
          </div>
          <p>
            La tienda se organiza alrededor del coleccionista, no alrededor de
            un almacén infinito de referencias.
          </p>
        </div>

        <div className="pathGrid">
          {paths.map((item) => (
            <Link className="pathCard" href={item.href} key={item.title}>
              <span>{item.number}</span>
              <div>
                <h3>{item.title}</h3>
                <p>{item.copy}</p>
              </div>
              <b>↗</b>
            </Link>
          ))}
        </div>
      </section>

      <section className="dropsSection">
        <div className="pageWidth">
          <div className="sectionHeading lightHeading">
            <div>
              <p className="kicker">SORIKO DROPS</p>
              <h2>Lo que está pasando ahora.</h2>
            </div>
            <Link href="/shop/">Ver tienda →</Link>
          </div>

          <div className="dropGrid">
            {drops.map((drop) => (
              <article className={"dropCard " + drop.tone} key={drop.title}>
                <span>{drop.tag}</span>
                <div className="dropVisual">
                  <div className="miniCard one" />
                  <div className="miniCard two" />
                  <div className="miniCard three" />
                </div>
                <h3>{drop.title}</h3>
                <p>{drop.copy}</p>
                <Link href="/shop/">Descubrir ↗</Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="storePreview pageWidth">
        <div className="sectionHeading">
          <div>
            <p className="kicker">SORIKO STORE</p>
            <h2>Producto que apetece coleccionar.</h2>
          </div>
          <p>
            Japón, inglés y español; novedades para abrir, sellado para conservar
            y accesorios pensados para cuidar y exponer la colección.
          </p>
        </div>

        <div className="storePreviewGrid">
          <Link className="storePreviewCard previewJapan" href="/shop/#japan">
            <span>JAPAN SELECT</span>
            <strong>Booster Boxes</strong>
            <small>Producto japonés · sourcing Soriko</small>
          </Link>
          <Link className="storePreviewCard previewVault" href="/shop/#sealed">
            <span>THE VAULT</span>
            <strong>Sealed Collection</strong>
            <small>Para guardar, exponer y conservar</small>
          </Link>
          <Link className="storePreviewCard previewOpen" href="/shop/#open">
            <span>OPEN IT</span>
            <strong>Sets & Drops</strong>
            <small>Novedades, preventas y restocks</small>
          </Link>
          <Link className="storePreviewCard previewLab" href="/lab/">
            <span>SORIKO LAB</span>
            <strong>Collector Gear</strong>
            <small>Displays, soportes y accesorios propios</small>
          </Link>
        </div>
      </section>

      <section className="historySection pageWidth">
        <div className="historyIntro">
          <p className="kicker">THE ARCHIVE</p>
          <h2>
            De 1996
            <br />a tu estantería.
          </h2>
          <p>
            Pokémon TCG empezó hace treinta años en Japón. Soriko quiere recuperar
            esa memoria: sets, ilustradores, cambios de era, cartas que marcaron
            una generación y las historias que hacen que una caja sea algo más
            que cartón sellado.
          </p>
          <Link className="textLink" href="/journal/">
            Entrar en Soriko Journal →
          </Link>
        </div>

        <div className="timeline">
          <div className="timelineItem">
            <span>1996</span>
            <div>
              <strong>Todo empieza en Japón.</strong>
              <p>Las primeras cartas abren un nuevo modo de coleccionar Pokémon.</p>
            </div>
          </div>
          <div className="timelineItem active">
            <span>2026</span>
            <div>
              <strong>30 años después.</strong>
              <p>
                El aniversario conecta clásicos, nuevas rarezas y una generación
                que ahora colecciona con sus propios hijos.
              </p>
            </div>
          </div>
          <div className="timelineItem">
            <span>NEXT</span>
            <div>
              <strong>Tu colección continúa.</strong>
              <p>Soriko será el lugar donde seguirla, documentarla y compartirla.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="clubSection">
        <div className="pageWidth clubGrid">
          <div>
            <p className="kicker">SORIKO CLUB</p>
            <h2>La tienda termina donde empieza la comunidad.</h2>
            <p className="clubLead">
              Alertas de restock, drops japoneses, historias del TCG, guías para
              coleccionistas y un perfil que irá creciendo con tu colección.
            </p>
            <Link className="button light" href="/club/">
              Ver el plan del Club
            </Link>
          </div>

          <div className="clubFeatures">
            <article>
              <span>01</span>
              <strong>The Drop</strong>
              <p>Alertas de reposición, preventas y producto difícil de encontrar.</p>
            </article>
            <article>
              <span>02</span>
              <strong>Soriko Chronicle</strong>
              <p>Una newsletter que mezcla actualidad con 30 años de historia.</p>
            </article>
            <article>
              <span>03</span>
              <strong>Collector Profile</strong>
              <p>Wishlist, piezas buscadas y, más adelante, seguimiento de colección.</p>
            </article>
            <article>
              <span>04</span>
              <strong>Soriko Lab</strong>
              <p>Accesorios propios para exponer, ordenar y proteger tu colección.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="newsletter pageWidth">
        <div>
          <p className="kicker">THE FIRST ISSUE</p>
          <h2>30 años de cartas. Un correo que sí querrás abrir.</h2>
        </div>
        <div className="newsletterBox">
          <p>
            Soriko Chronicle llegará con historias, lanzamientos, Japón,
            oportunidades y cultura Pokémon. Sin spam. Estamos preparando el
            primer número.
          </p>
          <Link className="button primary" href="/club/">
            Quiero estar dentro
          </Link>
        </div>
      </section>

      <footer className="siteFooter">
        <div className="pageWidth footerGrid">
          <div>
            <Link className="brand footerBrand" href="/">
              <span className="brandMark">S</span>
              <span>
                SORIKO
                <small>CLUB</small>
              </span>
            </Link>
            <p>Pokémon cards, culture & community.</p>
          </div>

          <div>
            <strong>Explorar</strong>
            <Link href="/shop/">Tienda</Link>
            <Link href="/shop/#japan">Japón</Link>
            <Link href="/journal/">Journal</Link>
            <Link href="/club/">Club</Link>
          </div>

          <div>
            <strong>Soriko</strong>
            <span>Operado por AMM CORE SOLUTIONS S.L.</span>
            <span>Envíos desde España / UE</span>
            <span>© 2026 Soriko Club</span>
          </div>
        </div>
        <div className="pageWidth legalLine">
          Soriko Club es un comercio independiente y no está afiliado ni
          patrocinado por The Pokémon Company.
        </div>
      </footer>
    </main>
  );
}
