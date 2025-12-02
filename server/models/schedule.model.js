const mongoose = require('mongoose');

const ScheduleEventSchema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true
    },
    takeoff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Takeoff',
      required: true
    },
    type: {
      type: String,
      enum: ['takeoff', 'shipping', 'trim'],
      required: true
    },
    title: {
      type: String,
      required: true
    },
    scheduledDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['scheduled', 'in-progress', 'completed', 'cancelled'],
      default: 'scheduled'
    },
    notes: {
      type: String
    },
    location: {
      type: String
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

ScheduleEventSchema.index({ company: 1, scheduledDate: 1 });
ScheduleEventSchema.index({ company: 1, takeoff: 1 });
ScheduleEventSchema.index({ company: 1, assignedTo: 1 });
ScheduleEventSchema.index({ company: 1, status: 1 });

module.exports = mongoose.model('ScheduleEvent', ScheduleEventSchema);
