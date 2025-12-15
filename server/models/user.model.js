const mongoose = require('mongoose');
const UserRoles = require('../constants/user-roles');

const UserSchema = new mongoose.Schema(
  {
    // Company relationship (MULTI-TENANCY KEY)
    // DEPRECATED: Use activeCompany instead. Kept for backwards compatibility.
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: function() {
        return !UserRoles.isSuperAdmin(this.roles);
      }
    },

    // Multi-tenancy: List of all companies the user belongs to
    companies: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company'
    }],

    // Currently active/selected company for this user session
    activeCompany: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company'
    },

    fullname: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      // Regexp to validate emails with more strict rules as added in tests/users.js which also conforms mostly with RFC2822 guide lines
      match: [
        /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
        'Please enter a valid email',
      ],
    },
    hashedPassword: {
      type: String,
      required: true,
    },
    image: {
      type: String,
    },
    mobilePhone: {
      type: String,
    },
    homePhone: {
      type: String,
    },
    hstRegistrationNumber: {
      type: String,
    },
    companyName: {
      type: String,
    },
    address: {
      street: {
        type: String,
      },
      city: {
        type: String,
      },
      country: {
        type: String,
      },
      postalCode: {
        type: String,
      },
    },
    socialMedia: {
      facebook: {
        type: String,
      },
      youtube: {
        type: String,
      },
      instagram: {
        type: String,
      },
      website: {
        type: String,
      },
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    roles: [
      {
        type: String,
        validate: {
          validator: function(role) {
            return UserRoles.isValidRole(role);
          },
          message: function(props) {
            return `${props.value} is not a valid role. Valid roles are: ${UserRoles.getAllRoles().join(', ')}`;
          }
        }
      },
    ],
    profile: {
      type: String,
      enum: UserRoles.getAllRoles(),
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    requirePasswordChange: {
      type: Boolean,
      default: true,
    },
    temporaryPassword: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
    },
    verificationCode: { 
      type: String 
    },
    isVerified: {
       type: Boolean, 
       default: false 
    },
  },
  {
    versionKey: false,
  }
);

// Pre-save middleware to sync company fields for backwards compatibility
UserSchema.pre('save', function(next) {
  // If company is set but companies array is empty, initialize it
  if (this.company && (!this.companies || this.companies.length === 0)) {
    this.companies = [this.company];
  }

  // If activeCompany is not set, use company
  if (!this.activeCompany && this.company) {
    this.activeCompany = this.company;
  }

  // Keep company field in sync with activeCompany for backwards compatibility
  if (this.activeCompany) {
    this.company = this.activeCompany;
  }

  next();
});

// Virtual to get all populated companies
UserSchema.virtual('companiesPopulated', {
  ref: 'Company',
  localField: 'companies',
  foreignField: '_id'
});

module.exports = mongoose.model('User', UserSchema);
