# Soriko Engine V1 — operación y alcance

Implementación: 1 de octubre de 2026. Panel privado de datos de mercado y apoyo a decisiones. No es un comprador autónomo ni una garantía de rentabilidad.

## Acceso y componentes

- Panel: https://sorico.alfonso-millan.workers.dev/admin/
- Repositorio: Weniw7/soriko.
- Supabase: soriko-club / vgxeebazmzkncbsmcrha.
- Backend: Edge Function `soriko-engine`.
- Motor numérico: `lib/engine/core.ts`.
- Rutas: `/admin/`, `/admin/setup/`, `/admin/radar/`, `/admin/analyze/`, `/admin/products/`, `/admin/market/`, `/admin/opportunities/`, `/admin/suppliers/`, `/admin/jobs/`, `/admin/alerts/`.

La tienda pública conserva sus páginas y diseño. El HTML del panel es un shell estático sin datos de negocio. Los datos privados se obtienen de la función únicamente después de validar JWT, sesión activa y rol del equipo. Ocultar un enlace no es una medida de autorización.

## Acceso superadmin

Soriko Engine utiliza un único usuario interno de Supabase Auth. No existe registro público, invitaciones desde el panel ni alta automática de empleados.

El usuario superadmin está vinculado por UUID a la tabla `engine_superadmin`, que admite una sola fila. La autorización interna no depende del email, de `user_metadata` ni de una allowlist editable. `is_admin()`, `is_staff()` y `can_write()` se resuelven contra ese único superadmin.

La allowlist anterior permanece anulada: `engine_allowlisted_role()` no concede ningún rol. El navegador no puede crear, modificar ni borrar perfiles internos. Cualquier cuenta de Supabase distinta del UUID de superadmin debe recibir `FORBIDDEN` aunque consiga autenticarse.

El acceso se realiza únicamente con email + contraseña. La sección **Activación** permite cambiar la contraseña desde una sesión válida. La contraseña no se almacena en el repositorio ni debe compartirse por chat.

## Fuentes conectadas de verdad

| Fuente | Adaptador | Cadencia | Alcance |
|---|---|---|---|
| Catálogo oficial Cardmarket | cardmarket_catalog | 24 h | Metadatos de producto sellado |
| Guía oficial Cardmarket | cardmarket_guide | 24 h | Referencia agregada, no oferta ejecutable |
| BCE | ecb_fx | 24 h | Tipos de cambio de referencia |
| eBay Browse España | ebay_browse | Desactivado | Requiere credenciales y autorización de producción |
| Ofertas de proveedores | supplier_import | Manual | Importación JSON de presupuestos/exportaciones autorizadas |
| Evidencia de mercado verificada | market_import | Manual | Listings/ventas cerradas auditables mientras se amplían APIs |

URLs oficiales usadas:
- https://downloads.s3.cardmarket.com/productCatalog/productList/products_nonsingles_6.json
- https://downloads.s3.cardmarket.com/productCatalog/priceGuide/price_guide_6.json
- https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml

Anuncios de la fuente:
- https://news.cardmarket.com/en/Pokemon/adding-non-singles-and-accessories-to-the-price-guide
- https://news.cardmarket.com/es/Pokemon/were-making-the-price-guide-and-product-catalogue-available-for-download

La guía no establece idioma, condición, transporte, tamaño de muestra ni volumen de ventas. No permite afirmar que un precio sea realizable ni que exista alta liquidez. En modo guía, el índice heurístico de calidad tiene un máximo de 25/100 y la liquidez es UNKNOWN. No es una probabilidad estadística de beneficio.

La ingesta inicial selecciona 100 booster boxes/ETBs con IDs reales. El idioma queda OTHER/UNVERIFIED hasta revisión. Cambiar el idioma del producto no convierte el agregado de la guía en una valoración específica de ese idioma. Las variantes deben seguir comprobándose antes de operar.

## Jobs activos

Horarios de cron en UTC; las fechas del panel se muestran en Europe/Madrid.

