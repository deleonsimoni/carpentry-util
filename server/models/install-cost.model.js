const mongoose = require('mongoose');

/**
 * InstallCost Model
 * Stores pricing configuration for carpentry services
 * Updated every 2 years based on union rates
 */
const InstallCostSchema = new mongoose.Schema(
  {
    // Identification
    item: {
      type: String,
      required: true,
      index: true
    },
    type: {
      type: String,
      trim: true
    },
    casing: {
      type: String,
      trim: true
    },

    // Pricing
    installCost: {
      type: Number,
      required: false
    },
    increaseCost: {
      type: Number,
      required: false
    },

    // Metadata
    description: {
      type: String,
      trim: true
    },
    notes: {
      type: String,
      trim: true
    },

    // Versioning - Important for 2-year cycle updates
    validFrom: {
      type: Date,
      required: true,
      default: Date.now
    },
    validUntil: {
      type: Date,
      required: false
    },
    version: {
      type: String,
      required: true,
      default: '2025-2027'
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },

    // Audit
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    versionKey: false
  }
);

// Compound indexes for efficient queries
InstallCostSchema.index({ item: 1, type: 1, casing: 1, isActive: 1 });
InstallCostSchema.index({ validFrom: 1, validUntil: 1, isActive: 1 });
InstallCostSchema.index({ version: 1, isActive: 1 });

// Update timestamp on save
InstallCostSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Static method to get active pricing
InstallCostSchema.statics.getActivePricing = async function(item, type = null, casing = null) {
  const query = {
    item,
    isActive: true,
    $or: [
      { validUntil: { $exists: false } },
      { validUntil: null },
      { validUntil: { $gte: new Date() } }
    ]
  };

  if (type) query.type = type;
  if (casing) query.casing = casing;

  return await this.findOne(query).sort({ validFrom: -1 });
};

// Static method to get all active pricing items
InstallCostSchema.statics.getAllActivePricing = async function() {
  return await this.find({
    isActive: true,
    $or: [
      { validUntil: { $exists: false } },
      { validUntil: null },
      { validUntil: { $gte: new Date() } }
    ]
  }).sort({ item: 1, type: 1, casing: 1 });
};

module.exports = mongoose.model('InstallCost', InstallCostSchema);
