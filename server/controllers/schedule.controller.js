const ScheduleEvent = require('../models/schedule.model');
const Takeoff = require('../models/takeoff.model');
const User = require('../models/user.model');
const UserRoles = require('../constants/user-roles');

module.exports = {
  createEvent,
  getEvents,
  getEventById,
  getEventsByTakeoff,
  updateEvent,
  deleteEvent
};

async function createEvent(user, body, companyFilter = {}) {
  const eventData = {
    ...body,
    takeoffs: body.takeoffIds || [],
    company: user.company,
    createdBy: user._id
  };

  delete eventData.takeoffIds;

  const event = await new ScheduleEvent(eventData).save();

  return {
    success: true,
    data: await populateEvent(event._id)
  };
}

async function getEvents(user, query = {}, companyFilter = {}) {
  const { startDate, endDate } = query;

  const filter = { ...companyFilter };

  if (startDate || endDate) {
    filter.scheduledDate = {};
    if (startDate) {
      filter.scheduledDate.$gte = new Date(startDate);
    }
    if (endDate) {
      filter.scheduledDate.$lte = new Date(endDate);
    }
  }

  if (UserRoles.isCarpenter(user.roles)) {
    filter.assignedTo = user._id;
  }

  const events = await ScheduleEvent.find(filter)
    .populate('takeoffs', 'custumerName lot streetName shipTo status')
    .populate('assignedTo', 'fullname email')
    .populate('createdBy', 'fullname')
    .sort({ scheduledDate: 1 });

  const mappedEvents = events.map(event => mapEventResponse(event));

  return {
    success: true,
    data: mappedEvents
  };
}

async function getEventById(user, eventId, companyFilter = {}) {
  const filter = {
    _id: eventId,
    ...companyFilter
  };

  const event = await ScheduleEvent.findOne(filter)
    .populate('takeoffs', 'custumerName lot streetName shipTo status')
    .populate('assignedTo', 'fullname email')
    .populate('createdBy', 'fullname');

  if (!event) {
    return {
      success: false,
      message: 'Event not found'
    };
  }

  return {
    success: true,
    data: mapEventResponse(event)
  };
}

async function getEventsByTakeoff(user, takeoffId, companyFilter = {}) {
  const filter = {
    takeoffs: takeoffId,
    ...companyFilter
  };

  const events = await ScheduleEvent.find(filter)
    .populate('takeoffs', 'custumerName lot streetName shipTo status')
    .populate('assignedTo', 'fullname email')
    .populate('createdBy', 'fullname')
    .sort({ scheduledDate: 1 });

  return {
    success: true,
    data: events.map(mapEventResponse)
  };
}

async function updateEvent(user, eventId, body, companyFilter = {}) {
  const filter = {
    _id: eventId,
    ...companyFilter
  };

  const updateData = { ...body };
  if (body.takeoffIds) {
    updateData.takeoffs = body.takeoffIds;
    delete updateData.takeoffIds;
  }

  const event = await ScheduleEvent.findOneAndUpdate(
    filter,
    updateData,
    { new: true }
  );

  if (!event) {
    return {
      success: false,
      message: 'Event not found'
    };
  }

  return {
    success: true,
    data: await populateEvent(event._id)
  };
}

async function deleteEvent(user, eventId, companyFilter = {}) {
  const filter = {
    _id: eventId,
    ...companyFilter
  };

  const event = await ScheduleEvent.findOneAndDelete(filter);

  if (!event) {
    return {
      success: false,
      message: 'Event not found'
    };
  }

  return {
    success: true,
    message: 'Event deleted successfully'
  };
}

async function populateEvent(eventId) {
  const event = await ScheduleEvent.findById(eventId)
    .populate('takeoffs', 'custumerName lot streetName shipTo status')
    .populate('assignedTo', 'fullname email')
    .populate('createdBy', 'fullname');

  return mapEventResponse(event);
}

function mapEventResponse(event) {
  if (!event) return null;

  return {
    _id: event._id,
    takeoffIds: event.takeoffs?.map(t => t._id || t) || [],
    type: event.type,
    title: event.title,
    scheduledDate: event.scheduledDate,
    assignedTo: event.assignedTo?._id,
    assignedToName: event.assignedTo?.fullname,
    takeoffs: event.takeoffs,
    createdAt: event.createdAt,
    updatedAt: event.updatedAt
  };
}
