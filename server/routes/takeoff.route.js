const express = require('express');
const passport = require('passport');
const asyncHandler = require('express-async-handler');
const multer = require('multer');
const takeoffCtrl = require('../controllers/takeoff.controller');
const companyHeaderMiddleware = require('../middleware/company-header.middleware');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/delivery-photos/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + '.' + file.originalname.split('.').pop());
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

const router = express.Router();
module.exports = router;

router.use(passport.authenticate('jwt', { session: false }));
router.use(companyHeaderMiddleware);

router.route('/').get(asyncHandler(getTakeoffs));
router.route('/for-invoice').get(asyncHandler(getTakeoffsForInvoice));
router.route('/for-scheduling').get(asyncHandler(getTakeoffsForScheduling));
router.route('/:idTakeoff').get(asyncHandler(detailTakeoff));
router.route('/:idTakeoff/generatePDF').get(asyncHandler(generatePDF));
router.route('/:idTakeoff/update').post(asyncHandler(updateTakeoff));
router.route('/:idTakeoff/finalize').post(asyncHandler(finalizeTakeoff));
router.route('/:idTakeoff/status').patch(asyncHandler(updateTakeoffStatus));
router.route('/:idTakeoff/delivery-photo').post(upload.single('deliveryPhoto'), asyncHandler(uploadDeliveryPhoto));
router.route('/:idTakeoff/trim-carpenter').patch(asyncHandler(updateTrimCarpenter));
router.route('/:idTakeoff/trim-carpenter').delete(asyncHandler(removeTrimCarpenter));
router
  .route('/:idTakeoff/backTakeoffToCarpentry')
  .post(asyncHandler(backTakeoffToCarpentry));
router
  .route('/findCarpentryByEmail/:email')
  .get(asyncHandler(findCarpentryByEmail));

router.route('/').post(asyncHandler(createTakeoff));

async function createTakeoff(req, res) {
  let response = await takeoffCtrl.insert(req.user, req.body, req.companyFilter);
  res.json(response);
}

async function updateTakeoff(req, res) {
  let response = await takeoffCtrl.updateTakeoff(
    req.user,
    req.body,
    req.params.idTakeoff,
    req.companyFilter
  );
  res.json(response);
}

async function finalizeTakeoff(req, res) {
  let response = await takeoffCtrl.finalizeTakeoff(
    req.user,
    req.body,
    req.params.idTakeoff,
    req.companyFilter
  );
  res.json(response);
}

async function backTakeoffToCarpentry(req, res) {
  let response = await takeoffCtrl.backTakeoffToCarpentry(
    req.user,
    req.body,
    req.params.idTakeoff,
    req.companyFilter
  );
  res.json(response);
}

async function findCarpentryByEmail(req, res) {
  let response = await takeoffCtrl.findCarpentryByEmail(
    req.user,
    req.params.email,
    req.companyFilter
  );
  res.json(response);
}

async function generatePDF(req, res) {
  let response = await takeoffCtrl.generatePDF(req.user, req.params.idTakeoff, req.companyFilter);
  res.json(response);
}

async function detailTakeoff(req, res) {
  let response = await takeoffCtrl.detailTakeoff(
    req.user._id,
    req.params.idTakeoff,
    req.companyFilter,
    req.user.company,
    req.user.roles,

  );
  res.json(response);
}

async function getTakeoffs(req, res) {
  let response = await takeoffCtrl.getTakeoffs(req.user, req.companyFilter);
  res.json(response);
}

async function updateTakeoffStatus(req, res) {
  try {
    let response = await takeoffCtrl.updateTakeoffStatus(
      req.user,
      req.params.idTakeoff,
      req.body.status,
      req.companyFilter
    );
    res.json(response);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

async function uploadDeliveryPhoto(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No photo uploaded'
      });
    }

    let response = await takeoffCtrl.uploadDeliveryPhoto(
      req.user,
      req.params.idTakeoff,
      req.file
    );
    res.json(response);
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
}

async function updateTrimCarpenter(req, res) {
  try {
    let response = await takeoffCtrl.updateTrimCarpenter(
      req.user,
      req.body.trimCarpenterId,
      req.params.idTakeoff,
      req.companyFilter
    );
    res.json({
      success: true,
      message: 'Trim carpenter updated successfully',
      data: response
    });
  } catch (error) {
    const statusCode = error.status || 500;
    res.status(statusCode).json({
      success: false,
      error: error.message
    });
  }
}

async function removeTrimCarpenter(req, res) {
  try {
    let response = await takeoffCtrl.removeTrimCarpenter(
      req.user,
      req.params.idTakeoff,
      req.companyFilter
    );
    res.json({
      success: true,
      message: 'Trim carpenter removed successfully',
      data: response
    });
  } catch (error) {
    const statusCode = error.status || 500;
    res.status(statusCode).json({
      success: false,
      error: error.message
    });
  }
}

async function getTakeoffsForInvoice(req, res) {
  try {
    let response = await takeoffCtrl.getTakeoffsForInvoice(req.user, req.companyFilter);
    res.json({
      success: true,
      data: response
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

async function getTakeoffsForScheduling(req, res) {
  try {
    const scheduleType = req.query.type;
    if (!scheduleType) {
      return res.status(400).json({
        success: false,
        error: 'Schedule type is required'
      });
    }

    let response = await takeoffCtrl.getTakeoffsForScheduling(req.user, scheduleType, req.companyFilter);
    res.json({
      success: true,
      data: response
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
