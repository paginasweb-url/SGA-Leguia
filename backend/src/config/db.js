import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool, types } = pkg;

// OID 1114 = timestamp without time zone
// Supabase/PostgreSQL suele guardar estos timestamps en UTC.
// Evitamos que Node los interprete como hora local del servidor o de la PC.
types.setTypeParser(1114, (value) => {
  if (!value) return value;

  const text = String(value).trim().replace(' ', 'T');

  return text.endsWith('Z') ? text : `${text}Z`;
});

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export default pool;