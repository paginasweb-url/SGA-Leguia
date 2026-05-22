import { useEffect, useState } from 'react';
import {
  Users,
  GraduationCap,
  BookOpen,
  Bell,
  CalendarDays,
  FileText,
  AlertCircle
} from 'lucide-react';

import DashboardLayout from '../layouts/DashboardLayout';
import api from '../services/api';

function Dashboard() {
  const user = JSON.parse(localStorage.getItem('user'));

  const [stats, setStats] = useState({
    total_estudiantes: 0,
    estudiantes_activos: 0,
    estudiantes_inactivos: 0,
    total_docentes: 0,
    total_usuarios: 0
  });

  useEffect(() => {
    const loadStats = async () => {
      try {
        const response = await api.get('/dashboard/stats');
        setStats(response.data.data);
      } catch (error) {
        console.error(error);
      }
    };

    loadStats();
  }, []);

  const cards = [
    {
      title: 'Estudiantes',
      value: stats.total_estudiantes,
      detail: `${stats.estudiantes_activos} activos`,
      icon: Users
    },
    {
      title: 'Docentes',
      value: stats.total_docentes,
      detail: 'Registrados',
      icon: GraduationCap
    },
    {
      title: 'Usuarios',
      value: stats.total_usuarios,
      detail: 'Cuentas del sistema',
      icon: BookOpen
    },
    {
      title: 'Inactivos',
      value: stats.estudiantes_inactivos,
      detail: 'Estudiantes',
      icon: AlertCircle
    }
  ];

  return (
    <DashboardLayout>
      <section className="space-y-6">

        <div>
          <p className="text-sm text-slate-500">
            Bienvenido de nuevo,
          </p>

          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">
            {user?.nombres || 'Director'} {user?.apellidos || ''}
          </h1>

          <p className="text-sm text-slate-500 mt-1">
            Resumen académico y administrativo de la institución.
          </p>
        </div>

        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {cards.map((card) => {
            const Icon = card.icon;

            return (
              <article
                key={card.title}
                className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-800 flex items-center justify-center">
                    <Icon size={20} />
                  </div>

                  <span className="text-[11px] px-2 py-1 rounded-full bg-slate-100 text-slate-500">
                    SGA
                  </span>
                </div>

                <p className="text-2xl font-bold text-slate-900">
                  {card.value}
                </p>

                <p className="text-sm text-slate-500">
                  {card.title}
                </p>

                <p className="text-xs text-slate-400 mt-2">
                  {card.detail}
                </p>
              </article>
            );
          })}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

          <section className="xl:col-span-2 bg-white border border-slate-200 rounded-xl shadow-sm">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-slate-900">
                  Estado institucional
                </h2>
                <p className="text-sm text-slate-500">
                  Vista general del periodo académico actual
                </p>
              </div>

              <CalendarDays size={20} className="text-slate-400" />
            </div>

            <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-lg bg-slate-50 border border-slate-200 p-4">
                <p className="text-sm text-slate-500">
                  Matrícula
                </p>
                <p className="text-xl font-bold text-slate-900 mt-1">
                  En seguimiento
                </p>
              </div>

              <div className="rounded-lg bg-slate-50 border border-slate-200 p-4">
                <p className="text-sm text-slate-500">
                  Asistencia
                </p>
                <p className="text-xl font-bold text-slate-900 mt-1">
                  Pendiente
                </p>
              </div>

              <div className="rounded-lg bg-slate-50 border border-slate-200 p-4">
                <p className="text-sm text-slate-500">
                  Notas
                </p>
                <p className="text-xl font-bold text-slate-900 mt-1">
                  Bimestre activo
                </p>
              </div>
            </div>
          </section>

          <section className="bg-white border border-slate-200 rounded-xl shadow-sm">
            <div className="p-5 border-b border-slate-200 flex items-center gap-2">
              <Bell size={19} className="text-blue-800" />
              <h2 className="font-bold text-slate-900">
                Comunicados recientes
              </h2>
            </div>

            <div className="divide-y divide-slate-100">
              <div className="p-4">
                <p className="text-sm font-semibold text-slate-900">
                  Reunión de coordinación
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Programada para esta semana
                </p>
              </div>

              <div className="p-4">
                <p className="text-sm font-semibold text-slate-900">
                  Registro de asistencia
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Módulo listo para próxima fase
                </p>
              </div>

              <div className="p-4">
                <p className="text-sm font-semibold text-slate-900">
                  Matrícula digital
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Expedientes en preparación
                </p>
              </div>
            </div>
          </section>
        </div>

        <section className="bg-white border border-slate-200 rounded-xl shadow-sm">
          <div className="p-5 border-b border-slate-200 flex items-center gap-2">
            <FileText size={19} className="text-blue-800" />
            <h2 className="font-bold text-slate-900">
              Actividad reciente
            </h2>
          </div>

          <div className="p-5 space-y-4">
            <div className="flex gap-3">
              <span className="mt-1 w-2 h-2 rounded-full bg-blue-700" />
              <div>
                <p className="text-sm font-medium text-slate-900">
                  Se registró un nuevo estudiante.
                </p>
                <p className="text-xs text-slate-500">
                  Hace unos minutos
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <span className="mt-1 w-2 h-2 rounded-full bg-blue-700" />
              <div>
                <p className="text-sm font-medium text-slate-900">
                  Autenticación con roles habilitada.
                </p>
                <p className="text-xs text-slate-500">
                  Backend protegido con JWT
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <span className="mt-1 w-2 h-2 rounded-full bg-blue-700" />
              <div>
                <p className="text-sm font-medium text-slate-900">
                  Dashboard conectado a Supabase.
                </p>
                <p className="text-xs text-slate-500">
                  Datos obtenidos desde PostgreSQL
                </p>
              </div>
            </div>
          </div>
        </section>

      </section>
    </DashboardLayout>
  );
}

export default Dashboard;