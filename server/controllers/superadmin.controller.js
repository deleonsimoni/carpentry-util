const User = require('../models/user.model');
const Company = require('../models/company.model');
const Takeoff = require('../models/takeoff.model');
const UserRoles = require('../constants/user-roles');

module.exports = {
  getAllUsers,
  getAllCompanies,
  getSystemStats,
  getUsersByCompany,
  updateUserStatus,
  updateCompanyStatus
};

/**
 * Get all users from all companies (superadmin only)
 */
async function getAllUsers(req, res) {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      profile = '',
      status = '',
      companyId = ''
    } = req.query;

    const filters = {};

    if (search) {
      filters.$or = [
        { fullname: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    if (profile) {
      filters.profile = profile;
    }

    if (status) {
      filters.status = status;
    }

    if (companyId) {
      filters.company = companyId;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const users = await User.find(filters)
      .select('-hashedPassword')
      .populate('company', 'name')
      .populate('activeCompany', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(filters);

    res.json({
      success: true,
      data: users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error getting all users:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving users'
    });
  }
}

/**
 * Get all companies (superadmin only)
 */
async function getAllCompanies(req, res) {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      status = ''
    } = req.query;

    const filters = {};

    if (search) {
      filters.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    if (status) {
      filters.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const companies = await Company.find(filters)
      .populate('createdBy', 'fullname email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Add user count for each company
    const companiesWithStats = await Promise.all(
      companies.map(async (company) => {
        const userCount = await User.countDocuments({ company: company._id });
        return {
          ...company.toObject(),
          userCount
        };
      })
    );

    const total = await Company.countDocuments(filters);

    res.json({
      success: true,
      data: companiesWithStats,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error getting all companies:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving companies'
    });
  }
}

/**
 * Get system-wide statistics (superadmin only)
 */
async function getSystemStats(req, res) {
  try {
    // Total counts
    const totalUsers = await User.countDocuments();
    const totalCompanies = await Company.countDocuments();
    const totalTakeoffs = await Takeoff.countDocuments();

    // Active vs Inactive
    const activeUsers = await User.countDocuments({ status: 'active' });
    const activeCompanies = await Company.countDocuments({ status: 'active' });

    // Users by profile
    const usersByProfile = await User.aggregate([
      { $group: { _id: '$profile', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Companies by user count
    const companiesBySize = await User.aggregate([
      { $group: { _id: '$company', userCount: { $sum: 1 } } },
      { $lookup: { from: 'companies', localField: '_id', foreignField: '_id', as: 'company' } },
      { $unwind: '$company' },
      { $project: { name: '$company.name', userCount: 1 } },
      { $sort: { userCount: -1 } },
      { $limit: 10 }
    ]);

    // Recent registrations (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentUsers = await User.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });

    const recentCompanies = await Company.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });

    res.json({
      success: true,
      data: {
        totals: {
          users: totalUsers,
          companies: totalCompanies,
          takeoffs: totalTakeoffs
        },
        active: {
          users: activeUsers,
          companies: activeCompanies
        },
        usersByProfile,
        topCompanies: companiesBySize,
        recent: {
          users: recentUsers,
          companies: recentCompanies
        }
      }
    });
  } catch (error) {
    console.error('Error getting system stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving system statistics'
    });
  }
}

/**
 * Get users by specific company (superadmin only)
 */
async function getUsersByCompany(req, res) {
  try {
    const { companyId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const users = await User.find({ company: companyId })
      .select('-hashedPassword')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments({ company: companyId });

    res.json({
      success: true,
      data: users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error getting users by company:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving users'
    });
  }
}

/**
 * Update user status (superadmin only)
 */
async function updateUserStatus(req, res) {
  try {
    const { userId } = req.params;
    const { status } = req.body;

    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be "active" or "inactive"'
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { status },
      { new: true }
    ).select('-hashedPassword');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user,
      message: `User status updated to ${status}`
    });
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user status'
    });
  }
}

/**
 * Update company status (superadmin only)
 */
async function updateCompanyStatus(req, res) {
  try {
    const { companyId } = req.params;
    const { status } = req.body;

    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be "active" or "inactive"'
      });
    }

    const company = await Company.findByIdAndUpdate(
      companyId,
      { status },
      { new: true }
    );

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    // If company is being deactivated, optionally deactivate all its users
    if (status === 'inactive') {
      await User.updateMany(
        { company: companyId },
        { status: 'inactive' }
      );
    }

    res.json({
      success: true,
      data: company,
      message: `Company status updated to ${status}`
    });
  } catch (error) {
    console.error('Error updating company status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating company status'
    });
  }
}