| Job | Expresión | Función |
|---|---|---|
| soriko-engine-dispatch | 7 * * * * | Encolar fuentes vencidas y recomputación cada hora |
| soriko-engine-consumer | */5 * * * * | Procesar únicamente si hay trabajo elegible |
| soriko-engine-nightly | 15 3 * * * | Recomposición nocturna de métricas |
| soriko-engine-cleanup | 40 3 * * * | Retención de registros operativos |

La cola durable usa Postgres, SKIP LOCKED, leases de 120 segundos, tokens de lease, reintentos exponenciales, máximo de tres intentos, claves idempotentes y estado DEAD. La hora de consulta y la publicación original de la fuente se conservan por separado. Descargar dos veces la misma publicación no crea observaciones independientes ni movimientos ficticios.

Las prioridades HOT/WATCH/LONG_TAIL existen en productos; la adaptación completa de frecuencia por SKU está pendiente. Actualmente los tres feeds oficiales se consultan diariamente y las métricas se recomputan cada hora. No se anuncia cobertura intradía que la fuente no proporcione.

Se eliminan jobs/runs correctos de más de 30 días y auditoría de API de más de 90 días. No se borra el histórico de precios con esta rutina.

## Seguridad

La función utiliza `verify_jwt=false` deliberadamente: implementa autorización propia para dos vías distintas. Las peticiones del equipo requieren JWT validado por Auth, sesión presente en auth.sessions y rol obtenido de la BBDD. La acción work exige un token de alta entropía conservado en Vault y verificado con su hash en un esquema privado. No deben eliminarse esas comprobaciones.

El frontend contiene únicamente URL y clave publishable de Supabase. La clave service_role permanece en el entorno de la Edge Function. Los secrets de Cloudflare se inyectan solo en el paso de despliegue, no durante instalación o build. Los workflows normales tienen permisos de repositorio de solo lectura.

RLS está activo. Las funciones privilegiadas del motor están revocadas para anon y authenticated. Las tablas engine_private tienen denegación explícita al navegador y no están expuestas. No se usa SECURITY DEFINER para eludir permisos.

El repositorio era público al inspeccionarlo. Cambiarlo a privado requiere permisos de administración del propietario. La seguridad de los datos no depende de mantener el código secreto, pero el código empresarial merece esa confidencialidad.

## Cálculos y simulación

El motor es determinista y no utiliza un LLM para precios, márgenes o scores. Separa ofertas anunciadas de ventas observadas, deduplica anuncios, filtra identidad no verificada, transporte desconocido, datos caducados y outliers; limita ponderación por vendedor y fuente.

Los importes de adquisición y logística de entrada son totales del lote, repartidos entre unidades. Los costes de venta modelan una unidad/pedido: cestas múltiples necesitan una política de reparto adicional. El PVP y el envío cobrado se convierten a ingresos sin IVA de venta. Las comisiones y la provisión de devoluciones se calculan sobre cobros brutos. El landed económico descuenta IVA de importación recuperable; el landed de caja incluye su anticipo.

Los valores fiscales y de comisiones iniciales son HIPÓTESIS EDITABLES, no un dictamen fiscal ni tarifas contratadas de Shopify. Se deben verificar régimen fiscal, recuperabilidad del IVA, clasificación aduanera, costes y país de destino de la operación. Un coste vacío sigue siendo desconocido; no se valida como cero.

El resultado incluye contribución por unidad, margen sobre ingreso neto, ROI sobre landed económico y sobre landed de caja, precio máximo de compra, límite landed, escenario de caída del PVP del 10% y beneficio matemático condicionado a vender todo. No es beneficio neto después de gastos fijos o impuesto sobre sociedades.

Las simulaciones manuales quedan en REVIEW o PASS; nunca se presentan como una oportunidad de proveedor verificada. No se inventan unidades recomendadas, ventas futuras o ganancias esperadas. Guardar una decisión no coloca un pedido. Las hipótesis, resultado y versión del modelo quedan asociados al análisis, con idempotencia por petición.

## Cómo aportar precios de compra

En Proveedores se admiten hasta 100 filas JSON. Se puede identificar el producto por `product_id`, `sku` o `product_name` exacto y el proveedor por `supplier_id` o `supplier_name` exacto. Son obligatorios `unit_price` positivo, `currency` EUR/JPY/USD/GBP y `tax_basis` NET/GROSS/UNKNOWN. Opcionales: `stock_qty`, `min_qty`, `valid_until` ISO y `source_url` HTTPS. No incluyas contraseñas, tokens o datos de compradores.

