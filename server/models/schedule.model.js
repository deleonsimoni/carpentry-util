const mongoose = require('mongoose');

const ScheduleEventSchema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true
    },
    takeoffs: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Takeoff',
      required: true
    }],
    type: {
      type: String,
      enum: ['production', 'shipping', 'first_trim', 'second_trim'],
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
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
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
ScheduleEventSchema.index({ company: 1, takeoffs: 1 });
ScheduleEventSchema.index({ company: 1, assignedTo: 1 });
ScheduleEventSchema.index({ company: 1, type: 1 });

module.exports = mongoose.model('ScheduleEvent', ScheduleEventSchema);
