const Company = require('../models/company.model');
const User = require('../models/user.model');
const { addCompanyFilter, setCompanyOnCreate, hasCompanyAccess } = require('../middleware/tenancy');

module.exports = {
  create,
  getCompanies,
  getCompanyById,
  updateCompany,
  deleteCompany,
  getCompanyStats
};

/**
 * Create a new company
 */
async function create(req, res) {
  try {
    const companyData = setCompanyOnCreate(req.body, req);

    // Set creator
    companyData.createdBy = req.user._id;

    const company = new Company(companyData);
    const savedCompany = await company.save();

    res.status(201).json({
      success: true,
      data: savedCompany,
      message: 'Company created successfully'
    });
  } catch (error) {
    console.error('Error creating company:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error creating company'
    });
  }
}

/**
 * Get companies (with tenancy filtering)
 */
async function getCompanies(req, res) {
  try {
    let query = {};
    query = addCompanyFilter(query, req);

    // If super admin and no specific company filter, get all companies
    if (req.isSuperAdmin && !req.tenantId) {
      query = {}; // Remove company filter for super admin
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Add search functionality
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      query.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { 'address.city': searchRegex }
      ];
    }

    // Add status filter
    if (req.query.status) {
      query.status = req.query.status;
    }

    const companies = await Company.find(query)
      .populate('createdBy', 'fullname email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Company.countDocuments(query);

    res.json({
      success: true,
      data: companies,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error getting companies:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving companies'
    });
  }
}

/**
 * Get company by ID
 */
async function getCompanyById(req, res) {
  try {
    const companyId = req.params.id;

    // Check if user has access to this company
    if (!hasCompanyAccess(companyId, req)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this company'
      });
    }

    const company = await Company.findById(companyId)
      .populate('createdBy', 'fullname email');

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    res.json({
      success: true,
      data: company
    });
  } catch (error) {
    console.error('Error getting company:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving company'
    });
  }
}

/**
 * Update company
 */
async function updateCompany(req, res) {
  try {
    const companyId = req.params.id;

    // Check if user has access to this company
    if (!hasCompanyAccess(companyId, req)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this company'
      });
    }

    const updatedCompany = await Company.findByIdAndUpdate(
      companyId,
      req.body,
      { new: true, runValidators: true }
    ).populate('createdBy', 'fullname email');

    if (!updatedCompany) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    res.json({
      success: true,
      data: updatedCompany,
      message: 'Company updated successfully'
    });
  } catch (error) {
    console.error('Error updating company:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error updating company'
    });
  }
}

/**
 * Delete/Deactivate company
 */
async function deleteCompany(req, res) {
  try {
    const companyId = req.params.id;

    // Only super admin can delete companies
    if (!req.isSuperAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only super admin can delete companies'
      });
    }

    // Check if company has active users
    const activeUsers = await User.countDocuments({
      company: companyId,
      status: 'active'
    });

    if (activeUsers > 0) {
      // Deactivate instead of delete if has active users
      const deactivatedCompany = await Company.findByIdAndUpdate(
        companyId,
        { status: 'inactive' },
        { new: true }
      );

      return res.json({
        success: true,
        data: deactivatedCompany,
        message: 'Company deactivated successfully (had active users)'
      });
    }

    // If no active users, can safely delete
    await Company.findByIdAndDelete(companyId);

    res.json({
      success: true,
      message: 'Company deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting company:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting company'
    });
  }
}

/**
 * Get company statistics
 */
async function getCompanyStats(req, res) {
  try {
    const companyId = req.params.id;

    // Check if user has access to this company
    if (!hasCompanyAccess(companyId, req)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this company'
      });
    }

    // Get user count by role
    const userStats = await User.aggregate([
      { $match: { company: companyId } },
      { $unwind: '$roles' },
      { $group: { _id: '$roles', count: { $sum: 1 } } }
    ]);

    // Get takeoff count
    const Takeoff = require('../models/takeoff.model');
    const takeoffCount = await Takeoff.countDocuments({ company: companyId });

    // Get takeoff status distribution
    const takeoffStats = await Takeoff.aggregate([
      { $match: { company: companyId } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const stats = {
      users: userStats,
      totalTakeoffs: takeoffCount,
      takeoffsByStatus: takeoffStats
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting company stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving company statistics'
    });
  }
}