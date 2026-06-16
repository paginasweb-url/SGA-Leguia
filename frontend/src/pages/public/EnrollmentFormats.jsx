import { useEffect, useState } from 'react';
import {
  Download,
  FileText,
  RefreshCw,
  AlertCircle,
  ExternalLink,
  CheckCircle2,
  Search,
  CalendarDays
} from 'lucide-react';

import {
  getPublicEnrollmentFormats,
  downloadEnrollmentFormat,
  getEnrollmentFormatDownloadUrl
} from '../../services/enrollmentFormats.service';

function EnrollmentFormats() {
  const [formats, setFormats] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);
  const [error, setError] = useState('');

  const loadFormats = async () => {
    try {
      setError('');
      setLoading(true);

      const response = await getPublicEnrollmentFormats();
      setFormats(response.data || []);
    } catch (error) {
      setError(
        error?.response?.data?.error ||
        'No se pudieron cargar los formatos de matrícula.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFormats();
  }, []);

  const handleDownload = async (format) => {
    try {
      setDownloadingId(format.id);

      await downloadEnrollmentFormat(
        format.id,
        format.nombre_archivo || 'formato_matricula.pdf'
      );
    } catch (error) {
      setError(
        error?.response?.data?.error ||
        'No se pudo descargar el archivo PDF.'
      );
    } finally {
      setDownloadingId(null);
    }
  };

  const filteredFormats = formats.filter((format) => {
    const text = `${format.titulo} ${format.descripcion} ${format.nombre_archivo}`.toLowerCase();
    return text.includes(search.toLowerCase());
  });

  const formatDate = (value) => {
    if (!value) return 'No precisa';

    return new Date(value).toLocaleDateString('es-PE', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <main className="bg-[#F7F9FB]">
      <section className="bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800 text-white relative overflow-hidden">
        <div className="absolute -top-28 -right-24 w-96 h-96 rounded-full bg-gold-500/20 blur-3xl" />
        <div className="absolute bottom-0 -left-28 w-96 h-96 rounded-full bg-blue-400/20 blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 lg:px-6 py-14 lg:py-20">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-2 text-sm font-semibold mb-5">
              <FileText size={16} />
              Documentos oficiales
            </span>

            <h1 className="text-4xl lg:text-5xl font-extrabold leading-tight">
              Formatos de matrícula
            </h1>

            <p className="mt-5 text-blue-100 text-lg leading-relaxed">
              Descarga los requisitos y formatos oficiales publicados por el colegio para el proceso de matrícula escolar.
            </p>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 lg:px-6 py-10 lg:py-14">
        <div className="grid lg:grid-cols-3 gap-6">
          <aside className="lg:col-span-1 space-y-5">
            <div className="bg-white border border-slate-200 rounded-3xl shadow-soft p-6">
              <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-900 flex items-center justify-center mb-5">
                <CheckCircle2 size={25} />
              </div>

              <h2 className="font-extrabold text-brand-950 text-xl">
                Matrícula 2026
              </h2>

              <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                Revisa cada documento antes de iniciar la solicitud digital. Los archivos se descargan en formato PDF.
              </p>

              <div className="mt-6 space-y-3">
                <div className="flex gap-3">
                  <span className="w-7 h-7 rounded-full bg-gold-500 text-brand-950 font-extrabold text-sm flex items-center justify-center shrink-0">
                    1
                  </span>
                  <p className="text-sm text-slate-600">
                    Descarga los requisitos vigentes.
                  </p>
                </div>

                <div className="flex gap-3">
                  <span className="w-7 h-7 rounded-full bg-gold-500 text-brand-950 font-extrabold text-sm flex items-center justify-center shrink-0">
                    2
                  </span>
                  <p className="text-sm text-slate-600">
                    Prepara tus documentos.
                  </p>
                </div>

                <div className="flex gap-3">
                  <span className="w-7 h-7 rounded-full bg-gold-500 text-brand-950 font-extrabold text-sm flex items-center justify-center shrink-0">
                    3
                  </span>
                  <p className="text-sm text-slate-600">
                    Registra la solicitud de matrícula.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-brand-950 text-white rounded-3xl p-6 shadow-soft">
              <h3 className="font-extrabold text-lg">
                ¿Ya tienes tus documentos?
              </h3>

              <p className="text-sm text-blue-100 mt-2">
                Puedes continuar con la solicitud digital desde la plataforma.
              </p>

              <a
                href="/matricula/solicitud"
                className="mt-5 inline-flex items-center justify-center w-full bg-gold-500 text-brand-950 px-4 py-3 rounded-xl font-extrabold hover:bg-gold-100 transition"
              >
                Ir a solicitud
              </a>
            </div>
          </aside>

          <section className="lg:col-span-2 space-y-5">
            <div className="bg-white border border-slate-200 rounded-3xl shadow-soft p-5">
              <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
                <div>
                  <h2 className="font-extrabold text-brand-950 text-xl">
                    Documentos disponibles
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">
                    {loading
                      ? 'Cargando formatos...'
                      : `${filteredFormats.length} formato(s) encontrado(s)`}
                  </p>
                </div>

                <button
                  onClick={loadFormats}
                  disabled={loading}
                  className="inline-flex items-center justify-center gap-2 bg-slate-100 text-slate-700 px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-200 disabled:opacity-60"
                >
                  <RefreshCw size={17} className={loading ? 'animate-spin' : ''} />
                  Actualizar
                </button>
              </div>

              <div className="relative mt-5">
                <Search size={18} className="absolute left-3 top-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar por título, descripción o archivo..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-800"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 text-danger rounded-2xl p-4 flex gap-3">
                <AlertCircle size={20} className="shrink-0 mt-0.5" />
                <p className="text-sm font-semibold">
                  {error}
                </p>
              </div>
            )}

            {loading && (
              <div className="grid sm:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((item) => (
                  <div
                    key={item}
                    className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm animate-pulse"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-slate-200 mb-5" />
                    <div className="h-4 bg-slate-200 rounded w-3/4 mb-3" />
                    <div className="h-3 bg-slate-100 rounded w-full mb-2" />
                    <div className="h-3 bg-slate-100 rounded w-2/3" />
                    <div className="h-10 bg-slate-200 rounded-xl mt-6" />
                  </div>
                ))}
              </div>
            )}

            {!loading && filteredFormats.length === 0 && (
              <div className="bg-white border border-slate-200 rounded-3xl shadow-soft p-8 text-center">
                <div className="mx-auto w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mb-4">
                  <FileText size={32} />
                </div>

                <h3 className="font-extrabold text-slate-900">
                  No hay formatos disponibles
                </h3>

                <p className="text-sm text-slate-500 mt-2">
                  Actualmente no existen documentos activos para mostrar.
                </p>
              </div>
            )}

            {!loading && filteredFormats.length > 0 && (
              <div className="grid sm:grid-cols-2 gap-4">
                {filteredFormats.map((format) => (
                  <article
                    key={format.id}
                    className="bg-white border border-slate-200 rounded-3xl p-5 shadow-soft hover:-translate-y-1 transition"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-900 flex items-center justify-center shrink-0">
                        <FileText size={25} />
                      </div>

                      <span className="bg-green-50 text-success border border-green-100 rounded-full px-3 py-1 text-xs font-extrabold">
                        Activo
                      </span>
                    </div>

                    <h3 className="font-extrabold text-brand-950 text-lg mt-5 leading-snug">
                      {format.titulo}
                    </h3>

                    <p className="text-sm text-slate-500 mt-2 leading-relaxed line-clamp-3">
                      {format.descripcion || 'Documento publicado para el proceso de matrícula.'}
                    </p>

                    <div className="mt-5 space-y-2 text-xs text-slate-500">
                      <div className="flex items-center gap-2">
                        <FileText size={15} />
                        <span className="truncate">
                          {format.nombre_archivo}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <CalendarDays size={15} />
                        <span>
                          Publicado: {formatDate(format.created_at)}
                        </span>
                      </div>
                    </div>

                    <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleDownload(format)}
                        disabled={downloadingId === format.id}
                        className="inline-flex items-center justify-center gap-2 bg-brand-900 text-white px-4 py-3 rounded-xl text-sm font-extrabold hover:bg-brand-800 disabled:opacity-60 transition"
                      >
                        <Download size={17} />
                        {downloadingId === format.id ? 'Descargando...' : 'Descargar'}
                      </button>

                      <a
                        href={getEnrollmentFormatDownloadUrl(format.id)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center gap-2 bg-slate-100 text-slate-700 px-4 py-3 rounded-xl text-sm font-extrabold hover:bg-slate-200 transition"
                      >
                        <ExternalLink size={17} />
                        Ver PDF
                      </a>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}

export default EnrollmentFormats;