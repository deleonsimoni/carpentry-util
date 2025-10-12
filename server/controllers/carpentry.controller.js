
const User = require('../models/user.model');
const UserRoles = require('../constants/user-roles');

module.exports = {
  getAll
};


async function getAll(currentUser) {
  // Construir filtros baseado na empresa do usuário logado
  const filters = {
    roles: UserRoles.CARPENTER
  };

  // Se o usuário tem empresa, filtrar apenas carpinteiros da mesma empresa
  if (currentUser && currentUser.company) {
    filters.company = currentUser.company;
  }

  const carpenters = await User
    .find(filters)
    .select('email fullname company')
    .sort({
      createdAt: -1
    });

  return carpenters;
}
