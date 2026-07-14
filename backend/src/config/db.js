import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool, types } = pkg;

// OID 1114 = timestamp without time zone
types.setTypeParser(1114, (value) => {
  if (!value) return value;

  const text = String(value).trim().replace(' ', 'T');

  return text.endsWith('Z') ? text : `${text}Z`;
});

// OID 1082 = date
types.setTypeParser(1082, (value) => value);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export default pool;