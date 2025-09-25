const mongoose = require('mongoose');
const AMCPlan = require('./models/AMCPlan');
require('dotenv').config({ path: './config/production.env' });

// Connect to MongoDB
const connectDB = async () => {
  try {
    // Use the same connection as the main app
    const connectDB = require('./config/db');
    await connectDB();
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Seed AMC plans
const seedAMCPlans = async () => {
  try {
    // Clear existing plans
    await AMCPlan.deleteMany({});
    console.log('Cleared existing AMC plans');

    // Create the three AMC plans
    const plans = [
      {
        name: 'TRY PLAN',
        price: 17,
        period: 'yearly',
        description: 'Perfect for getting started with basic AMC coverage',
        shortDescription: 'Basic AMC plan with essential features',
        features: [
          { title: 'Unlimited Call Support', description: '24/7 phone support for all your queries' },
          { title: '3 Remote Support Sessions', description: 'Get help remotely for your devices' },
          { title: '1 Free Home Visit & Diagnosis', description: 'One complimentary home visit for diagnosis' },
          { title: 'Free Hidden Tips & Tricks', description: 'Access to exclusive maintenance tips' }
        ],
        benefits: {
          callSupport: 'unlimited',
          remoteSupport: 'limited',
          homeVisits: { count: 1, description: '1 Free Home Visit & Diagnosis' },
          antivirus: { included: false },
          softwareInstallation: { included: false },
          sparePartsDiscount: { percentage: 0 },
          freeSpareParts: { amount: 0 },
          laborCost: { included: false }
        },
        status: 'active',
        isPopular: false,
        sortOrder: 1,
        validityPeriod: 365,
        tags: ['basic', 'starter', 'budget'],
        createdBy: new mongoose.Types.ObjectId() // Dummy admin ID
      },
      {
        name: 'CARE PLAN',
        price: 59,
        period: 'yearly',
        description: 'Comprehensive AMC plan with advanced features and support',
        shortDescription: 'Advanced AMC plan with premium features',
        features: [
          { title: 'Unlimited Call Support', description: '24/7 phone support for all your queries' },
          { title: 'Unlimited Remote Support', description: 'Unlimited remote assistance sessions' },
          { title: 'Free Antivirus Pro For 1 Year', description: 'Premium antivirus protection included' },
          { title: '6 Free Home Visits', description: 'Six complimentary home visits for service' },
          { title: 'Free Software Installation & Driver Updates', description: 'Complete software support and installation' },
          { title: 'Up to 40% Off on All Spare Parts', description: 'Significant discounts on spare parts' }
        ],
        benefits: {
          callSupport: 'unlimited',
          remoteSupport: 'unlimited',
          homeVisits: { count: 6, description: '6 Free Home Visits' },
          antivirus: { 
            included: true, 
            name: 'Antivirus Pro', 
            duration: '1 year' 
          },
          softwareInstallation: { 
            included: true, 
            description: 'Free Software Installation & Driver Updates' 
          },
          sparePartsDiscount: { 
            percentage: 40, 
            description: 'Up to 40% Off on All Spare Parts' 
          },
          freeSpareParts: { amount: 0 },
          laborCost: { included: false }
        },
        status: 'active',
        isPopular: true,
        sortOrder: 2,
        validityPeriod: 365,
        tags: ['premium', 'popular', 'comprehensive'],
        createdBy: new mongoose.Types.ObjectId() // Dummy admin ID
      },
      {
        name: 'RELAX PLAN',
        price: 199,
        period: 'yearly',
        description: 'Premium AMC plan with all-inclusive features and maximum benefits',
        shortDescription: 'Premium AMC plan with maximum benefits',
        features: [
          { title: 'Unlimited Call Support', description: '24/7 phone support for all your queries' },
          { title: 'Unlimited Remote Support', description: 'Unlimited remote assistance sessions' },
          { title: 'Free Quick Heal Pro Antivirus For 1 Year', description: 'Premium antivirus protection for 1 year' },
          { title: 'Free Windows MS Office Installation with Software Support', description: 'Complete software support and installation' },
          { title: '12 Free Home Visits and Diagnosis', description: 'Twelve complimentary home visits for service' },
          { title: 'No Labor Cost for 1 Year', description: 'All labor charges included for one year' },
          { title: 'Free Spare Parts up to ₹2000', description: 'Complimentary spare parts worth ₹2000' },
          { title: 'Up to 60% Off on Premium Spare Parts', description: 'Maximum discounts on premium parts' }
        ],
        benefits: {
          callSupport: 'unlimited',
          remoteSupport: 'unlimited',
          homeVisits: { count: 12, description: '12 Free Home Visits and Diagnosis' },
          antivirus: { 
            included: true, 
            name: 'Quick Heal Pro', 
            duration: '1 year' 
          },
          softwareInstallation: { 
            included: true, 
            description: 'Free Windows MS Office Installation with Software Support' 
          },
          sparePartsDiscount: { 
            percentage: 60, 
            description: 'Up to 60% Off on Premium Spare Parts' 
          },
          freeSpareParts: { 
            amount: 2000, 
            description: 'Free Spare Parts up to ₹2000' 
          },
          laborCost: { 
            included: true, 
            description: 'No Labor Cost for 1 Year' 
          }
        },
        status: 'active',
        isPopular: false,
        sortOrder: 3,
        validityPeriod: 365,
        tags: ['premium', 'all-inclusive', 'maximum-benefits'],
        createdBy: new mongoose.Types.ObjectId() // Dummy admin ID
      }
    ];

    // Insert plans
    const createdPlans = await AMCPlan.insertMany(plans);
    console.log(`Successfully created ${createdPlans.length} AMC plans:`);
    createdPlans.forEach(plan => {
      console.log(`- ${plan.name}: ₹${plan.price}/${plan.period}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error seeding AMC plans:', error);
    process.exit(1);
  }
};

// Run the seed function
const runSeed = async () => {
  await connectDB();
  await seedAMCPlans();
};

runSeed();
