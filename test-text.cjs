/**
 * Test new text element feature
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

async function testTextElement() {
  const factory = new ClientFactory(clientConfig);
  const client = factory.createClient();

  console.log('🔤 Testing Text Element Creation\n');

  // Test 1: Simple text
  console.log('1. Creating simple text...');
  const text1 = await client.fileChanges.addText(FILE_ID, PAGE_ID, {
    x: 50,
    y: 1050,
    content: 'Hello Penpot!',
    name: 'Title Text',
    fontSize: 32,
    fontFamily: 'sourcesanspro',
    fontWeight: '700',
    fill: '#FFFFFF',
  });
  console.log('   Result:', text1.isError ? 'FAILED' : 'SUCCESS');

  // Test 2: Body text
  console.log('2. Creating body text...');
  const text2 = await client.fileChanges.addText(FILE_ID, PAGE_ID, {
    x: 450,
    y: 1150,
    content: 'Enter your email',
    name: 'Email Label',
    fontSize: 14,
    fill: '#8E8E93',
  });
  console.log('   Result:', text2.isError ? 'FAILED' : 'SUCCESS');

  // Test 3: Button text
  console.log('3. Creating button text...');
  const text3 = await client.fileChanges.addText(FILE_ID, PAGE_ID, {
    x: 530,
    y: 1325,
    content: 'Sign In',
    name: 'Button Label',
    fontSize: 18,
    fontWeight: '600',
    fill: '#FFFFFF',
  });
  console.log('   Result:', text3.isError ? 'FAILED' : 'SUCCESS');

  // Test 4: Large heading
  console.log('4. Creating large heading...');
  const text4 = await client.fileChanges.addText(FILE_ID, PAGE_ID, {
    x: 830,
    y: 1030,
    content: 'Dashboard',
    name: 'Page Title',
    fontSize: 28,
    fontWeight: '700',
    fill: '#000000',
  });
  console.log('   Result:', text4.isError ? 'FAILED' : 'SUCCESS');

  // Test 5: Subtitle
  console.log('5. Creating subtitle...');
  const text5 = await client.fileChanges.addText(FILE_ID, PAGE_ID, {
    x: 830,
    y: 1065,
    content: 'Welcome back, User',
    name: 'Subtitle',
    fontSize: 16,
    fill: '#8E8E93',
  });
  console.log('   Result:', text5.isError ? 'FAILED' : 'SUCCESS');

  console.log('\n✅ Text element tests complete!');
  console.log('Refresh Penpot to see the text elements.');
}

testTextElement().catch(console.error);
