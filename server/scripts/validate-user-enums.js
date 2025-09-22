/**
 * Script para validar e corrigir problemas de enum em usuários
 * Detecta e corrige valores antigos que podem causar erros de validação
 */

const mongoose = require('mongoose');
const User = require('../models/user.model');
const UserRoles = require('../constants/user-roles');

async function validateUserEnums() {
  try {
    const mongoUri = process.env.MONGO_HOST || 'mongodb://localhost:27017/carpentryutildb';
    console.log('🔍 Connecting to MongoDB:', mongoUri);

    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('✅ Connected to MongoDB successfully');

    // Get all users
    const allUsers = await User.find({}, 'email profile roles status').lean();
    console.log(`\n📊 Found ${allUsers.length} users in database`);

    const validRoles = UserRoles.getAllRoles();
    const validStatuses = ['active', 'inactive'];
    const issues = [];

    // Check each user for enum issues
    for (const user of allUsers) {
      const userIssues = [];

      // Check profile enum
      if (!validRoles.includes(user.profile)) {
        userIssues.push({
          field: 'profile',
          currentValue: user.profile,
          issue: 'Invalid profile value',
          suggestedFix: getSuggestedRole(user.profile)
        });
      }

      // Check roles array
      if (user.roles && Array.isArray(user.roles)) {
        for (const role of user.roles) {
          if (!validRoles.includes(role)) {
            userIssues.push({
              field: 'roles',
              currentValue: role,
              issue: 'Invalid role in roles array',
              suggestedFix: getSuggestedRole(role)
            });
          }
        }
      }

      // Check status enum
      if (user.status && !validStatuses.includes(user.status)) {
        userIssues.push({
          field: 'status',
          currentValue: user.status,
          issue: 'Invalid status value',
          suggestedFix: 'active'
        });
      }

      if (userIssues.length > 0) {
        issues.push({
          userId: user._id,
          email: user.email,
          issues: userIssues
        });
      }
    }

    if (issues.length === 0) {
      console.log('\n✅ No enum validation issues found! All users have valid enum values.');
      return { success: true, issuesFound: 0, issuesFixed: 0 };
    }

    console.log(`\n⚠️  Found ${issues.length} users with enum validation issues:`);
    issues.forEach(userIssue => {
      console.log(`\n👤 User: ${userIssue.email} (${userIssue.userId})`);
      userIssue.issues.forEach(issue => {
        console.log(`   ❌ ${issue.field}: '${issue.currentValue}' - ${issue.issue}`);
        console.log(`   💡 Suggested fix: '${issue.suggestedFix}'`);
      });
    });

    // Ask if user wants to fix the issues
    console.log('\n🔧 Would you like to auto-fix these issues? (This will update the database)');
    console.log('   Run with --fix flag to automatically apply fixes');

    const shouldFix = process.argv.includes('--fix');

    if (!shouldFix) {
      console.log('\n⏳ No changes made. Run with --fix to apply automatic fixes.');
      return { success: true, issuesFound: issues.length, issuesFixed: 0 };
    }

    // Apply fixes
    console.log('\n🔧 Applying automatic fixes...');
    let fixedCount = 0;

    for (const userIssue of issues) {
      const updateFields = {};

      for (const issue of userIssue.issues) {
        if (issue.field === 'profile') {
          updateFields.profile = issue.suggestedFix;
        } else if (issue.field === 'status') {
          updateFields.status = issue.suggestedFix;
        } else if (issue.field === 'roles') {
          // For roles, we need to replace the specific invalid role
          const user = await User.findById(userIssue.userId);
          if (user) {
            user.roles = user.roles.map(role =>
              role === issue.currentValue ? issue.suggestedFix : role
            );
            await user.save();
            console.log(`   ✅ Fixed role '${issue.currentValue}' to '${issue.suggestedFix}' for ${userIssue.email}`);
            fixedCount++;
          }
        }
      }

      // Update profile and status if needed
      if (Object.keys(updateFields).length > 0) {
        await User.findByIdAndUpdate(userIssue.userId, updateFields);
        Object.keys(updateFields).forEach(field => {
          console.log(`   ✅ Fixed ${field} for ${userIssue.email}: '${updateFields[field]}'`);
          fixedCount++;
        });
      }
    }

    console.log(`\n🎉 Auto-fix complete! Fixed ${fixedCount} enum issues.`);

    // Verify fixes
    console.log('\n🔍 Verifying fixes...');
    const remainingIssues = await validateUserEnums();

    if (remainingIssues.issuesFound === 0) {
      console.log('✅ All enum issues have been resolved!');
    }

    return { success: true, issuesFound: issues.length, issuesFixed: fixedCount };

  } catch (error) {
    console.error('❌ Error validating user enums:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
  }
}

function getSuggestedRole(invalidRole) {
  const roleMappings = {
    'carpinter': UserRoles.CARPENTER,
    'carpentry': UserRoles.CARPENTER,
    'carpentero': UserRoles.CARPENTER,
    'carpenter_role': UserRoles.CARPENTER,
    'admin': UserRoles.MANAGER,
    'administrator': UserRoles.SUPER_ADMIN,
    'user': UserRoles.CARPENTER,
    'worker': UserRoles.CARPENTER,
    'employee': UserRoles.CARPENTER
  };

  return roleMappings[invalidRole] || UserRoles.CARPENTER;
}

// Run if called directly
if (require.main === module) {
  validateUserEnums()
    .then((result) => {
      if (result.success) {
        console.log('\n🎯 Validation Summary:');
        console.log(`   Issues found: ${result.issuesFound}`);
        console.log(`   Issues fixed: ${result.issuesFixed}`);
        process.exit(0);
      }
    })
    .catch(error => {
      console.error('\n💥 Validation failed:', error);
      process.exit(1);
    });
}

module.exports = { validateUserEnums };