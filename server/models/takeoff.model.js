const mongoose = require('mongoose');

const TakeoffSchema = new mongoose.Schema(
  {
    // Company relationship (MULTI-TENANCY KEY)
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    carpentry: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    trimCarpentry: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    custumerName: {
      type: String,
    },
    foremen: {
      type: String,
    },
    extrasChecked: {
      type: String,
    },
    carpInvoice: {
      type: String,
    },
    shipTo: {
      type: String,
    },
    lot: {
      type: String,
    },
    type: {
      type: String,
    },
    elev: {
      type: String,
    },
    sqFootage: {
      type: String,
    },
    streetName: {
      type: String,
    },
    status: {
      type: Number,
    },

    deliveryPhoto: {
      type: String, // File path to the uploaded delivery photo
    },
    deliveryPhotoUploadedAt: {
      type: Date,
    },

    doorsStyle: {
      type: String,
    },

    //Carpentry

    comment: {
      type: String,
    },

    extras: {
      type: String,
    },
    cantinaDoors: [
      {
        name: { type: String },
        swing: { type: String },
        jamb: { type: String },
        qty: { type: String },
      },
    ],

    singleDoors: [
      {
        size: { type: String },
        left: { type: String },
        right: { type: String },
        height: { type: String },
        jamb: { type: String },
      },
    ],

    frenchDoors: [
      {
        size: { type: String },
        swing: { type: String },
        height: { type: String },
        qty: { type: String },
        jamb: { type: String },
      },
    ],

    doubleDoors: [
      {
        size: { type: String },
        height: { type: String },
        qty: { type: String },
        jamb: { type: String },
      },
    ],

    arches: [
      {
        size: { type: String },
        height: { type: String },
        jamb: { type: String },
        col1: { type: String },
        col2: { type: String },
        col3: { type: String },
        col4: { type: String },
        qty: { type: String },
      },
    ],

    trim: [
      {
        item: { type: String },
        details: { type: String },
        qty: { type: String },
      },
    ],

    hardware: [
      {
        item: { type: String },
        type: { type: String },
        qty: { type: String },
      },
    ],

    labour: [
      {
        item: { type: String },
        qty: { type: String },
      },
    ],

    shelves: [
      {
        size: { type: String },
        type4: { type: String },
        type6: { type: String },
        type8: { type: String },
        type10: { type: String },
        type12: { type: String },
        qty: { type: String },
      },
    ],

    closetRods: [
      {
        type1: { type: String },
        type2: { type: String },
        type3: { type: String },
        type4: { type: String },
      },
    ],

    rodSupport: [
      {
        type: { type: String },
        desc: { type: String },
        qty: { type: String },
      },
    ],

    roundWindow: [
      {
        type: { type: String },
        qty: { type: String },
      },
    ],
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields automatically
    versionKey: false,
  }
);

// Index for better performance with multi-tenancy
TakeoffSchema.index({ company: 1, createdAt: -1 });
TakeoffSchema.index({ company: 1, status: 1 });
TakeoffSchema.index({ company: 1, user: 1 });

module.exports = mongoose.model('Takeoff', TakeoffSchema);
