import pool from '../config/db.js';

const VALID_THEME_MODES = ['light', 'dark', 'system'];

const passwordPolicy = {
  title: 'Política de contraseña',
  rules: [
    'Los usuarios creados por el sistema deben cambiar su contraseña en el primer inicio de sesión.',
    'Las credenciales iniciales se generan de forma institucional según el rol y DNI.',
    'La recuperación de contraseña se gestiona desde el módulo Seguridad.',
    'El sistema registra el historial de accesos para seguimiento administrativo.'
  ]
};

const academicSettings = {
  bimestres: [
    { code: 'B1', name: 'Primer bimestre' },
    { code: 'B2', name: 'Segundo bimestre' },
    { code: 'B3', name: 'Tercer bimestre' },
    { code: 'B4', name: 'Cuarto bimestre' }
  ],
  grade_scale: [
    { code: 'AD', points: 4, label: 'Logro destacado' },
    { code: 'A', points: 3, label: 'Logro esperado' },
    { code: 'B', points: 2, label: 'En proceso' },
    { code: 'C', points: 1, label: 'En inicio' }
  ]
};

export const getUserPreferences = async (userId) => {
  const query = `
    INSERT INTO user_preferences (user_id)
    VALUES ($1)
    ON CONFLICT (user_id)
    DO UPDATE SET user_id = EXCLUDED.user_id
    RETURNING
      user_id,
      theme_mode,
      created_at,
      updated_at
  `;

  const result = await pool.query(query, [userId]);
  return result.rows[0];
};

export const updateUserPreferences = async (userId, preferences) => {
  const { theme_mode } = preferences;

  if (!VALID_THEME_MODES.includes(theme_mode)) {
    throw new Error('Modo de tema no válido');
  }

  const query = `
    INSERT INTO user_preferences (
      user_id,
      theme_mode,
      created_at,
      updated_at
    )
    VALUES ($1, $2, NOW(), NOW())
    ON CONFLICT (user_id)
    DO UPDATE SET
      theme_mode = EXCLUDED.theme_mode,
      updated_at = NOW()
    RETURNING
      user_id,
      theme_mode,
      created_at,
      updated_at
  `;

  const result = await pool.query(query, [userId, theme_mode]);
  return result.rows[0];
};

export const getSettingsPayload = async (userId) => {
  const preferences = await getUserPreferences(userId);

  return {
    preferences,
    visual_options: [
      {
        value: 'light',
        label: 'Modo claro',
        description: 'Interfaz luminosa con fondos blancos y azul institucional.'
      },
      {
        value: 'dark',
        label: 'Modo oscuro',
        description: 'Interfaz oscura con azul institucional suavizado y dorado elegante.'
      },
      {
        value: 'system',
        label: 'Usar sistema',
        description: 'El sistema se adapta al tema configurado en el dispositivo.'
      }
    ],
    password_policy: passwordPolicy,
    academic_settings: academicSettings
  };
};