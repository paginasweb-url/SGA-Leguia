import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  BarChart3,
  BookOpen,
  CalendarCheck,
  GraduationCap,
  LayoutGrid,
  Loader2,
  RefreshCw,
  ShieldAlert,
  UserRound,
  Users
} from 'lucide-react';
import { Link } from 'react-router-dom';

import PageHeader from '../../components/PageHeader';
import { getMyGuardianChildren } from '../../services/guardianChildren.service';

function getAttendanceTotals(summary = []) {
  const totals = {
    total: 0,
    presente: 0,
    tarde: 0,
    falta: 0,
    justificado: 0
  };

  summary.forEach((item) => {
    const estado = item.estado;
    const total = Number(item.total || 0);

    totals.total += total;

    if (totals[estado] !== undefined) {
      totals[estado] = total;
    }
  });

  return totals;
}

function getUniqueCourses(grades = []) {
  const map = new Map();

  grades.forEach((grade) => {
    if (!map.has(grade.curso_id)) {
      map.set(grade.curso_id, {
        curso_id: grade.curso_id,
        curso: grade.curso,
        total_notas: 0
      });
    }

    map.get(grade.curso_id).total_notas += 1;
  });

  return [...map.values()];
}

function GuardianChildren() {
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadChildren = async ({ silent = false } = {}) => {
    try {
      setError('');

      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await getMyGuardianChildren();

      if (response.type !== 'guardian') {
        setChildren([]);
        return;
      }

      setChildren(response.data?.children || []);
    } catch (error) {
      setError(
        error?.response?.data?.error ||
          'No se pudieron cargar los estudiantes vinculados.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadChildren();
  }, []);

  const counters = useMemo(() => {
    const totalGrades = children.reduce(
      (sum, child) => sum + Number(child.grades?.length || 0),
      0
    );

    const totalAlerts = children.reduce(
      (sum, child) => sum + Number(child.risk_alerts?.length || 0),
      0
    );

    const totalAttendance = children.reduce((sum, child) => {
      const totals = getAttendanceTotals(child.attendance_summary || []);
      return sum + totals.total;
    }, 0);

    return {
      children: children.length,
      grades: totalGrades,
      attendance: totalAttendance,
      alerts: totalAlerts
    };
  }, [children]);

  if (loading) {
    return <Loading text="Cargando estudiantes vinculados..." />;
  }

  return (
    <main className="space-y-6">
      <PageHeader
        eyebrow="Portal Apoderado"
        title="Mis hijos"
        description="Consulta los estudiantes vinculados a tu cuenta y accede rápidamente a su información académica."
      >
        <button
          type="button"
          onClick={() => loadChildren({ silent: true })}
          disabled={refreshing}
          className="inline-flex items-center justify-center gap-2 bg-white/10 border border-white/10 text-white px-4 py-3 rounded-xl font-extrabold hover:bg-white/20 disabled:opacity-60 transition"
        >
          <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
          Actualizar
        </button>
      </PageHeader>

      {error && <ErrorMessage text={error} />}

      <section className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <CounterCard icon={Users} label="Hijos vinculados" value={counters.children} />
        <CounterCard icon={BookOpen} label="Notas registradas" value={counters.grades} />
        <CounterCard icon={CalendarCheck} label="Asistencias" value={counters.attendance} />
        <CounterCard icon={ShieldAlert} label="Alertas" value={counters.alerts} />
      </section>

      {children.length > 0 ? (
        <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {children.map((child) => (
            <ChildCard
              key={child.student?.estudiante_id}
              child={child}
            />
          ))}
        </section>
      ) : (
        <EmptyState text="No tienes estudiantes vinculados a tu cuenta." />
      )}
    </main>
  );
}

function ChildCard({ child }) {
  const student = child.student || {};
  const grades = child.grades || [];
  const riskAlerts = child.risk_alerts || [];
  const courses = getUniqueCourses(grades);
  const attendanceTotals = getAttendanceTotals(child.attendance_summary || []);

  return (
    <article className="bg-white border border-slate-200 rounded-3xl shadow-soft overflow-hidden">
      <div className="p-6 bg-brand-950 text-white">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gold-500 text-brand-950 flex items-center justify-center font-extrabold text-xl shrink-0">
            {student.nombres?.charAt(0) || 'E'}
          </div>

          <div className="min-w-0">
            <p className="text-xs font-extrabold text-gold-500 uppercase tracking-[0.16em]">
              {child.parentesco || child.relacion || 'Estudiante vinculado'}
            </p>

            <h2 className="text-2xl font-extrabold mt-2 truncate">
              {student.nombres} {student.apellidos}
            </h2>

            <p className="text-sm text-blue-100 mt-1">
              {student.grado || 'Grado no asignado'} {student.seccion || ''} · Turno {student.turno || 'No precisa'}
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-5">
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InfoItem label="Código" value={student.codigo_estudiante || 'No precisa'} />
          <InfoItem label="DNI" value={student.dni || 'No precisa'} />
          <InfoItem label="Aula" value={student.aula || `${student.grado || ''} ${student.seccion || ''}`.trim() || 'No precisa'} />
          <InfoItem label="Estado" value={student.estado || student.matricula_estado || 'Activo'} />
        </section>

        <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MiniStat label="Cursos" value={courses.length} />
          <MiniStat label="Notas" value={grades.length} />
          <MiniStat label="Faltas" value={attendanceTotals.falta} />
          <MiniStat label="Alertas" value={riskAlerts.length} />
        </section>

        <section>
          <h3 className="font-extrabold text-brand-950 mb-3">
            Accesos rápidos
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <QuickLink to="/guardian/attendance" icon={CalendarCheck} label="Ver asistencia" />
            <QuickLink to="/guardian/grades" icon={BookOpen} label="Ver notas" />
            <QuickLink to="/guardian/schedule" icon={LayoutGrid} label="Ver horario" />
            <QuickLink to="/guardian/annual-result" icon={BarChart3} label="Resultado anual" />
            <QuickLink to="/guardian/progress" icon={GraduationCap} label="Ver progreso" />
          </div>
        </section>

        {riskAlerts.length > 0 && (
          <section className="rounded-2xl border border-red-100 bg-red-50 p-4">
            <div className="flex items-start gap-3">
              <ShieldAlert className="text-red-600 shrink-0 mt-0.5" size={20} />

              <div>
                <p className="font-extrabold text-red-700">
                  Tiene {riskAlerts.length} alerta(s) académica(s)
                </p>

                <p className="text-sm text-red-600 mt-1">
                  Revisa el módulo Mi progreso para ver sugerencias de reforzamiento.
                </p>
              </div>
            </div>
          </section>
        )}
      </div>
    </article>
  );
}

function QuickLink({ to, icon: Icon, label }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-50 border border-slate-100 text-slate-700 hover:bg-brand-50 hover:text-brand-950 transition font-extrabold text-sm"
    >
      <Icon size={18} />
      {label}
    </Link>
  );
}

