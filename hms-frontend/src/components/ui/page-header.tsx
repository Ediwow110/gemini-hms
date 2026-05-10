export const PageHeader = ({ title, description }: { title: string; description: string }) => (
  <div className="mb-2">
    <h1
      className="text-2xl font-extrabold text-slate-900 tracking-tight"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      {title}
    </h1>
    <p className="text-slate-500 text-sm mt-1">{description}</p>
  </div>
);
