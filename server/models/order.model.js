const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    carpentryEmail: {
      type: String,
      required: true,
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

    createdAt: {
      type: Date,
      default: Date.now,
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
        qty: { type: String },
      },
    ],

    singleDoors: [
      {
        size: { type: String },
        left: { type: String },
        right: { type: String },
        jamb: { type: String },
      },
    ],

    frenchDoors: [
      {
        size: { type: String },
        height: { type: String },
        qty: { type: String },
        jamb: { type: String },
      },
    ],

    doubleDoors: [
      {
        size: { type: String },
        heigh: { type: String },
        qty: { type: String },
        jamb: { type: String },
      },
    ],

    arches: [
      {
        size: { type: String },
        content: { type: String }
      },
    ],

    trim: [
      {
        item: { type: String },
        details: { type: String },
        qty: { type: String }
      },
    ],

    hardware: [
      {
        item: { type: String },
        type: { type: String },
        qty: { type: String }
      },
    ],

    labour: [
      {
        item: { type: String },
        qty: { type: String }
      },
    ],

    shelves: [
      {
        size: { type: String },
        type: { type: String },
        qty: { type: String }
      },
    ],

    closetRods: [
      {
        size: { type: String },
      },
    ],

    rodSupport: [
      {
        type: { type: String },
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
    versionKey: false,
  }
);

module.exports = mongoose.model('Order', OrderSchema);
