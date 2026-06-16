import DashboardLayout from '../../layouts/DashboardLayout';

function ModulePage({ title, description, children }) {
  return (
    <DashboardLayout>
      <section className="space-y-5">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">
            {title}
          </h1>

          {description && (
            <p className="text-sm text-slate-500 mt-1">
              {description}
            </p>
          )}
        </div>

        {children || (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
            <p className="text-slate-600 text-sm">
              Módulo preparado para conectarse con el backend.
            </p>
          </div>
        )}
      </section>
    </DashboardLayout>
  );
}

export default ModulePage;