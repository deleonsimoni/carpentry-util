const Company = require('../models/company.model');
const UserRoles = require('../constants/user-roles');

/**
 * Middleware para capturar e validar o Company ID do header
 * Header esperado: x-company-id
 */
module.exports = function companyHeaderMiddleware(req, res, next) {
  try {
    const companyId = req.headers['x-company-id'];

    // Se for super_admin, não precisa do header (pode acessar qualquer empresa)
    if (UserRoles.isSuperAdmin(req.user?.roles)) {
      // Se super_admin passou company ID no header, usar ele
      if (companyId) {
        req.companyFilter = { company: companyId };
        req.targetCompanyId = companyId;
      } else {
        // Super admin sem header = ver todas as empresas
        req.companyFilter = {};
        req.targetCompanyId = null;
      }
      return next();
    }

    // Para outros usuários, verificar se o company ID no header bate com o da empresa do usuário
    if (!companyId) {
      return res.status(400).json({
        success: false,
        error: 'Company ID is required in x-company-id header'
      });
    }

    // Verificar se o usuário pertence à empresa especificada no header
    if (req.user.company.toString() !== companyId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You can only access data from your own company.'
      });
    }

    // Validar se a empresa existe
    Company.findById(companyId)
      .then(company => {
        if (!company) {
          return res.status(404).json({
            success: false,
            error: 'Company not found'
          });
        }

        // Verificar se a empresa está ativa
        if (company.status !== 'active') {
          return res.status(403).json({
            success: false,
            error: 'Company is not active'
          });
        }

        // Definir filtros para uso nos controllers
        req.companyFilter = { company: companyId };
        req.targetCompanyId = companyId;

        next();
      })
      .catch(error => {
        return res.status(400).json({
          success: false,
          error: 'Invalid company ID format'
        });
      });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Internal server error in company middleware'
    });
  }
};