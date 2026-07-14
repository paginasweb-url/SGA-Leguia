import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  GraduationCap,
  Loader2,
  Megaphone,
  RefreshCw
} from 'lucide-react';

import {
  getMyAnnouncements,
  markAnnouncementAsRead
} from '../services/announcements.service';

import {
  getMyNotifications,
  markNotificationAsRead
} from '../services/notifications.service';

import { getRole } from '../utils/storage';

const announcementsPathByRole = {
  Director: '/director/announcements',
  Administrativo: '/admin/announcements',
  Docente: '/teacher/announcements',
  Auxiliar: '/auxiliary/announcements',
  Estudiante: '/student/announcements',
  Apoderado: '/guardian/announcements'
};

const attendancePathByRole = {
  Director: '/director/attendance',
  Administrativo: '/admin/attendance',
  Auxiliar: '/auxiliary/attendance',
  Estudiante: '/student/attendance',
  Apoderado: '/guardian/attendance'
};

const gradesPathByRole = {
  Director: '/director/grades',
  Administrativo: '/admin/grades',
  Docente: '/teacher/grades',
  Estudiante: '/student/grades',
  Apoderado: '/guardian/grades'
};

const calendarPathByRole = {
  Director: '/director/calendar',
  Administrativo: '/admin/calendar',
  Docente: '/teacher/calendar',
  Auxiliar: '/auxiliary/calendar',
  Estudiante: '/student/calendar',
  Apoderado: '/guardian/calendar'
};

const reinforcementPathByRole = {
  Director: '/director/reinforcements',
  Administrativo: '/admin/reinforcements',
  Auxiliar: '/auxiliary/reinforcements',
  Docente: '/teacher/reinforcements',
  Estudiante: '/student/reinforcements',
  Apoderado: '/guardian/reinforcements'
};

const readRoles = ['Docente', 'Auxiliar', 'Estudiante', 'Apoderado'];

