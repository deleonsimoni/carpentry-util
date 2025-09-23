
const User = require('../models/user.model');
const UserRoles = require('../constants/user-roles');

module.exports = {
  getAll
};


async function getAll(currentUser) {
  console.log('🔍 DEBUG - Buscando carpinteiros para empresa:', currentUser?.company);

  // Construir filtros baseado na empresa do usuário logado
  const filters = {
    roles: UserRoles.CARPENTER
  };

  // Se o usuário tem empresa, filtrar apenas carpinteiros da mesma empresa
  if (currentUser && currentUser.company) {
    filters.company = currentUser.company;
  }

  console.log('🔍 DEBUG - Filtros aplicados:', filters);

  const carpenters = await User
    .find(filters)
    .select('email fullname company')
    .sort({
      createdAt: -1
    });

  console.log('🔍 DEBUG - Carpinteiros encontrados:', carpenters.length);

  return carpenters;
}