Las ofertas importadas aparecen en el panel y pueden abrirse directamente en **Analizar oferta**. La Edge Function convierte el precio de referencia a EUR con el último tipo BCE disponible, pero el usuario debe confirmar los costes reales de cambio, logística e importación antes de considerar el landed completo.

No hay APIs inventadas de JPFans, Neokyo o HeroTCG. La presencia en el directorio no acredita stock ni conexión automática. El importador conserva ofertas para calcular escenarios, pero todavía no produce arbitrajes aprobados automáticamente.

## Evidencia manual de mercado

La ruta `/admin/market/` permite incorporar hasta 100 observaciones verificables mientras las APIs automáticas se amplían. Admite `ASKING` y `SOLD`; una venta cerrada exige `sold_at` y todas las observaciones requieren precio y transporte conocido. La conversión a EUR se hace en backend. Una fila solo entra como identidad verificada si el producto canónico ya fue revisado y el operador marca explícitamente que la evidencia corresponde exactamente a la misma caja, idioma y variante. El resto queda en cuarentena y no debe impulsar el fair value.

Cada importación encola una recomputación de métricas. Esto permite empezar a construir liquidez e histórico con fuentes auditables sin fingir que una guía agregada equivale a ventas cerradas.

Para eBay: añade `EBAY_CLIENT_ID` y `EBAY_CLIENT_SECRET` en Supabase > Edge Functions > Secrets; obtén el acceso de producción correspondiente, registra `market_sources.config.production_access_approved=true` y activa la fuente desde el panel. El adaptador inicial procesa hasta diez identidades verificadas en eBay España y solo obtiene anuncios, no ventas cerradas. Hace falta ampliar lotes y cobertura antes de aplicarlo al universo completo.

## Verificación del código

```sh
npm ci
npm audit --audit-level=moderate
node --experimental-strip-types --test tests/engine.test.mjs
npx tsc --project tsconfig.edge.json
npm run build
npx wrangler deploy --dry-run
```

Wrangler queda fijado en 4.145.0 con lockfile verificado. Las GitHub Actions están fijadas por SHA. El despliegue genera `_build.json` con el commit exacto y verifica ese commit y las rutas públicas; tolera una propagación acotada y falla si la versión no aparece.

## Estado comprobado y límites

La ingesta inicial obtuvo 100 productos, 100 snapshots, 90 referencias de precio no nulas y 30 tipos de cambio. No se han creado oportunidades o ventas ficticias. Los gráficos necesitan más de una publicación real.

Pruebas: 16 tests numéricos; verificación de tipos Edge; compilación Next; aislamiento RLS entre cliente y administrador; rechazo 401 sin sesión; guardado idempotente y separación de coste económico/caja en transacciones revertidas. La auditoría de seguridad de Supabase terminó sin avisos tras el endurecimiento.

Pendiente externo/operativo: el propietario debe aceptar la invitación ya emitida y completar su acceso; prueba visual final con sesión autenticada; credenciales y aprobación de producción de eBay; primeras ofertas reales de HeroTCG/Japón; volumen de ventas cerradas suficiente; fuentes japonesas/B2B autorizadas; matching multivariante completo; recomendaciones automáticas de cantidad con backtesting calibrado; singles; sincronización Shopify; alertas externas; cobertura amplia por SKU.

La pantalla `/admin/setup/` muestra estas dependencias como checklist vivo. El repositorio GitHub sigue público hasta que el propietario cambie su visibilidad desde los ajustes del repositorio o se habilite una acción administrativa equivalente.

Las migraciones aplicadas están en el historial remoto de Supabase: engine_auth_foundation, soriko_engine_v1_schema, soriko_engine_rpc_and_views, soriko_engine_schedules_and_retention y soriko_engine_explicit_private_deny. La reproducción de una BBDD desde cero necesita exportar el esquema completo y la base previa con CLI autorizado; no se ha creado ni probado un entorno staging completo. Nunca exportes valores de Vault a GitHub.
