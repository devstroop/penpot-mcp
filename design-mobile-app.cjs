/**
 * Design a Mobile App UI using Penpot MCP
 * Testing all available capabilities
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

// Design System Colors
const COLORS = {
  primary: '#007AFF',
  secondary: '#5856D6',
  success: '#34C759',
  warning: '#FF9500',
  danger: '#FF3B30',
  background: '#F2F2F7',
  surface: '#FFFFFF',
  text: '#000000',
  textSecondary: '#8E8E93',
  border: '#C6C6C8',
};

async function designMobileApp() {
  const factory = new ClientFactory(clientConfig);
  const client = factory.createClient();

  console.log('🎨 DESIGNING MOBILE APP UI\n');

  // ============== STEP 1: Create Color Tokens ==============
  console.log('STEP 1: Creating Design Token Colors...');
  for (const [name, color] of Object.entries(COLORS)) {
    try {
      const result = await client.fileChanges.addColor(FILE_ID, {
        name: `App/${name.charAt(0).toUpperCase() + name.slice(1)}`,
        color: color,
        opacity: 1,
      });
      console.log(`  ✓ Created color: ${name}`);
    } catch (e) {
      console.log(`  ✗ Failed color ${name}:`, e.message);
    }
  }

  // ============== STEP 2: Create Screens ==============
  console.log('\nSTEP 2: Creating App Screens...');
  
  const screens = [
    { name: 'Splash Screen', x: 0, y: 1000, fill: COLORS.primary },
    { name: 'Login Screen', x: 400, y: 1000, fill: COLORS.surface },
    { name: 'Dashboard', x: 800, y: 1000, fill: COLORS.background },
    { name: 'Profile', x: 1200, y: 1000, fill: COLORS.background },
    { name: 'Settings', x: 1600, y: 1000, fill: COLORS.surface },
  ];

  const createdFrames = [];
  for (const screen of screens) {
    const result = await client.fileChanges.addFrame(FILE_ID, PAGE_ID, {
      x: screen.x,
      y: screen.y,
      width: 375,
      height: 812,
      name: screen.name,
      fill: screen.fill,
    });
    if (!result.isError) {
      const data = JSON.parse(result.content[0].text);
      createdFrames.push({ name: screen.name, id: data.data?.id, ...screen });
      console.log(`  ✓ Created: ${screen.name}`);
    } else {
      console.log(`  ✗ Failed: ${screen.name}`);
    }
  }

  // ============== STEP 3: Add UI Elements to Screens ==============
  console.log('\nSTEP 3: Adding UI Elements...');

  // Splash Screen - Logo placeholder
  await client.fileChanges.addEllipse(FILE_ID, PAGE_ID, {
    x: 137.5, y: 1350, width: 100, height: 100,
    name: 'Logo Circle', fill: COLORS.surface
  });
  console.log('  ✓ Splash: Logo circle');

  // Login Screen - Form elements
  const loginElements = [
    { x: 437.5, y: 1150, width: 300, height: 50, name: 'Email Input', fill: COLORS.background },
    { x: 437.5, y: 1220, width: 300, height: 50, name: 'Password Input', fill: COLORS.background },
    { x: 437.5, y: 1310, width: 300, height: 50, name: 'Login Button', fill: COLORS.primary },
    { x: 437.5, y: 1380, width: 300, height: 50, name: 'Sign Up Button', fill: COLORS.surface },
  ];
  for (const el of loginElements) {
    await client.fileChanges.addRectangle(FILE_ID, PAGE_ID, { ...el, fillOpacity: 1 });
    console.log(`  ✓ Login: ${el.name}`);
  }

  // Dashboard - Cards
  const dashboardCards = [
    { x: 820, y: 1080, width: 335, height: 120, name: 'Stats Card 1', fill: COLORS.surface },
    { x: 820, y: 1220, width: 160, height: 140, name: 'Quick Action 1', fill: COLORS.primary },
    { x: 995, y: 1220, width: 160, height: 140, name: 'Quick Action 2', fill: COLORS.secondary },
    { x: 820, y: 1380, width: 335, height: 200, name: 'Activity Feed', fill: COLORS.surface },
  ];
  for (const card of dashboardCards) {
    await client.fileChanges.addRectangle(FILE_ID, PAGE_ID, { ...card, fillOpacity: 1 });
    console.log(`  ✓ Dashboard: ${card.name}`);
  }

  // Profile - Avatar and sections
  await client.fileChanges.addEllipse(FILE_ID, PAGE_ID, {
    x: 1337.5, y: 1100, width: 100, height: 100,
    name: 'Avatar', fill: COLORS.textSecondary
  });
  console.log('  ✓ Profile: Avatar');

  const profileSections = [
    { x: 1220, y: 1230, width: 335, height: 60, name: 'Name Section', fill: COLORS.surface },
    { x: 1220, y: 1300, width: 335, height: 60, name: 'Email Section', fill: COLORS.surface },
    { x: 1220, y: 1370, width: 335, height: 60, name: 'Phone Section', fill: COLORS.surface },
    { x: 1220, y: 1460, width: 335, height: 50, name: 'Edit Profile Button', fill: COLORS.primary },
  ];
  for (const section of profileSections) {
    await client.fileChanges.addRectangle(FILE_ID, PAGE_ID, { ...section, fillOpacity: 1 });
    console.log(`  ✓ Profile: ${section.name}`);
  }

  // Settings - Toggle items
  const settingsItems = [
    { x: 1620, y: 1080, width: 335, height: 60, name: 'Notifications', fill: COLORS.background },
    { x: 1620, y: 1150, width: 335, height: 60, name: 'Dark Mode', fill: COLORS.background },
    { x: 1620, y: 1220, width: 335, height: 60, name: 'Privacy', fill: COLORS.background },
    { x: 1620, y: 1290, width: 335, height: 60, name: 'Language', fill: COLORS.background },
    { x: 1620, y: 1400, width: 335, height: 50, name: 'Logout Button', fill: COLORS.danger },
  ];
  for (const item of settingsItems) {
    await client.fileChanges.addRectangle(FILE_ID, PAGE_ID, { ...item, fillOpacity: 1 });
    console.log(`  ✓ Settings: ${item.name}`);
  }

  // ============== STEP 4: Add Navigation Bar to all screens ==============
  console.log('\nSTEP 4: Adding Navigation Bars...');
  const navY = 1729; // Bottom of screen (1000 + 812 - 83)
  const navPositions = [0, 400, 800, 1200, 1600];
  for (const x of navPositions) {
    await client.fileChanges.addRectangle(FILE_ID, PAGE_ID, {
      x: x, y: navY, width: 375, height: 83,
      name: 'Tab Bar', fill: COLORS.surface, fillOpacity: 1
    });
  }
  console.log('  ✓ Added 5 navigation bars');

  // ============== STEP 5: Add Status Bars ==============
  console.log('\nSTEP 5: Adding Status Bars...');
  for (const x of navPositions) {
    await client.fileChanges.addRectangle(FILE_ID, PAGE_ID, {
      x: x, y: 1000, width: 375, height: 44,
      name: 'Status Bar', fill: '#00000000', fillOpacity: 0
    });
  }
  console.log('  ✓ Added 5 status bars');

  // ============== STEP 6: List what we created ==============
  console.log('\nSTEP 6: Verifying created objects...');
  const objects = await client.files.getPageObjects(FILE_ID, PAGE_ID);
  if (!objects.isError) {
    const data = JSON.parse(objects.content[0].text);
    const objCount = Object.keys(data.data?.objects || {}).length;
    console.log(`  ✓ Total objects on page: ${objCount}`);
  }

  // ============== STEP 7: Get file info ==============
  console.log('\nSTEP 7: Getting file info...');
  const fileInfo = await client.files.getFile(FILE_ID);
  if (!fileInfo.isError) {
    const data = JSON.parse(fileInfo.content[0].text);
    console.log(`  File: ${data.data?.name}`);
    console.log(`  Revision: ${data.data?.revn}`);
  }

  console.log('\n🎉 DESIGN COMPLETE!');
  console.log('Open Penpot and refresh to see your mobile app UI design.');
}

designMobileApp().catch(console.error);
