const mongoose = require('mongoose');

const MaterialRequestSchema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    carpentry: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    status: {
      type: String,
    },
    customerName: {
      type: String,
    },
    requestType: {
      type: String
    },

    deliveryOrPickupDate: {
      type: String,
    },

    deliveryAddressStreet: {
      type: String,
    },
    deliveryAddressCity: {
      type: String,
    },
    deliveryAddressProvince: {
      type: String,
    },
    deliveryAddressPostalCode: {
      type: String
    },

    deliveryInstruction: {
      type: String,
    },

    material: [
      {
        description: {
          type: String,
        },
        quantity: {
          type: String,
        },
        notes: {
          type: String,
        }
      }
    ]
   
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields automatically
    versionKey: false,
  }
);



module.exports = mongoose.model('MaterialRequest', MaterialRequestSchema);
