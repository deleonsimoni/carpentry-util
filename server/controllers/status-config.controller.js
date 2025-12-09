const StatusConfig = require('../models/status-config.model');
const UserRoles = require('../constants/user-roles');
// Force restart to load new configuration

const DEFAULT_STATUS_CONFIG = [
  {
    statusId: 1,
    name: 'Created',
    description: 'Novo takeoff criado',
    color: '#dc3545',
    icon: 'fas fa-plus-circle',
    allowedRoles: [UserRoles.MANAGER, UserRoles.CARPENTER, UserRoles.SUPERVISOR],
    canTransitionTo: [2],
    order: 1
  },
  {
    statusId: 2,
    name: 'To Measure',
    description: 'Aguardando medições',
    color: '#fd7e14',
    icon: 'fas fa-ruler',
    allowedRoles: [UserRoles.MANAGER, UserRoles.CARPENTER, UserRoles.SUPERVISOR],
    canTransitionTo: [3, 1],
    order: 2
  },
  {
    statusId: 3,
    name: 'Under Review',
    description: 'Em revisão',
    color: '#ffc107',
    icon: 'fas fa-eye',
    allowedRoles: [UserRoles.MANAGER, UserRoles.SUPERVISOR],
    canTransitionTo: [4, 2],
    order: 3
  },
  {
    statusId: 4,
    name: 'Ready to Ship',
    description: 'Pronto para envio',
    color: '#20c997',
    icon: 'fas fa-shipping-fast',
    allowedRoles: [UserRoles.MANAGER, UserRoles.SUPERVISOR],
    canTransitionTo: [5, 3],
    order: 4
  },
  {
    statusId: 5,
    name: 'Shipped',
    description: 'Enviado',
    color: '#17a2b8',
    icon: 'fas fa-truck',
    allowedRoles: [UserRoles.MANAGER, UserRoles.DELIVERY],
    canTransitionTo: [6, 7],
    order: 5
  },
  {
    statusId: 6,
    name: 'Trimming Completed',
    description: 'Acabamento concluído',
    color: '#6f42c1',
    icon: 'fas fa-cut',
    allowedRoles: [UserRoles.MANAGER, UserRoles.CARPENTER],
    canTransitionTo: [7, 8],
    order: 6
  },
  {
    statusId: 7,
    name: 'Back Trim Completed',
    description: 'Acabamento traseiro concluído',
    color: '#e83e8c',
    icon: 'fas fa-hammer',
    allowedRoles: [UserRoles.MANAGER, UserRoles.CARPENTER],
    canTransitionTo: [8],
    order: 7
  },
  {
    statusId: 8,
    name: 'Closed',
    description: 'Concluído',
    color: '#28a745',
    icon: 'fas fa-check-circle',
    allowedRoles: [UserRoles.MANAGER],
    canTransitionTo: [],
    order: 8
  }
];

module.exports = {
  getAllStatusConfigs,
  createStatusConfig,
  updateStatusConfig,
  deleteStatusConfig,
  getStatusConfigByRole,
  initializeDefaultConfigs,
  getAvailableTransitions
};

async function getAllStatusConfigs(req, res) {
  try {
    // Check if user is manager
    if (!UserRoles.isManager(req.user.roles)) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado. Apenas managers podem gerenciar status.'
      });
    }

    const companyId = req.user.company;

    const configs = await StatusConfig.find({ companyId })
      .sort({ order: 1 });

    if (configs.length === 0) {
      await initializeDefaultConfigs(companyId);
      const newConfigs = await StatusConfig.find({ companyId })
        .sort({ order: 1 });
      return res.json({ success: true, data: newConfigs });
    }

    res.json({ success: true, data: configs });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar configurações de status',
      error: error.message
    });
  }
}

async function createStatusConfig(req, res) {
  try {
    // Check if user is manager
    if (!UserRoles.isManager(req.user.roles)) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado. Apenas managers podem gerenciar status.'
      });
    }

    const companyId = req.user.company;
    const configData = { ...req.body, companyId };

    const config = new StatusConfig(configData);
    await config.save();

    res.status(201).json({
      success: true,
      data: config,
      message: 'Status created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating status',
      error: error.message
    });
  }
}

