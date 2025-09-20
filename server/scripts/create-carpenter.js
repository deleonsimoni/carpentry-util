const mongoose = require('mongoose');
const User = require('../models/user.model');
const Company = require('../models/company.model');
const UserRoles = require('../constants/user-roles');

mongoose.connect('mongodb://localhost:27017/carpentry-util', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(async () => {
  try {
    // Find the first company to get its ID
    const company = await Company.findOne({}, {_id: 1, name: 1});
    console.log('Company found:', JSON.stringify(company, null, 2));

    if (company) {
      // Check if carpenter already exists
      const existingCarpenter = await User.findOne({email: 'azul@ranger.com'});
      if (existingCarpenter) {
        console.log('Carpenter already exists:', existingCarpenter.email);
        process.exit(0);
      }

      // Create carpenter user
      const carpenter = new User({
        fullname: 'Azul Carpenter',
        email: 'azul@ranger.com',
        password: '123456',
        roles: [UserRoles.CARPENTER],
        company: company._id,
        profile: UserRoles.CARPENTER
      });

      const savedCarpenter = await carpenter.save();
      console.log('Carpenter created successfully:', {
        _id: savedCarpenter._id,
        email: savedCarpenter.email,
        fullname: savedCarpenter.fullname,
        roles: savedCarpenter.roles,
        company: savedCarpenter.company
      });
    } else {
      console.log('No company found! Please create a company first.');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}).catch(err => {
  console.error('Connection error:', err);
  process.exit(1);
});