function CounterCard({ icon: Icon, label, value }) {
  return (
    <div className="bg-white border border-slate-200 rounded-3xl shadow-soft p-6">
      <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-900 flex items-center justify-center">
        <Icon size={24} />
      </div>

      <p className="text-sm font-bold text-slate-500 mt-5">
        {label}
      </p>

      <p className="text-3xl font-extrabold text-brand-950 mt-2">
        {Number(value || 0).toLocaleString('es-PE')}
      </p>
    </div>
  );
}

function InfoItem({ label, value }) {
  return (
    <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4">
      <p className="text-xs font-bold text-slate-500">
        {label}
      </p>

      <p className="font-extrabold text-brand-950 mt-1">
        {value}
      </p>
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4 text-center">
      <p className="text-xs font-bold text-slate-500">
        {label}
      </p>

      <p className="text-xl font-extrabold text-brand-950 mt-1">
        {value || 0}
      </p>
    </div>
  );
}

function Loading({ text }) {
  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="mx-auto animate-spin text-brand-900" size={36} />
        <p className="mt-4 text-sm font-semibold text-slate-500">
          {text}
        </p>
      </div>
    </div>
  );
}

function ErrorMessage({ text }) {
  return (
    <div className="bg-red-50 border border-red-100 text-danger rounded-2xl p-4 flex gap-3">
      <AlertCircle size={20} className="shrink-0 mt-0.5" />
      <p className="text-sm font-semibold">{text}</p>
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <section className="bg-white border border-slate-200 rounded-3xl shadow-soft p-10 text-center">
      <UserRound className="mx-auto text-slate-300" size={46} />
      <p className="text-sm text-slate-500 mt-3">{text}</p>
    </section>
  );
}

export default GuardianChildren;