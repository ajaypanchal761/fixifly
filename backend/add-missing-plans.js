// Simple script to add missing AMC plans
// This will be run while the main server is running

const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

// Function to add a plan
const addPlan = async (planData) => {
  try {
    console.log(`Adding plan: ${planData.name}`);
    
    // Since we can't use admin API without auth, let's try to add via direct database
    // For now, let's just log what we would add
    console.log('Plan data:', JSON.stringify(planData, null, 2));
    
    return { success: true, message: 'Plan would be added' };
  } catch (error) {
    console.error('Error adding plan:', error.message);
    return { success: false, error: error.message };
  }
};

// The three AMC plans to add
const plans = [
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
    tags: ['premium', 'popular', 'comprehensive']
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
    tags: ['premium', 'all-inclusive', 'maximum-benefits']
  }
];

// Main function
const main = async () => {
  console.log('Adding missing AMC plans...');
  
  for (const plan of plans) {
    const result = await addPlan(plan);
    if (result.success) {
      console.log(`✅ ${plan.name} - Ready to add`);
    } else {
      console.log(`❌ ${plan.name} - Failed: ${result.error}`);
    }
  }
  
  console.log('\n📋 Summary:');
  console.log('The missing plans are:');
  console.log('1. CARE PLAN - ₹59/yearly (Most Popular)');
  console.log('2. RELAX PLAN - ₹199/yearly (Premium)');
  console.log('\nThese plans need to be added to the database.');
  console.log('The admin panel should show all three plans once they are added.');
};

main().catch(console.error);







