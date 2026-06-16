function PageHeader({
  eyebrow = 'Sistema académico',
  title,
  description,
  children
}) {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-brand-950 text-white shadow-soft p-6 lg:p-8">
      <div className="absolute -top-28 -right-24 w-80 h-80 bg-gold-500/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl" />

      <div className="relative flex flex-col xl:flex-row xl:items-end xl:justify-between gap-6">
        <div>
          <p className="text-sm font-extrabold text-gold-500 uppercase tracking-[0.2em]">
            {eyebrow}
          </p>

          <h1 className="text-3xl lg:text-4xl font-extrabold mt-3">
            {title}
          </h1>

          {description && (
            <p className="text-blue-100 mt-3 max-w-3xl">
              {description}
            </p>
          )}
        </div>

        {children && (
          <div className="flex flex-col sm:flex-row gap-3">
            {children}
          </div>
        )}
      </div>
    </section>
  );
}

export default PageHeader;