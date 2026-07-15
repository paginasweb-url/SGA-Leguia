import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  LifeBuoy,
  RefreshCw,
  ShieldCheck,
  Wrench
} from 'lucide-react';

const supportOptions = [
  {
    title: 'Reportar un problema en el sistema',
    description:
      'Informa errores de acceso, matrícula, asistencia, notas, reportes, avisos u otros módulos de SGA Leguía.',
    tag: 'Gestión de incidentes',
    icon: AlertTriangle,
    url: 'https://sgaleguia.atlassian.net/servicedesk/customer/portal/3/group/11/create/44'
  },
  {
    title: 'Gestión de disponibilidad del servicio',
    description:
      'Registra caídas, lentitud, errores de conexión o afectaciones que impidan el uso normal del sistema.',
    tag: 'Disponibilidad',
    icon: Clock3,
    url: 'https://sgaleguia.atlassian.net/servicedesk/customer/portal/3/group/12/create/49'
  },
  {
    title: 'Gestión de continuidad del servicio',
    description:
      'Reporta eventos críticos, recuperación del servicio, rollback, restauración o pruebas de continuidad.',
    tag: 'Continuidad',
    icon: RefreshCw,
    url: 'https://sgaleguia.atlassian.net/servicedesk/customer/portal/3/group/12/create/33'
  },
  {
    title: 'Solicitar un cambio',
    description:
      'Solicita mejoras, ajustes funcionales, cambios correctivos, preventivos o evolutivos del sistema.',
    tag: 'Gestión de cambios',
    icon: Wrench,
    url: 'https://sgaleguia.atlassian.net/servicedesk/customer/portal/3/group/14/create/46'
  }
];

function SupportPage() {
  return (
    <main className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl bg-brand-950 text-white shadow-soft p-6 lg:p-8">
        <div className="absolute -top-28 -right-24 w-80 h-80 bg-gold-500/20 rounded-full blur-3xl" />

        <div className="relative flex flex-col xl:flex-row xl:items-end xl:justify-between gap-6">
          <div>
            <p className="text-sm font-extrabold text-gold-500 uppercase tracking-[0.2em]">
              Mesa de servicio
            </p>

            <h1 className="text-3xl lg:text-4xl font-extrabold mt-3">
              Soporte TIC
            </h1>

            <p className="text-blue-100 mt-3 max-w-3xl leading-relaxed">
              Accede a la mesa de servicio de SGA Leguía para reportar incidentes,
              solicitar cambios o registrar eventos relacionados con continuidad y
              disponibilidad del sistema.
            </p>
          </div>

          <div className="bg-white/10 border border-white/10 rounded-3xl p-4 max-w-sm">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gold-500 text-brand-950 flex items-center justify-center shrink-0">
                <LifeBuoy size={23} />
              </div>

              <div>
                <p className="text-sm font-extrabold">
                  Atención mediante Jira Service Management
                </p>

                <p className="text-xs text-blue-100 mt-1 leading-relaxed">
                  Al abrir un formulario, Jira puede solicitar iniciar sesión con
                  un correo personal.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {supportOptions.map((item) => (
          <SupportCard key={item.title} item={item} />
        ))}
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <InfoBox
          icon={ShieldCheck}
          title="Trazabilidad"
          description="Cada solicitud enviada desde Jira queda registrada con estado, responsable, historial y evidencia."
        />

        <InfoBox
          icon={CheckCircle2}
          title="Seguimiento"
          description="El usuario puede revisar el avance de su solicitud directamente desde el portal de Jira."
        />

        <InfoBox
          icon={LifeBuoy}
          title="Soporte centralizado"
          description="Los reportes relacionados con SGA Leguía se gestionan desde una mesa de servicio TIC."
        />
      </section>

      <section className="bg-yellow-50 border border-yellow-100 rounded-3xl p-5">
        <p className="text-sm font-semibold text-warning leading-relaxed">
          Importante: los formularios se abren en una nueva pestaña para mantener
          activa tu sesión en SGA Leguía. El acceso a Jira Service Management se
          realiza con correo personal.
        </p>
      </section>
    </main>
  );
}

function SupportCard({ item }) {
  const Icon = item.icon;

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group bg-white border border-slate-200 rounded-3xl shadow-soft p-6 hover:-translate-y-1 hover:shadow-xl transition"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="w-14 h-14 rounded-2xl bg-brand-50 text-brand-900 flex items-center justify-center shrink-0 group-hover:bg-brand-900 group-hover:text-white transition">
          <Icon size={27} />
        </div>

        <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 border border-slate-200 px-3 py-1 text-xs font-extrabold text-slate-600">
          Jira
          <ArrowUpRight size={13} />
        </span>
      </div>

      <div className="mt-5">
        <p className="text-xs font-extrabold text-gold-600 uppercase tracking-[0.16em]">
          {item.tag}
        </p>

        <h2 className="text-xl font-extrabold text-brand-950 mt-2 leading-tight">
          {item.title}
        </h2>

        <p className="text-sm text-slate-500 mt-3 leading-relaxed">
          {item.description}
        </p>
      </div>

      <div className="mt-6 inline-flex items-center justify-center gap-2 w-full bg-brand-900 text-white px-4 py-3 rounded-xl font-extrabold group-hover:bg-brand-800 transition">
        Abrir formulario
        <ArrowUpRight size={18} />
      </div>
    </a>
  );
}

function InfoBox({ icon: Icon, title, description }) {
  return (
    <article className="bg-white border border-slate-200 rounded-3xl shadow-soft p-5">
      <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-900 flex items-center justify-center">
        <Icon size={24} />
      </div>

      <h3 className="text-lg font-extrabold text-brand-950 mt-4">
        {title}
      </h3>

      <p className="text-sm text-slate-500 mt-2 leading-relaxed">
        {description}
      </p>
    </article>
  );
}

export default SupportPage;