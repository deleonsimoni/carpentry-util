const mongoose = require('mongoose');

const statusConfigSchema = new mongoose.Schema({
  statusId: {
    type: Number,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  color: {
    type: String,
    default: '#6c757d'
  },
  icon: {
    type: String,
    default: 'fas fa-circle'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  allowedRoles: [{
    type: String,
    enum: ['manager', 'carpenter', 'supervisor', 'delivery']
  }],
  canTransitionTo: [{
    type: Number
  }],
  order: {
    type: Number,
    default: 0
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  }
}, {
  timestamps: true
});

statusConfigSchema.index({ companyId: 1, statusId: 1 }, { unique: true });

module.exports = mongoose.model('StatusConfig', statusConfigSchema);