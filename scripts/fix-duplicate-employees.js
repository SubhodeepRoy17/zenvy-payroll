const mongoose = require('mongoose');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

async function fixDuplicateEmployees() {
  try {
    const mongodbUri = process.env.MONGODB_URI;
    
    if (!mongodbUri) {
      console.error('❌ MONGODB_URI is not defined in environment variables');
      console.error('Please set MONGODB_URI in your .env.local file');
      process.exit(1);
    }
    
    console.log('🔗 Connecting to database...');
    console.log('MongoDB URI:', mongodbUri.replace(/\/\/[^:]+:[^@]+@/, '//****:****@'));
    
    await mongoose.connect(mongodbUri);
    console.log('✅ Connected to database');
    
    // Dynamically import models (ES6 modules)
    const { default: Employee } = await import('../models/Employee.js');
    const { default: User } = await import('../models/User.js');
    
    // Find users with multiple active employee records
    console.log('\n🔍 Searching for duplicate employee records...');
    const duplicateEmployees = await Employee.aggregate([
      {
        $match: { isActive: true }
      },
      {
        $group: {
          _id: '$user',
          count: { $sum: 1 },
          employeeIds: { $push: '$_id' },
          companies: { $push: '$company' }
        }
      },
      {
        $match: { count: { $gt: 1 } }
      }
    ]);
    
    console.log(`📊 Found ${duplicateEmployees.length} users with multiple active employee records`);
    
    if (duplicateEmployees.length === 0) {
      console.log('✅ No duplicate employee records found!');
      process.exit(0);
    }
    
    // For each duplicate, keep only the most recent record
    for (const dup of duplicateEmployees) {
      console.log(`\n🔄 Processing user: ${dup._id}`);
      console.log(`   Employee IDs: ${dup.employeeIds.join(', ')}`);
      console.log(`   Companies: ${dup.companies.join(', ')}`);
      
      // Find the most recent employee record
      const latestEmployee = await Employee.findOne({
        user: dup._id,
        isActive: true
      }).sort({ createdAt: -1 }).populate('company');
      
      if (latestEmployee) {
        const companyName = latestEmployee.company?.name || latestEmployee.company?.toString() || 'Unknown';
        console.log(`   Keeping employee record: ${latestEmployee._id} in company: ${companyName}`);
        
        // Update User's company reference if not already set
        const user = await User.findById(dup._id);
        if (user && (!user.company || user.company.toString() !== latestEmployee.company.toString())) {
          user.company = latestEmployee.company;
          await user.save();
          console.log(`   Updated user's company reference to: ${companyName}`);
        }
        
        // Deactivate all other employee records for this user
        const result = await Employee.updateMany(
          {
            user: dup._id,
            _id: { $ne: latestEmployee._id },
            isActive: true
          },
          { 
            isActive: false,
            exitDate: new Date(),
            updatedAt: new Date()
          }
        );
        
        console.log(`   Deactivated ${result.modifiedCount} duplicate employee records`);
      }
    }
    
    console.log('\n🎉 Migration completed successfully!');
    console.log('✅ Fixed all duplicate employee records');
    
    // Verify the fix
    console.log('\n🔍 Verifying fix...');
    const remainingDuplicates = await Employee.aggregate([
      {
        $match: { isActive: true }
      },
      {
        $group: {
          _id: '$user',
          count: { $sum: 1 }
        }
      },
      {
        $match: { count: { $gt: 1 } }
      }
    ]);
    
    if (remainingDuplicates.length === 0) {
      console.log('✅ Verification passed: No more duplicate employee records');
    } else {
      console.log(`❌ Verification failed: Still found ${remainingDuplicates.length} duplicates`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Handle async errors
fixDuplicateEmployees().catch(error => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});