async function updateStatusConfig(req, res) {
  try {
    // Check if user is manager
    if (!UserRoles.isManager(req.user.roles)) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado. Apenas managers podem gerenciar status.'
      });
    }

    const { id } = req.params;
    const companyId = req.user.company;

    const config = await StatusConfig.findOneAndUpdate(
      { _id: id, companyId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!config) {
      return res.status(404).json({
        success: false,
        message: 'Status não encontrado'
      });
    }

    res.json({
      success: true,
      data: config,
      message: 'Status updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating status',
      error: error.message
    });
  }
}

async function deleteStatusConfig(req, res) {
  try {
    // Check if user is manager
    if (!UserRoles.isManager(req.user.roles)) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado. Apenas managers podem gerenciar status.'
      });
    }

    const { id } = req.params;
    const companyId = req.user.company;

    const config = await StatusConfig.findOne({ _id: id, companyId });

    if (!config) {
      return res.status(404).json({
        success: false,
        message: 'Status não encontrado'
      });
    }

    const deletedStatusId = config.statusId;

    // Delete the status first
    await StatusConfig.findOneAndDelete({ _id: id, companyId });

    // Get all status configs that need to be shifted down (statusId > deletedStatusId)
    const statusesToShift = await StatusConfig.find({
      companyId,
      statusId: { $gt: deletedStatusId }
    }).sort({ statusId: 1 });

    // Shift statusIds down by 1
    const shiftPromises = statusesToShift.map(status => {
      return StatusConfig.findOneAndUpdate(
        { _id: status._id },
        { statusId: status.statusId - 1 },
        { new: true }
      );
    });

    // Update all transition references
    const allConfigs = await StatusConfig.find({ companyId });
    const transitionUpdatePromises = allConfigs.map(status => {
      const updatedTransitions = status.canTransitionTo
        .filter(transitionId => transitionId !== deletedStatusId) // Remove deleted status from transitions
        .map(transitionId => transitionId > deletedStatusId ? transitionId - 1 : transitionId); // Shift down references

      if (JSON.stringify(updatedTransitions) !== JSON.stringify(status.canTransitionTo)) {
        return StatusConfig.findOneAndUpdate(
          { _id: status._id },
          { canTransitionTo: updatedTransitions },
          { new: true }
        );
      }
      return Promise.resolve();
    });

    // Execute all shifts and transition updates
    await Promise.all([...shiftPromises, ...transitionUpdatePromises]);

    res.json({
      success: true,
      message: 'Status successfully deleted and IDs reordered'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting status',
      error: error.message
    });
  }
}

async function getStatusConfigByRole(req, res) {
  try {
    const companyId = req.user.company;
    const userRole = req.user.roles[0];

    const configs = await StatusConfig.find({
      companyId,
      isActive: true,
      allowedRoles: { $in: [userRole] }
    }).sort({ order: 1 });

    res.json({ success: true, data: configs });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar status permitidos',
      error: error.message
    });
  }
}

async function getAvailableTransitions(req, res) {
  try {
    const { currentStatusId } = req.params;
    const companyId = req.user.company;
    const userRole = req.user.roles[0];

    const currentConfig = await StatusConfig.findOne({
      companyId,
      statusId: parseInt(currentStatusId)
    });

    if (!currentConfig) {
      return res.status(404).json({
        success: false,
        message: 'Status atual não encontrado'
      });
    }

    const availableConfigs = await StatusConfig.find({
      companyId,
      statusId: { $in: currentConfig.canTransitionTo },
      isActive: true,
      allowedRoles: { $in: [userRole] }
    }).sort({ order: 1 });

    res.json({ success: true, data: availableConfigs });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar transições disponíveis',
      error: error.message
    });
  }
}

async function initializeDefaultConfigs(companyId) {
  try {
    const configs = DEFAULT_STATUS_CONFIG.map(config => ({
      ...config,
      companyId
    }));

    await StatusConfig.insertMany(configs);
    return true;
  } catch (error) {
    console.error('Erro ao inicializar configurações padrão:', error);
    return false;
  }
}