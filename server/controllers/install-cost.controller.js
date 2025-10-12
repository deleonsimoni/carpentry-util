const InstallCost = require('../models/install-cost.model');
const UserRoles = require('../constants/user-roles');

module.exports = {
  getAllActive,
  getAll,
  getById,
  create,
  update,
  remove,
  deactivate,
  getByVersion
};

/**
 * Get all active install costs
 * GET /api/install-cost/active
 */
async function getAllActive(req, res, next) {
  try {
    // Only managers and super admins can view pricing
    if (!UserRoles.isManager(req.user.roles) && !UserRoles.isSuperAdmin(req.user.roles)) {
      return res.status(403).json({
        message: 'Only managers and super admins can view install costs'
      });
    }

    const installCosts = await InstallCost.getAllActivePricing();

    res.json({
      success: true,
      message: 'Active install costs retrieved successfully',
      data: installCosts
    });

  } catch (error) {
    console.error('Error getting active install costs:', error);
    next(error);
  }
}

/**
 * Get all install costs (including inactive)
 * GET /api/install-cost
 */
async function getAll(req, res, next) {
  try {
    // Only super admins can view all costs (including inactive)
    if (!UserRoles.isSuperAdmin(req.user.roles)) {
      return res.status(403).json({
        message: 'Only super admins can view all install costs'
      });
    }

    const { version, item, isActive } = req.query;
    const filter = {};

    if (version) filter.version = version;
    if (item) filter.item = item;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const installCosts = await InstallCost.find(filter)
      .sort({ item: 1, type: 1, casing: 1, createdAt: -1 });

    res.json({
      success: true,
      message: 'Install costs retrieved successfully',
      data: installCosts
    });

  } catch (error) {
    console.error('Error getting install costs:', error);
    next(error);
  }
}

/**
 * Get install cost by ID
 * GET /api/install-cost/:id
 */
async function getById(req, res, next) {
  try {
    const { id } = req.params;

    // Only managers and super admins can view pricing
    if (!UserRoles.isManager(req.user.roles) && !UserRoles.isSuperAdmin(req.user.roles)) {
      return res.status(403).json({
        message: 'Only managers and super admins can view install costs'
      });
    }

    const installCost = await InstallCost.findById(id);

    if (!installCost) {
      return res.status(404).json({
        message: 'Install cost not found'
      });
    }

    res.json({
      success: true,
      message: 'Install cost retrieved successfully',
      data: installCost
    });

  } catch (error) {
    console.error('Error getting install cost:', error);
    next(error);
  }
}

/**
 * Create new install cost
 * POST /api/install-cost
 */
async function create(req, res, next) {
  try {
    // Only super admins can create pricing
    if (!UserRoles.isSuperAdmin(req.user.roles)) {
      return res.status(403).json({
        message: 'Only super admins can create install costs'
      });
    }

    const { item, type, casing, installCost, increaseCost, description, notes, version, validFrom, validUntil } = req.body;

    // Validation
    if (!item) {
      return res.status(400).json({
        message: 'Item is required'
      });
    }

    if (!installCost && !increaseCost) {
      return res.status(400).json({
        message: 'Either installCost or increaseCost is required'
      });
    }

    const newInstallCost = new InstallCost({
      item,
      type,
      casing,
      installCost,
      increaseCost,
      description,
      notes,
      version: version || '2025-2027',
      validFrom: validFrom || new Date(),
      validUntil,
      isActive: true
    });

    const saved = await newInstallCost.save();

    res.status(201).json({
      success: true,
      message: 'Install cost created successfully',
      data: saved
    });

  } catch (error) {
    console.error('Error creating install cost:', error);
    next(error);
  }
}

/**
 * Update install cost
 * PUT /api/install-cost/:id
 */
async function update(req, res, next) {
  try {
    const { id } = req.params;

    // Only super admins can update pricing
    if (!UserRoles.isSuperAdmin(req.user.roles)) {
      return res.status(403).json({
        message: 'Only super admins can update install costs'
      });
    }

    const { item, type, casing, installCost, increaseCost, description, notes, version, validFrom, validUntil, isActive } = req.body;

    const installCostDoc = await InstallCost.findById(id);

    if (!installCostDoc) {
      return res.status(404).json({
        message: 'Install cost not found'
      });
    }

    // Update fields
    if (item !== undefined) installCostDoc.item = item;
    if (type !== undefined) installCostDoc.type = type;
    if (casing !== undefined) installCostDoc.casing = casing;
    if (installCost !== undefined) installCostDoc.installCost = installCost;
    if (increaseCost !== undefined) installCostDoc.increaseCost = increaseCost;
    if (description !== undefined) installCostDoc.description = description;
    if (notes !== undefined) installCostDoc.notes = notes;
    if (version !== undefined) installCostDoc.version = version;
    if (validFrom !== undefined) installCostDoc.validFrom = validFrom;
    if (validUntil !== undefined) installCostDoc.validUntil = validUntil;
    if (isActive !== undefined) installCostDoc.isActive = isActive;

    const updated = await installCostDoc.save();

    res.json({
      success: true,
      message: 'Install cost updated successfully',
      data: updated
    });

  } catch (error) {
    console.error('Error updating install cost:', error);
    next(error);
  }
}

/**
 * Delete install cost (hard delete)
 * DELETE /api/install-cost/:id
 */
async function remove(req, res, next) {
  try {
    const { id } = req.params;

    // Only super admins can delete pricing
    if (!UserRoles.isSuperAdmin(req.user.roles)) {
      return res.status(403).json({
        message: 'Only super admins can delete install costs'
      });
    }

    const deleted = await InstallCost.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({
        message: 'Install cost not found'
      });
    }

    res.json({
      success: true,
      message: 'Install cost deleted successfully',
      data: deleted
    });

  } catch (error) {
    console.error('Error deleting install cost:', error);
    next(error);
  }
}

/**
 * Deactivate install cost (soft delete)
 * PATCH /api/install-cost/:id/deactivate
 */
async function deactivate(req, res, next) {
  try {
    const { id } = req.params;

    // Only super admins can deactivate pricing
    if (!UserRoles.isSuperAdmin(req.user.roles)) {
      return res.status(403).json({
        message: 'Only super admins can deactivate install costs'
      });
    }

    const installCost = await InstallCost.findByIdAndUpdate(
      id,
      { isActive: false, updatedAt: new Date() },
      { new: true }
    );

    if (!installCost) {
      return res.status(404).json({
        message: 'Install cost not found'
      });
    }

    res.json({
      success: true,
      message: 'Install cost deactivated successfully',
      data: installCost
    });

  } catch (error) {
    console.error('Error deactivating install cost:', error);
    next(error);
  }
}

/**
 * Get install costs by version
 * GET /api/install-cost/version/:version
 */
async function getByVersion(req, res, next) {
  try {
    const { version } = req.params;

    // Only managers and super admins can view pricing
    if (!UserRoles.isManager(req.user.roles) && !UserRoles.isSuperAdmin(req.user.roles)) {
      return res.status(403).json({
        message: 'Only managers and super admins can view install costs'
      });
    }

    const installCosts = await InstallCost.find({ version, isActive: true })
      .sort({ item: 1, type: 1, casing: 1 });

    res.json({
      success: true,
      message: `Install costs for version ${version} retrieved successfully`,
      data: installCosts
    });

  } catch (error) {
    console.error('Error getting install costs by version:', error);
    next(error);
  }
}
