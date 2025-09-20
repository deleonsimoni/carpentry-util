const mongoose = require('mongoose');

const CompanySchema = new mongoose.Schema(
  {
    // Basic Info
    name: {
      type: String,
      required: true,
      trim: true
    },
    businessNumber: {
      type: String,
      trim: true
    }, // Canadian Business Number

    // Address (Canadian format)
    address: {
      street: {
        type: String,
        trim: true
      },
      city: {
        type: String,
        trim: true
      },
      province: {
        type: String,
        enum: ['AB', 'BC', 'MB', 'NB', 'NL', 'NS', 'NT', 'NU', 'ON', 'PE', 'QC', 'SK', 'YT']
      },
      postalCode: {
        type: String,
        trim: true
      }, // Format: A1A 1A1
      country: {
        type: String,
        default: 'Canada'
      }
    },

    // Contact
    phone: {
      type: String,
      trim: true
    }, // Canadian format: (xxx) xxx-xxxx
    email: {
      type: String,
      trim: true,
      lowercase: true
    },
    website: {
      type: String,
      trim: true
    },

    // Business Details
    industry: {
      type: String,
      trim: true
    },
    taxNumber: {
      type: String,
      trim: true
    }, // GST/HST number

    // System
    status: {
      type: String,
      enum: ['active', 'inactive', 'suspended'],
      default: 'active'
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    } // Manager who created
  },
  {
    versionKey: false
  }
);

// Index for better performance
CompanySchema.index({ status: 1 });
CompanySchema.index({ createdAt: -1 });

module.exports = mongoose.model('Company', CompanySchema);