function NotificationsDropdown() {
  const role = getRole();
  const navigate = useNavigate();
  const wrapperRef = useRef(null);

  const [open, setOpen] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [markingKey, setMarkingKey] = useState(null);
  const [error, setError] = useState('');

  const targetPath = announcementsPathByRole[role] || '/dashboard';
  const attendancePath = attendancePathByRole[role] || '/dashboard';
  const gradesPath = gradesPathByRole[role] || '/dashboard';
  const calendarPath = calendarPathByRole[role] || '/dashboard';
  const reinforcementPath = reinforcementPathByRole[role] || '/dashboard';
  const canConfirmRead = readRoles.includes(role);

  const normalizedItems = useMemo(() => {
    const announcementItems = announcements.map((item) => ({
      id: item.id,
      source: 'announcement',
      title: item.titulo || 'Aviso',
      content: item.contenido || 'Sin contenido adicional.',
      date: item.fecha || item.created_at,
      unread: canConfirmRead ? !item.leido : false,
      raw: item
    }));

    const notificationItems = notifications.map((item) => ({
      id: item.id,
      source: 'notification',
      title: getNotificationTitle(item),
      content: item.mensaje || 'Sin mensaje registrado.',
      date: item.fecha || item.created_at,
      unread: item.estado !== 'leida',
      raw: item
    }));

    return [...announcementItems, ...notificationItems]
      .sort((a, b) => {
        const dateA = parseBackendTimestamp(a.date)?.getTime() || 0;
        const dateB = parseBackendTimestamp(b.date)?.getTime() || 0;

        return dateB - dateA;
      });
  }, [announcements, notifications, canConfirmRead]);

  const unreadCount = useMemo(() => {
    return normalizedItems.filter((item) => item.unread).length;
  }, [normalizedItems]);

  const recentItems = useMemo(() => {
    return normalizedItems.slice(0, 6);
  }, [normalizedItems]);

  const loadNotificationCenter = async () => {
    try {
      setError('');
      setLoading(true);

      const [announcementsResponse, notificationsResponse] = await Promise.all([
        getMyAnnouncements(),
        getMyNotifications(10)
      ]);

      setAnnouncements(announcementsResponse.data || []);
      setNotifications(notificationsResponse.data || []);

    } catch (error) {
      setError(
        error?.response?.data?.error ||
        'No se pudieron cargar las notificaciones.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotificationCenter();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!wrapperRef.current) return;

      if (!wrapperRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleToggle = () => {
    setOpen((prev) => !prev);

    if (!open) {
      loadNotificationCenter();
    }
  };

  const handleMarkAnnouncementAsRead = async (announcement) => {
    if (!announcement?.id || announcement.leido || !canConfirmRead) return;

    const key = `announcement-${announcement.id}`;

    try {
      setMarkingKey(key);

      await markAnnouncementAsRead(announcement.id);

      setAnnouncements((prev) =>
        prev.map((item) =>
          item.id === announcement.id
            ? {
                ...item,
                leido: true,
                fecha_lectura: new Date().toISOString()
              }
            : item
        )
      );

    } catch (error) {
      setError(
        error?.response?.data?.error ||
        'No se pudo confirmar la lectura.'
      );
    } finally {
      setMarkingKey(null);
    }
  };

  const handleMarkNotificationAsRead = async (notification) => {
    if (!notification?.id || notification.estado === 'leida') return;

    const key = `notification-${notification.id}`;

    try {
      setMarkingKey(key);

      await markNotificationAsRead(notification.id);

      setNotifications((prev) =>
        prev.map((item) =>
          item.id === notification.id
            ? {
                ...item,
                estado: 'leida'
              }
            : item
        )
      );

    } catch (error) {
      setError(
        error?.response?.data?.error ||
        'No se pudo marcar la notificación como leída.'
      );
    } finally {
      setMarkingKey(null);
    }
  };

  const handleOpenItem = async (item) => {
    if (!item?.id) return;

    if (item.source === 'announcement') {
      if (canConfirmRead && !item.raw?.leido) {
        await handleMarkAnnouncementAsRead(item.raw);
      }

      setOpen(false);

      navigate(targetPath, {
        state: {
          openAnnouncementId: item.id
        }
      });

      return;
    }

    if (item.source === 'notification') {
    if (item.raw?.estado !== 'leida') {
      await handleMarkNotificationAsRead(item.raw);
    }

    setOpen(false);

    if (item.raw?.tipo === 'alerta_academica') {
      navigate(gradesPath);
      return;
    }

    if (item.raw?.tipo === 'alerta_asistencia') {
      navigate(attendancePath);
      return;
    }

    if (item.raw?.tipo === 'evento_calendario') {
      navigate(calendarPath);
      return;
    }

    if (item.raw?.tipo === 'reforzamiento_academico') {
      navigate(reinforcementPath);
      return;
    }

    navigate('/dashboard');
  }
  };

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={handleToggle}
        className="relative w-10 h-10 rounded-2xl border border-slate-200 bg-white text-brand-950 flex items-center justify-center hover:bg-brand-50 hover:border-brand-100 transition"
        aria-label="Abrir notificaciones"
      >
        <Bell size={18} />

        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-gold-500 text-brand-950 text-[11px] font-extrabold flex items-center justify-center shadow-sm">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed left-3 right-3 top-16 mt-0 max-h-[calc(100vh-5rem)] bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden z-[90] sm:absolute sm:left-auto sm:right-0 sm:top-auto sm:mt-3 sm:w-[min(92vw,420px)] sm:max-h-none">
          <div className="p-5 bg-brand-950 text-white relative overflow-hidden">
            <div className="absolute -top-16 -right-16 w-40 h-40 bg-gold-500/20 rounded-full blur-2xl" />

            <div className="relative flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs font-extrabold text-gold-500 uppercase tracking-[0.18em]">
                  Centro de notificaciones
                </p>

                <h3 className="text-lg font-extrabold mt-1">
                  Avisos y alertas recientes
                </h3>

                <p className="text-sm text-blue-100 mt-1">
                  {unreadCount > 0
                    ? `${unreadCount} notificación(es) pendiente(s).`
                    : 'No tienes notificaciones pendientes.'}
                </p>
              </div>

              <button
                type="button"
                onClick={loadNotificationCenter}
                disabled={loading}
                className="w-9 h-9 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center hover:bg-white/20 disabled:opacity-60 transition shrink-0"
                aria-label="Actualizar notificaciones"
              >
                <RefreshCw
                  size={17}
                  className={loading ? 'animate-spin' : ''}
                />
              </button>
            </div>
          </div>

          <div className="max-h-[55vh] sm:max-h-[390px] overflow-y-auto divide-y divide-slate-100">
            {loading ? (
              <div className="p-8 text-center">
                <Loader2 className="mx-auto animate-spin text-brand-900" size={30} />

                <p className="text-sm text-slate-500 font-semibold mt-3">
                  Cargando notificaciones...
                </p>
              </div>
            ) : error ? (
              <div className="p-6 text-center">
                <p className="text-sm text-danger font-semibold">
                  {error}
                </p>
              </div>
            ) : recentItems.length > 0 ? (
              recentItems.map((item) => {
                const key = `${item.source}-${item.id}`;
                const Icon =
                  item.source === 'notification'
                    ? item.raw?.tipo === 'alerta_academica'
                      ? GraduationCap
                      : item.raw?.tipo === 'evento_calendario'
                        ? CalendarDays
                        : item.raw?.tipo === 'reforzamiento_academico'
                          ? GraduationCap
                          : AlertTriangle
                    : Megaphone;

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleOpenItem(item)}
                    className="w-full text-left p-4 sm:p-5 hover:bg-slate-50 transition"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                          item.unread
                            ? item.source === 'notification'
                              ? 'bg-red-50 text-danger'
                              : 'bg-brand-50 text-brand-900'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {markingKey === key ? (
                          <Loader2 size={20} className="animate-spin" />
                        ) : item.unread ? (
                          <Icon size={21} />
                        ) : (
                          <CheckCircle2 size={21} />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-extrabold text-brand-950 line-clamp-1 text-sm sm:text-base">
                            {item.title}
                          </p>

                          <span
                            className={`shrink-0 inline-flex rounded-full px-2.5 py-1 text-[10px] sm:text-[11px] font-extrabold border ${
                              item.unread
                                ? item.source === 'notification'
                                  ? 'bg-red-50 text-danger border-red-100'
                                  : 'bg-yellow-50 text-warning border-yellow-100'
                                : 'bg-green-50 text-success border-green-100'
                            }`}
                          >
                            {item.unread ? 'Pendiente' : 'Leído'}
                          </span>
                        </div>

                        <p className="text-sm text-slate-500 mt-1 line-clamp-2">
                          {item.content}
                        </p>

                        <p className="text-xs text-slate-400 mt-2">
                          {formatDateTime(item.date)}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="p-8 text-center">
                <Bell className="mx-auto text-slate-300" size={38} />

                <p className="text-sm text-slate-500 mt-3">
                  No hay notificaciones disponibles.
                </p>
              </div>
            )}
          </div>

          <div className="p-4 bg-slate-50 border-t border-slate-100">
            <Link
              to={targetPath}
              onClick={() => setOpen(false)}
              className="w-full inline-flex items-center justify-center gap-2 bg-brand-900 text-white px-4 py-3 rounded-xl text-sm font-extrabold hover:bg-brand-800 transition"
            >
              Ver todos los avisos
              <ChevronRight size={17} />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function getNotificationTitle(item) {
  if (item.tipo === 'alerta_asistencia') {
    return 'Alerta de asistencia';
  }

  if (item.tipo === 'alerta_academica') {
    return 'Alerta académica';
  }

  if (item.tipo === 'evento_calendario') {
    return 'Evento de calendario';
  }

  if (item.tipo === 'reforzamiento_academico') {
    return 'Reforzamiento académico';
  }

  return 'Notificación';
}

const PERU_TIME_ZONE = 'America/Lima';

function parseBackendTimestamp(value) {
  if (!value) return null;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const text = String(value).trim();

  if (!text) return null;

  const normalizedText = text.replace(' ', 'T');

  const hasTimezone =
    normalizedText.endsWith('Z') ||
    /[+-]\d{2}:?\d{2}$/.test(normalizedText);

  const date = new Date(
    hasTimezone ? normalizedText : `${normalizedText}Z`
  );

  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDateTime(value) {
  const date = parseBackendTimestamp(value);

  if (!date) return 'Fecha no registrada';

  return new Intl.DateTimeFormat('es-PE', {
    timeZone: PERU_TIME_ZONE,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }).format(date);
}

export default NotificationsDropdown;