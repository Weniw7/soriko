const modules = [
  ["Market Radar", "European pricing, demand and rotation"],
  ["Japan Scanner", "Japan sourcing and proxy opportunities"],
  ["Suppliers", "B2B suppliers, proxies and commercial terms"],
  ["Opportunities", "Landed cost, margin, ROI and buy score"],
  ["Purchasing", "Purchase orders and inbound stock"],
  ["Inventory", "Lots, cost basis, sell-through and ageing"],
];

export default function AdminPage() {
  return (
    <main className="adminShell">
      <div className="adminHeader">
        <div>
          <p className="eyebrow">SORIKO ENGINE</p>
          <h1>Operations</h1>
        </div>
        <span className="status">Foundation</span>
      </div>

      <div className="grid">
        {modules.map(([name, description]) => (
          <article className="card" key={name}>
            <h2>{name}</h2>
            <p>{description}</p>
          </article>
        ))}
      </div>

      <p className="notice">
        Admin authentication will be enabled with the dedicated Supabase project before production exposure.
      </p>
    </main>
  );
}
