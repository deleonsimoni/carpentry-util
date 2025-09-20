/**
 * Multi-Tenancy Middleware
 * Ensures data isolation between companies
 */

const UserRoles = require('../constants/user-roles');

const tenancyMiddleware = (req, res, next) => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    // Super admin can access all companies
    if (UserRoles.isSuperAdmin(req.user.roles)) {
      req.isSuperAdmin = true;
      req.tenantId = req.query.companyId || req.body.companyId || null;
      return next();
    }

    // Other users can only access their company data
    if (!req.user.company) {
      return res.status(403).json({
        success: false,
        message: 'User not associated with any company'
      });
    }

    req.isSuperAdmin = false;
    req.tenantId = req.user.company;
    next();

  } catch (error) {
    console.error('Tenancy middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error in tenancy middleware'
    });
  }
};

/**
 * Helper function to add company filter to queries
 * @param {Object} query - Mongoose query object
 * @param {Object} req - Express request object
 * @returns {Object} - Modified query with company filter
 */
const addCompanyFilter = (query, req) => {
  // Super admin can query all companies or specific company
  if (req.isSuperAdmin) {
    if (req.tenantId) {
      query.company = req.tenantId;
    }
    // If no tenantId specified, super admin sees all companies
  } else {
    // Regular users only see their company data
    query.company = req.tenantId;
  }

  return query;
};

/**
 * Helper function to set company on new documents
 * @param {Object} data - Document data
 * @param {Object} req - Express request object
 * @returns {Object} - Modified data with company set
 */
const setCompanyOnCreate = (data, req) => {
  // Super admin must specify company when creating
  if (req.isSuperAdmin) {
    if (!data.company && !req.tenantId) {
      throw new Error('Super admin must specify company when creating records');
    }
    data.company = data.company || req.tenantId;
  } else {
    // Regular users create within their company
    data.company = req.tenantId;
  }

  return data;
};

/**
 * Verify user has access to specific company
 * @param {String} companyId - Company ID to check
 * @param {Object} req - Express request object
 * @returns {Boolean} - Whether user has access
 */
const hasCompanyAccess = (companyId, req) => {
  // Super admin has access to all companies
  if (req.isSuperAdmin) {
    return true;
  }

  // Regular users only have access to their company
  return req.tenantId && req.tenantId.toString() === companyId.toString();
};

module.exports = {
  tenancyMiddleware,
  addCompanyFilter,
  setCompanyOnCreate,
  hasCompanyAccess
};