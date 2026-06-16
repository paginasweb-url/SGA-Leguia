import { Link } from 'react-router-dom';
import {
  ArrowRight,
  FileText,
  Search,
  Download,
  ShieldCheck,
  ClipboardCheck,
  Bell,
  GraduationCap,
  BookOpen,
  Users,
  CheckCircle2
} from 'lucide-react';

import heroImage from '../../assets/hero.png';

function Landing() {
  const quickActions = [
    {
      title: 'Solicitar matrícula',
      description: 'Registra una solicitud digital para el periodo escolar 2026.',
      path: '/matricula/solicitud',
      icon: FileText
    },
    {
      title: 'Consultar solicitud',
      description: 'Verifica el estado de tu trámite usando tu código de seguimiento.',
      path: '/matricula/seguimiento',
      icon: Search
    },
    {
      title: 'Descargar formatos',
      description: 'Accede a requisitos y documentos oficiales publicados.',
      path: '/matricula/formatos',
      icon: Download
    }
  ];

  const features = [
    {
      title: 'Matrícula digital',
      description: 'Registro de solicitudes, documentos y revisión administrativa.',
      icon: FileText
    },
    {
      title: 'Asistencia escolar',
      description: 'Control de asistencia por aula, fecha y estudiante.',
      icon: ClipboardCheck
    },
    {
      title: 'Notas bimestrales',
      description: 'Seguimiento académico con escala AD, A, B y C.',
      icon: BookOpen
    },
    {
      title: 'Comunicados',
      description: 'Avisos institucionales con confirmación de lectura.',
      icon: Bell
    }
  ];

  const steps = [
    'Completa la solicitud de matrícula.',
    'Adjunta los documentos requeridos.',
    'Guarda tu código de seguimiento.',
    'Espera la revisión del área administrativa.'
  ];

  return (
    <main>
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800 text-white">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute -top-32 -right-24 w-96 h-96 rounded-full bg-gold-500 blur-3xl" />
          <div className="absolute bottom-0 -left-28 w-96 h-96 rounded-full bg-blue-400 blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 lg:px-6 py-16 lg:py-24 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-2 text-sm font-semibold mb-6">
              <ShieldCheck size={16} />
              Plataforma institucional segura
            </span>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight">
              Gestión académica para la comunidad Leguía
            </h1>

            <p className="mt-6 text-blue-100 text-lg leading-relaxed max-w-xl">
              Sistema web para matrícula, asistencia, notas, comunicados y seguimiento
              académico de estudiantes de secundaria.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link
                to="/matricula/solicitud"
                className="bg-gold-500 text-brand-950 px-5 py-3 rounded-xl font-extrabold flex items-center justify-center gap-2 hover:bg-gold-100 transition"
              >
                Solicitar matrícula
                <ArrowRight size={18} />
              </Link>

              <Link
                to="/login"
                className="bg-white/10 border border-white/20 text-white px-5 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-white/20 transition"
              >
                Iniciar sesión
              </Link>
            </div>

            <div className="mt-10 grid grid-cols-3 gap-3 max-w-lg">
              <div className="bg-white/10 border border-white/15 rounded-2xl p-4">
                <p className="text-2xl font-extrabold">6</p>
                <p className="text-xs text-blue-100">Roles</p>
              </div>

              <div className="bg-white/10 border border-white/15 rounded-2xl p-4">
                <p className="text-2xl font-extrabold">AD-C</p>
                <p className="text-xs text-blue-100">Notas</p>
              </div>

              <div className="bg-white/10 border border-white/15 rounded-2xl p-4">
                <p className="text-2xl font-extrabold">2026</p>
                <p className="text-xs text-blue-100">Periodo</p>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="bg-white/10 border border-white/20 rounded-[2rem] p-4 shadow-2xl">
              <div className="bg-white rounded-[1.5rem] overflow-hidden">
                <img
                  src={heroImage}
                  alt="Colegio Augusto B. Leguía"
                  className="w-full h-72 object-cover"
                />

                <div className="p-6 text-slate-900">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-900 flex items-center justify-center">
                      <GraduationCap size={26} />
                    </div>

                    <div>
                      <h2 className="font-extrabold">
                        I.E. Augusto B. Leguía
                      </h2>
                      <p className="text-sm text-slate-500">
                        Educación secundaria presencial
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-2 gap-3">
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                      <Users className="text-brand-800 mb-2" size={22} />
                      <p className="text-sm font-bold">Estudiantes</p>
                      <p className="text-xs text-slate-500">Seguimiento académico</p>
                    </div>

                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                      <Bell className="text-brand-800 mb-2" size={22} />
                      <p className="text-sm font-bold">Comunicados</p>
                      <p className="text-xs text-slate-500">Avisos institucionales</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="hidden lg:block absolute -bottom-6 -left-6 bg-white rounded-2xl shadow-soft border border-slate-100 p-4 text-slate-900 max-w-xs">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="text-success" size={28} />
                <div>
                  <p className="font-bold text-sm">Matrícula en línea</p>
                  <p className="text-xs text-slate-500">
                    Solicitudes y documentos desde la plataforma.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 lg:px-6 -mt-8 relative z-10">
        <div className="grid md:grid-cols-3 gap-5">
          {quickActions.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.path}
                to={item.path}
                className="bg-white border border-slate-200 rounded-3xl p-6 shadow-soft hover:-translate-y-1 hover:shadow-xl transition"
              >
                <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-900 flex items-center justify-center mb-5">
                  <Icon size={25} />
                </div>

                <h3 className="font-extrabold text-slate-900">
                  {item.title}
                </h3>

                <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                  {item.description}
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 lg:px-6 py-16">
        <div className="grid lg:grid-cols-2 gap-10 items-start">
          <div>
            <span className="text-sm font-extrabold text-gold-600 uppercase tracking-wide">
              Plataforma académica
            </span>

            <h2 className="text-3xl lg:text-4xl font-extrabold text-brand-950 mt-3">
              Un sistema para organizar la gestión escolar
            </h2>

            <p className="text-slate-600 mt-4 leading-relaxed">
              El SGA Leguía centraliza procesos importantes del colegio, permitiendo
              que cada rol acceda solo a los módulos que le corresponden.
            </p>

            <div className="mt-8 grid sm:grid-cols-2 gap-4">
              {features.map((item) => {
                const Icon = item.icon;

                return (
                  <article
                    key={item.title}
                    className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm"
                  >
                    <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-900 flex items-center justify-center mb-4">
                      <Icon size={22} />
                    </div>

                    <h3 className="font-bold text-slate-900">
                      {item.title}
                    </h3>

                    <p className="text-sm text-slate-500 mt-2">
                      {item.description}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>

          <div className="bg-brand-950 text-white rounded-[2rem] p-6 lg:p-8 shadow-soft">
            <span className="inline-flex bg-white/10 text-gold-100 rounded-full px-4 py-2 text-sm font-bold">
              Proceso de matrícula
            </span>

            <h2 className="text-2xl font-extrabold mt-5">
              Matrícula 2026
            </h2>

            <p className="text-blue-100 text-sm mt-2">
              El apoderado puede iniciar el proceso desde la landing pública.
            </p>

            <div className="mt-7 space-y-4">
              {steps.map((step, index) => (
                <div
                  key={step}
                  className="flex gap-4 bg-white/10 border border-white/10 rounded-2xl p-4"
                >
                  <div className="w-9 h-9 rounded-full bg-gold-500 text-brand-950 flex items-center justify-center font-extrabold shrink-0">
                    {index + 1}
                  </div>

                  <div>
                    <p className="font-bold">
                      {step}
                    </p>

                    <p className="text-xs text-blue-100 mt-1">
                      Paso {index + 1} del proceso digital.
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <Link
              to="/matricula/solicitud"
              className="mt-7 inline-flex items-center justify-center gap-2 w-full bg-gold-500 text-brand-950 px-5 py-3 rounded-xl font-extrabold hover:bg-gold-100 transition"
            >
              Iniciar solicitud
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      <footer className="bg-brand-950 text-white">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-8 flex flex-col md:flex-row gap-4 justify-between">
          <div>
            <p className="font-extrabold">
              I.E. Augusto B. Leguía
            </p>
            <p className="text-sm text-blue-100">
              Sistema de Gestión Académica
            </p>
          </div>

          <p className="text-sm text-blue-100">
            © 2026 — Plataforma académica institucional
          </p>
        </div>
      </footer>
    </main>
  );
}

export default Landing;