const ROLE_PREFIX = {
  Director: 'DIR',
  Administrativo: 'AD',
  Auxiliar: 'AX',
  Docente: 'D',
  Estudiante: 'E',
  Apoderado: 'A'
};

export const generateCredentials = (roleName, dni) => {
  const prefix = ROLE_PREFIX[roleName];

  if (!prefix) {
    throw new Error('Rol no válido para generar credenciales');
  }

  const username = `${prefix}${dni}`;
  const correo = `${username}@abl.edu.pe`;

  return {
    username,
    correo
  };
};