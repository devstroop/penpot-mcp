/**
 * Create a complete mobile app design with all elements
 */
const { ClientFactory } = require('./dist/api/client-factory');
const { ConfigManager } = require('./dist/config');

const configManager = new ConfigManager();
const penpotConfig = configManager.get();
const clientConfig = {
  baseURL: penpotConfig.baseUrl,
  username: penpotConfig.username,
  password: penpotConfig.password,
  timeout: 30000,
};

const FILE_ID = '8d8d1fae-b51b-802a-8007-50cc9827f931';
const PAGE_ID = '8d8d1fae-b51b-802a-8007-50cc9827f932';

// Design System
const COLORS = {
  primary: '#007AFF',
  background: '#F2F2F7',
  surface: '#FFFFFF',
  text: '#000000',
  textSecondary: '#8E8E93',
  danger: '#FF3B30',
  success: '#34C759',
};

async function createCompleteDesign() {
  const factory = new ClientFactory(clientConfig);
  const fileChanges = factory.createFileChangesClient();

  console.log('🎨 Creating Complete Mobile App Design\n');

  // ==============================
  // WELCOME SCREEN (y=2000)
  // ==============================
  console.log('📱 Creating Welcome Screen...');
  
  // Frame
  await fileChanges.addFrame(FILE_ID, PAGE_ID, {
    x: 0, y: 2000, width: 375, height: 812,
    name: 'Welcome', fill: COLORS.primary
  });

  // App Logo (circle)
  await fileChanges.addEllipse(FILE_ID, PAGE_ID, {
    x: 137.5, y: 2280, width: 100, height: 100,
    name: 'Logo', fill: COLORS.surface
  });

  // Welcome Text
  await fileChanges.addText(FILE_ID, PAGE_ID, {
    x: 100, y: 2420, content: 'Welcome to AppName',
    name: 'Welcome Title', fontSize: 28, fontWeight: '700', fill: COLORS.surface
  });

  await fileChanges.addText(FILE_ID, PAGE_ID, {
    x: 60, y: 2470, content: 'Your journey starts here',
    name: 'Welcome Subtitle', fontSize: 18, fill: 'rgba(255,255,255,0.8)'
  });

  // Get Started Button
  await fileChanges.addRectangle(FILE_ID, PAGE_ID, {
    x: 37.5, y: 2600, width: 300, height: 56,
    name: 'Get Started Button', fill: COLORS.surface
  });
  await fileChanges.addText(FILE_ID, PAGE_ID, {
    x: 130, y: 2615, content: 'Get Started',
    name: 'Button Text', fontSize: 18, fontWeight: '600', fill: COLORS.primary
  });

  // Sign In Link
  await fileChanges.addText(FILE_ID, PAGE_ID, {
    x: 115, y: 2700, content: 'Already have an account? Sign In',
    name: 'Sign In Link', fontSize: 14, fill: COLORS.surface
  });

  console.log('   ✓ Welcome Screen');

  // ==============================
  // SIGN IN SCREEN (y=2000, x=400)
  // ==============================
  console.log('📱 Creating Sign In Screen...');

  await fileChanges.addFrame(FILE_ID, PAGE_ID, {
    x: 400, y: 2000, width: 375, height: 812,
    name: 'Sign In', fill: COLORS.surface
  });

  // Header
  await fileChanges.addText(FILE_ID, PAGE_ID, {
    x: 420, y: 2100, content: 'Sign In',
    name: 'Sign In Title', fontSize: 32, fontWeight: '700', fill: COLORS.text
  });

  await fileChanges.addText(FILE_ID, PAGE_ID, {
    x: 420, y: 2145, content: 'Welcome back! Please sign in to continue.',
    name: 'Sign In Subtitle', fontSize: 16, fill: COLORS.textSecondary
  });

  // Email Field
  await fileChanges.addText(FILE_ID, PAGE_ID, {
    x: 420, y: 2210, content: 'Email',
    name: 'Email Label', fontSize: 14, fontWeight: '500', fill: COLORS.text
  });
  await fileChanges.addRectangle(FILE_ID, PAGE_ID, {
    x: 420, y: 2235, width: 335, height: 50,
    name: 'Email Input', fill: COLORS.background
  });
  await fileChanges.addText(FILE_ID, PAGE_ID, {
    x: 435, y: 2250, content: 'your@email.com',
    name: 'Email Placeholder', fontSize: 16, fill: COLORS.textSecondary
  });

  // Password Field
  await fileChanges.addText(FILE_ID, PAGE_ID, {
    x: 420, y: 2310, content: 'Password',
    name: 'Password Label', fontSize: 14, fontWeight: '500', fill: COLORS.text
  });
  await fileChanges.addRectangle(FILE_ID, PAGE_ID, {
    x: 420, y: 2335, width: 335, height: 50,
    name: 'Password Input', fill: COLORS.background
  });
  await fileChanges.addText(FILE_ID, PAGE_ID, {
    x: 435, y: 2350, content: '••••••••',
    name: 'Password Placeholder', fontSize: 16, fill: COLORS.textSecondary
  });

  // Forgot Password
  await fileChanges.addText(FILE_ID, PAGE_ID, {
    x: 630, y: 2395, content: 'Forgot Password?',
    name: 'Forgot Password', fontSize: 14, fill: COLORS.primary
  });

  // Sign In Button
  await fileChanges.addRectangle(FILE_ID, PAGE_ID, {
    x: 420, y: 2450, width: 335, height: 56,
    name: 'Sign In Button', fill: COLORS.primary
  });
  await fileChanges.addText(FILE_ID, PAGE_ID, {
    x: 555, y: 2465, content: 'Sign In',
    name: 'Sign In Button Text', fontSize: 18, fontWeight: '600', fill: COLORS.surface
  });

  // Divider
  await fileChanges.addText(FILE_ID, PAGE_ID, {
    x: 550, y: 2540, content: 'or continue with',
    name: 'Divider Text', fontSize: 14, fill: COLORS.textSecondary
  });

  // Social Buttons
  await fileChanges.addRectangle(FILE_ID, PAGE_ID, {
    x: 420, y: 2580, width: 160, height: 50,
    name: 'Google Button', fill: COLORS.background
  });
  await fileChanges.addText(FILE_ID, PAGE_ID, {
    x: 470, y: 2595, content: 'Google',
    name: 'Google Text', fontSize: 16, fill: COLORS.text
  });

  await fileChanges.addRectangle(FILE_ID, PAGE_ID, {
    x: 595, y: 2580, width: 160, height: 50,
    name: 'Apple Button', fill: COLORS.text
  });
  await fileChanges.addText(FILE_ID, PAGE_ID, {
    x: 655, y: 2595, content: 'Apple',
    name: 'Apple Text', fontSize: 16, fill: COLORS.surface
  });

  // Sign Up Link
  await fileChanges.addText(FILE_ID, PAGE_ID, {
    x: 470, y: 2700, content: "Don't have an account? Sign Up",
    name: 'Sign Up Link', fontSize: 14, fill: COLORS.text
  });

  console.log('   ✓ Sign In Screen');

  // ==============================
  // HOME SCREEN (y=2000, x=800)
  // ==============================
  console.log('📱 Creating Home Screen...');

  await fileChanges.addFrame(FILE_ID, PAGE_ID, {
    x: 800, y: 2000, width: 375, height: 812,
    name: 'Home', fill: COLORS.background
  });

  // Status Bar Area
  await fileChanges.addRectangle(FILE_ID, PAGE_ID, {
    x: 800, y: 2000, width: 375, height: 44,
    name: 'Status Bar', fill: COLORS.surface
  });

  // Header
  await fileChanges.addText(FILE_ID, PAGE_ID, {
    x: 820, y: 2060, content: 'Good Morning',
    name: 'Greeting', fontSize: 16, fill: COLORS.textSecondary
  });
  await fileChanges.addText(FILE_ID, PAGE_ID, {
    x: 820, y: 2085, content: 'John Doe',
    name: 'User Name', fontSize: 24, fontWeight: '700', fill: COLORS.text
  });

  // Profile Avatar
  await fileChanges.addEllipse(FILE_ID, PAGE_ID, {
    x: 1095, y: 2055, width: 50, height: 50,
    name: 'Avatar', fill: COLORS.primary
  });
  await fileChanges.addText(FILE_ID, PAGE_ID, {
    x: 1110, y: 2070, content: 'JD',
    name: 'Avatar Initials', fontSize: 18, fontWeight: '600', fill: COLORS.surface
  });

  // Balance Card
  await fileChanges.addRectangle(FILE_ID, PAGE_ID, {
    x: 820, y: 2130, width: 335, height: 140,
    name: 'Balance Card', fill: COLORS.primary
  });
  await fileChanges.addText(FILE_ID, PAGE_ID, {
    x: 840, y: 2150, content: 'Total Balance',
    name: 'Balance Label', fontSize: 14, fill: 'rgba(255,255,255,0.8)'
  });
  await fileChanges.addText(FILE_ID, PAGE_ID, {
    x: 840, y: 2175, content: '$12,458.00',
    name: 'Balance Amount', fontSize: 32, fontWeight: '700', fill: COLORS.surface
  });
  await fileChanges.addText(FILE_ID, PAGE_ID, {
    x: 840, y: 2230, content: '+12.5% from last month',
    name: 'Balance Change', fontSize: 14, fill: COLORS.success
  });

  // Quick Actions
  await fileChanges.addText(FILE_ID, PAGE_ID, {
    x: 820, y: 2295, content: 'Quick Actions',
    name: 'Quick Actions Title', fontSize: 18, fontWeight: '600', fill: COLORS.text
  });

  // Action Buttons
  const actions = [
    { x: 820, label: 'Send', icon: '↑' },
    { x: 905, label: 'Request', icon: '↓' },
    { x: 990, label: 'Cards', icon: '💳' },
    { x: 1075, label: 'More', icon: '•••' },
  ];

  for (const action of actions) {
    await fileChanges.addEllipse(FILE_ID, PAGE_ID, {
      x: action.x, y: 2325, width: 60, height: 60,
      name: `${action.label} Button`, fill: COLORS.surface
    });
    await fileChanges.addText(FILE_ID, PAGE_ID, {
      x: action.x + 15, y: 2395, content: action.label,
      name: `${action.label} Label`, fontSize: 12, fill: COLORS.text
    });
  }

  // Transactions
  await fileChanges.addText(FILE_ID, PAGE_ID, {
    x: 820, y: 2440, content: 'Recent Transactions',
    name: 'Transactions Title', fontSize: 18, fontWeight: '600', fill: COLORS.text
  });
  await fileChanges.addText(FILE_ID, PAGE_ID, {
    x: 1080, y: 2440, content: 'See All',
    name: 'See All Link', fontSize: 14, fill: COLORS.primary
  });

  // Transaction Items
  const transactions = [
    { name: 'Netflix', amount: '-$15.99', time: 'Today, 2:30 PM' },
    { name: 'Salary', amount: '+$3,500', time: 'Yesterday' },
    { name: 'Amazon', amount: '-$89.00', time: 'Dec 23' },
  ];

  let txY = 2480;
  for (const tx of transactions) {
    await fileChanges.addRectangle(FILE_ID, PAGE_ID, {
      x: 820, y: txY, width: 335, height: 70,
      name: `Transaction ${tx.name}`, fill: COLORS.surface
    });
    await fileChanges.addEllipse(FILE_ID, PAGE_ID, {
      x: 835, y: txY + 15, width: 40, height: 40,
      name: `${tx.name} Icon`, fill: COLORS.background
    });
    await fileChanges.addText(FILE_ID, PAGE_ID, {
      x: 890, y: txY + 18, content: tx.name,
      name: `${tx.name} Name`, fontSize: 16, fontWeight: '500', fill: COLORS.text
    });
    await fileChanges.addText(FILE_ID, PAGE_ID, {
      x: 890, y: txY + 40, content: tx.time,
      name: `${tx.name} Time`, fontSize: 12, fill: COLORS.textSecondary
    });
    await fileChanges.addText(FILE_ID, PAGE_ID, {
      x: 1070, y: txY + 25, content: tx.amount,
      name: `${tx.name} Amount`, fontSize: 16, fontWeight: '600',
      fill: tx.amount.startsWith('+') ? COLORS.success : COLORS.text
    });
    txY += 80;
  }

  // Tab Bar
  await fileChanges.addRectangle(FILE_ID, PAGE_ID, {
    x: 800, y: 2729, width: 375, height: 83,
    name: 'Tab Bar', fill: COLORS.surface
  });

  const tabs = [
    { x: 830, label: 'Home', active: true },
    { x: 905, label: 'Cards', active: false },
    { x: 975, label: 'Stats', active: false },
    { x: 1050, label: 'Profile', active: false },
  ];

  for (const tab of tabs) {
    await fileChanges.addText(FILE_ID, PAGE_ID, {
      x: tab.x, y: 2765, content: tab.label,
      name: `Tab ${tab.label}`, fontSize: 12,
      fill: tab.active ? COLORS.primary : COLORS.textSecondary
    });
  }

  console.log('   ✓ Home Screen');

  // ==============================
  // PROFILE SCREEN (y=2000, x=1200)
  // ==============================
  console.log('📱 Creating Profile Screen...');

  await fileChanges.addFrame(FILE_ID, PAGE_ID, {
    x: 1200, y: 2000, width: 375, height: 812,
    name: 'Profile', fill: COLORS.background
  });

  // Header
  await fileChanges.addText(FILE_ID, PAGE_ID, {
    x: 1345, y: 2060, content: 'Profile',
    name: 'Profile Header', fontSize: 18, fontWeight: '600', fill: COLORS.text
  });

  // Avatar
  await fileChanges.addEllipse(FILE_ID, PAGE_ID, {
    x: 1337.5, y: 2110, width: 100, height: 100,
    name: 'Profile Avatar', fill: COLORS.primary
  });
  await fileChanges.addText(FILE_ID, PAGE_ID, {
    x: 1365, y: 2145, content: 'JD',
    name: 'Profile Initials', fontSize: 32, fontWeight: '700', fill: COLORS.surface
  });

  await fileChanges.addText(FILE_ID, PAGE_ID, {
    x: 1340, y: 2225, content: 'John Doe',
    name: 'Profile Name', fontSize: 24, fontWeight: '700', fill: COLORS.text
  });
  await fileChanges.addText(FILE_ID, PAGE_ID, {
    x: 1315, y: 2255, content: 'john.doe@email.com',
    name: 'Profile Email', fontSize: 14, fill: COLORS.textSecondary
  });

  // Edit Profile Button
  await fileChanges.addRectangle(FILE_ID, PAGE_ID, {
    x: 1300, y: 2290, width: 175, height: 40,
    name: 'Edit Profile', fill: COLORS.surface
  });
  await fileChanges.addText(FILE_ID, PAGE_ID, {
    x: 1345, y: 2302, content: 'Edit Profile',
    name: 'Edit Profile Text', fontSize: 14, fontWeight: '500', fill: COLORS.primary
  });

  // Menu Items
  const menuItems = [
    { label: 'Personal Information', icon: '👤' },
    { label: 'Payment Methods', icon: '💳' },
    { label: 'Notifications', icon: '🔔' },
    { label: 'Security', icon: '🔒' },
    { label: 'Help & Support', icon: '❓' },
    { label: 'About', icon: 'ℹ️' },
  ];

  let menuY = 2360;
  for (const item of menuItems) {
    await fileChanges.addRectangle(FILE_ID, PAGE_ID, {
      x: 1220, y: menuY, width: 335, height: 56,
      name: `Menu ${item.label}`, fill: COLORS.surface
    });
    await fileChanges.addText(FILE_ID, PAGE_ID, {
      x: 1240, y: menuY + 18, content: item.label,
      name: `${item.label} Text`, fontSize: 16, fill: COLORS.text
    });
    await fileChanges.addText(FILE_ID, PAGE_ID, {
      x: 1520, y: menuY + 18, content: '>',
      name: `${item.label} Arrow`, fontSize: 16, fill: COLORS.textSecondary
    });
    menuY += 66;
  }

  // Logout Button
  await fileChanges.addRectangle(FILE_ID, PAGE_ID, {
    x: 1220, y: 2760, width: 335, height: 50,
    name: 'Logout Button', fill: COLORS.danger
  });
  await fileChanges.addText(FILE_ID, PAGE_ID, {
    x: 1355, y: 2775, content: 'Log Out',
    name: 'Logout Text', fontSize: 16, fontWeight: '600', fill: COLORS.surface
  });

  console.log('   ✓ Profile Screen');

  console.log('\n🎉 Complete Mobile App Design Created!');
  console.log('\nScreens created:');
  console.log('  1. Welcome Screen (x: 0, y: 2000)');
  console.log('  2. Sign In Screen (x: 400, y: 2000)');
  console.log('  3. Home Screen (x: 800, y: 2000)');
  console.log('  4. Profile Screen (x: 1200, y: 2000)');
  console.log('\nRefresh Penpot to see the complete design!');
}

createCompleteDesign().catch(console.error);
