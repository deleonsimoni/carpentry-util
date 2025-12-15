const express = require('express');
const passport = require('passport');
const asyncHandler = require('express-async-handler');
const userCtrl = require('../controllers/user.controller');
const requireAdmin = require('../middleware/require-admin');
const companyHeaderMiddleware = require('../middleware/company-header.middleware');
const router = express.Router();
const fileUpload = require('express-fileupload');

module.exports = router;

// Middleware de autenticação para rotas protegidas
const requireAuth = passport.authenticate('jwt', { session: false });

// Rotas públicas (sem autenticação)
router.route('/').post(asyncHandler(insert));

// Rotas protegidas (requerem autenticação e admin)
router.route('/management')
  .get(requireAuth, requireAdmin, companyHeaderMiddleware, asyncHandler(getAllUsers))
  .post(requireAuth, requireAdmin, companyHeaderMiddleware, asyncHandler(createUser));

router.route('/management/:id')
  .get(requireAuth, requireAdmin, companyHeaderMiddleware, asyncHandler(getUserById))
  .put(requireAuth, requireAdmin, companyHeaderMiddleware, asyncHandler(updateUserById))
  .delete(requireAuth, requireAdmin, companyHeaderMiddleware, asyncHandler(deleteUserById));

// Rotas para gerenciamento de senha
router.route('/password-status')
  .get(requireAuth, asyncHandler(checkUserPasswordStatus));

router.route('/change-password')
  .post(requireAuth, asyncHandler(changeUserPassword));

router.route('/reset-password/:id')
  .post(requireAuth, requireAdmin, asyncHandler(resetUserPassword));

// Multi-tenancy: Search user by email to add to company
router.route('/search-by-email')
  .post(requireAuth, requireAdmin, companyHeaderMiddleware, asyncHandler(searchUserByEmail));

// Multi-tenancy: Add existing user to company
router.route('/add-to-company')
  .post(requireAuth, requireAdmin, companyHeaderMiddleware, asyncHandler(addUserToCompany));

// Multi-tenancy: Remove user from company
router.route('/remove-from-company')
  .post(requireAuth, requireAdmin, companyHeaderMiddleware, asyncHandler(removeUserFromCompany));

// Rota para upload de foto de perfil (mantida a existente)
router.put(
  '/updateProfilePic',
  [requireAuth, fileUpload()],
  asyncHandler(updateImageProfile)
);

router.route('/teste').get(asyncHandler(teste));

async function insert(req, res) {
  let user = await userCtrl.insert(req.body);
  res.json(user);
}

async function updateImageProfile(req, res) {
  let responseUpload = await userCtrl.updateImageUser(req.user, req.body);

  if (responseUpload.temErro) {
    return res.status(500).send('Error! ' + responseUpload.mensagem);
  } else {
    return res.json('OK');
  }
}

async function teste(req, res) {
  //let user = await userCtrl.teste(req.body);
  res.json(user);
}

// Funções para gestão de usuários
async function getAllUsers(req, res) {
  try {
    const result = await userCtrl.getAllUsers(req.query, req.companyFilter);
    res.json({
      success: true,
      data: result.users,
      pagination: {
        currentPage: result.currentPage,
        totalPages: result.totalPages,
        totalUsers: result.totalUsers,
        hasNextPage: result.currentPage < result.totalPages,
        hasPrevPage: result.currentPage > 1
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      errors: true,
      message: error.message
    });
  }
}

async function createUser(req, res) {
  try {
    const result = await userCtrl.createUser(req.body, req.companyFilter, req.user);
    res.status(201).json({
      success: true,
      data: result.user,
      temporaryPassword: result.temporaryPassword,
      message: result.message
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      errors: true,
      message: error.message
    });
  }
}

async function getUserById(req, res) {
  try {
    const user = await userCtrl.getUserById(req.params.id, req.companyFilter);
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      errors: true,
      message: error.message
    });
  }
}

async function updateUserById(req, res) {
  try {
    const user = await userCtrl.updateUser(req.params.id, req.body, req.companyFilter, req.user);
    res.json({
      success: true,
      data: user,
      message: 'User updated successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      errors: true,
      message: error.message
    });
  }
}

async function deleteUserById(req, res) {
  try {
    const user = await userCtrl.deleteUser(req.params.id, req.companyFilter);
    res.json({
      success: true,
      data: user,
      message: 'User successfully deactivated'
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      errors: true,
      message: error.message
    });
  }
}

async function checkUserPasswordStatus(req, res) {
  try {
    const status = await userCtrl.checkPasswordStatus(req.user._id);
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      errors: true,
      message: error.message
    });
  }
}

async function changeUserPassword(req, res) {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        errors: true,
        message: 'Nova senha e confirmação não conferem'
      });
    }

    const result = await userCtrl.changePassword(req.user._id, currentPassword, newPassword);
    res.json({
      success: true,
      data: result.user,
      message: result.message
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      errors: true,
      message: error.message
    });
  }
}

async function resetUserPassword(req, res) {
  try {
    const { id } = req.params;
    const result = await userCtrl.resetUserPassword(id);
    res.json({
      success: true,
      data: result.user,
      temporaryPassword: result.temporaryPassword,
      message: result.message
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      errors: true,
      message: error.message
    });
  }
}

// Multi-tenancy: Search user by email
async function searchUserByEmail(req, res) {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const companyId = req.companyFilter?.company || req.user.company;
    const result = await userCtrl.searchUserByEmail(email, companyId);

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
}

// Multi-tenancy: Add existing user to company
async function addUserToCompany(req, res) {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const companyId = req.companyFilter?.company || req.user.company;
    const result = await userCtrl.addUserToCompany(userId, companyId, req.user._id);

    res.json({
      success: true,
      data: result.user,
      message: result.message
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
}

// Multi-tenancy: Remove user from company
async function removeUserFromCompany(req, res) {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const companyId = req.companyFilter?.company || req.user.company;
    // Import the function (need to add to exports in controller)
    const User = require('../models/user.model');
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user belongs to this company
    const belongsToCompany = user.companies && user.companies.some(
      c => c.toString() === companyId.toString()
    );

    if (!belongsToCompany) {
      return res.status(400).json({
        success: false,
        message: 'User does not belong to this company'
      });
    }

    // Ensure user has at least one company remaining
    if (user.companies.length <= 1) {
      return res.status(400).json({
        success: false,
        message: 'Cannot remove user from their only company'
      });
    }

    // Remove company from user's companies array
    user.companies = user.companies.filter(
      c => c.toString() !== companyId.toString()
    );

    // If active company was the removed one, switch to another
    if (user.activeCompany && user.activeCompany.toString() === companyId.toString()) {
      user.activeCompany = user.companies[0];
      user.company = user.companies[0];
    }

    await user.save();

    res.json({
      success: true,
      message: 'User removed from company successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
}
