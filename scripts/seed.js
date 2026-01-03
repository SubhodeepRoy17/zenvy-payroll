const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

async function seed() {
  try {
    // Check for MONGODB_URI
    if (!process.env.MONGODB_URI) {
      console.error('❌ Error: MONGODB_URI is not defined in .env.local file');
      console.log('Please add your MongoDB connection string to .env.local:');
      process.exit(1);
    }

    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected successfully');

    // Check if User model already exists
    let User;
    if (mongoose.models.User) {
      User = mongoose.models.User;
      console.log('📦 Using existing User model');
    } else {
      // Define User schema inline
      const UserSchema = new mongoose.Schema({
        name: {
          type: String,
          required: true,
          trim: true,
        },
        email: {
          type: String,
          required: true,
          unique: true,
          lowercase: true,
          trim: true,
        },
        password: {
          type: String,
          required: true,
        },
        role: {
          type: String,
          enum: ['admin', 'hr', 'employee'],
          default: 'employee',
        },
        department: {
          type: String,
          default: '',
        },
        position: {
          type: String,
          default: '',
        },
        salary: {
          type: Number,
          default: 0,
        },
        hireDate: {
          type: Date,
          default: Date.now,
        },
        isActive: {
          type: Boolean,
          default: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      });

      // Simple password hashing without middleware
      UserSchema.methods.hashPassword = async function() {
        this.password = await bcrypt.hash(this.password, 10);
      };

      User = mongoose.model('User', UserSchema);
      console.log('📦 Created new User model');
    }

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@zenvy.com' });
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists');
      console.log('👤 Name:', existingAdmin.name);
      console.log('📧 Email:', existingAdmin.email);
      console.log('👑 Role:', existingAdmin.role);
      process.exit(0);
    }

    // Create admin user with pre-hashed password
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@zenvy.com',
      password: hashedPassword, // Already hashed
      role: 'admin',
      position: 'System Administrator',
      department: 'IT',
      salary: 90000,
      isActive: true,
    });

    console.log('✅ Admin user created successfully');
    
    console.log('\n📋 Admin User Details:');
    console.log(`👤 Name: ${adminUser.name}`);
    console.log(`📧 Email: ${adminUser.email}`);
    console.log(`👑 Role: ${adminUser.role}`);
    console.log(`💼 Position: ${adminUser.position}`);
    console.log(`🏢 Department: ${adminUser.department}`);
    console.log(`💰 Salary: $${adminUser.salary.toLocaleString()}`);
    
    console.log('\n🔑 Test Credentials:');
    console.log('Email: admin@zenvy.com');
    console.log('Password: admin123');
    console.log('\n⚠️  Note: Make sure to change this password after first login!');
    
    mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 11000) {
      console.log('⚠️  User already exists in database');
    }
    process.exit(1);
  }
}

seed();
