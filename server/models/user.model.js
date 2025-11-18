const mongoose = require('mongoose');
const UserRoles = require('../constants/user-roles');

const UserSchema = new mongoose.Schema(
  {
    // Company relationship (MULTI-TENANCY KEY)
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: function() {
        return !UserRoles.isSuperAdmin(this.roles);
      }
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
      required: true,
    },
    companyName: {
      type: String,
      required: true,
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

module.exports = mongoose.model('User', UserSchema);
