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

async function testAllTools() {
  const factory = new ClientFactory(clientConfig);
  const client = factory.createClient();
  const results = {};

  console.log('=== TESTING ALL PENPOT MCP TOOLS ===\n');

  // 1. Profile Tool
  console.log('1. PROFILE - get current user...');
  try {
    const profile = await client.profile.getProfile();
    results.profile = { status: profile.isError ? 'FAILED' : 'OK' };
    console.log('   ' + (profile.isError ? '✗' : '✓') + ' Profile');
  } catch (e) {
    results.profile = { status: 'FAILED', error: e.message };
    console.log('   ✗ Profile failed:', e.message);
  }

  // 2. Teams Tool
  console.log('2. TEAMS - list teams...');
  try {
    const teams = await client.team.getTeams();
    results.teams = { status: teams.isError ? 'FAILED' : 'OK' };
    console.log('   ' + (teams.isError ? '✗' : '✓') + ' Teams');
  } catch (e) {
    results.teams = { status: 'FAILED', error: e.message };
    console.log('   ✗ Teams failed:', e.message);
  }

  // 3. Projects Tool
  console.log('3. PROJECTS - list projects...');
  try {
    const projects = await client.projects.getProjects();
    results.projects = { status: projects.isError ? 'FAILED' : 'OK' };
    console.log('   ' + (projects.isError ? '✗' : '✓') + ' Projects');
  } catch (e) {
    results.projects = { status: 'FAILED', error: e.message };
    console.log('   ✗ Projects failed:', e.message);
  }

  // 4. Files Tool - get file
  console.log('4. FILES - get file...');
  try {
    const file = await client.files.getFile(FILE_ID);
    results.files_get = { status: file.isError ? 'FAILED' : 'OK' };
    console.log('   ' + (file.isError ? '✗' : '✓') + ' File get');
  } catch (e) {
    results.files_get = { status: 'FAILED', error: e.message };
    console.log('   ✗ Files get failed:', e.message);
  }

  // 5. Files Tool - get pages
  console.log('5. FILES - get pages...');
  try {
    const pages = await client.files.getFilePages(FILE_ID);
    results.files_pages = { status: pages.isError ? 'FAILED' : 'OK' };
    console.log('   ' + (pages.isError ? '✗' : '✓') + ' Pages');
  } catch (e) {
    results.files_pages = { status: 'FAILED', error: e.message };
    console.log('   ✗ Pages failed:', e.message);
  }

  // 6. Files Tool - get objects
  console.log('6. FILES - get page objects...');
  try {
    const objects = await client.files.getPageObjects(FILE_ID, PAGE_ID);
    results.files_objects = { status: objects.isError ? 'FAILED' : 'OK' };
    console.log('   ' + (objects.isError ? '✗' : '✓') + ' Objects');
  } catch (e) {
    results.files_objects = { status: 'FAILED', error: e.message };
    console.log('   ✗ Objects failed:', e.message);
  }

  // 7. Tokens - colors
  console.log('7. TOKENS - colors...');
  try {
    const colors = await client.tokens.getColors(FILE_ID);
    results.tokens_colors = { status: colors.isError ? 'FAILED' : 'OK' };
    console.log('   ' + (colors.isError ? '✗' : '✓') + ' Colors');
  } catch (e) {
    results.tokens_colors = { status: 'FAILED', error: e.message };
    console.log('   ✗ Colors failed:', e.message);
  }

  // 8. Tokens - typography
  console.log('8. TOKENS - typography...');
  try {
    const typo = await client.tokens.getTypography(FILE_ID);
    results.tokens_typography = { status: typo.isError ? 'FAILED' : 'OK' };
    console.log('   ' + (typo.isError ? '✗' : '✓') + ' Typography');
  } catch (e) {
    results.tokens_typography = { status: 'FAILED', error: e.message };
    console.log('   ✗ Typography failed:', e.message);
  }

  // 9. Components
  console.log('9. COMPONENTS - list...');
  try {
    const comps = await client.components.getComponents(FILE_ID);
    results.components = { status: comps.isError ? 'FAILED' : 'OK' };
    console.log('   ' + (comps.isError ? '✗' : '✓') + ' Components');
  } catch (e) {
    results.components = { status: 'FAILED', error: e.message };
    console.log('   ✗ Components failed:', e.message);
  }

  // 10. Comments
  console.log('10. COMMENTS - list threads...');
  try {
    const comments = await client.comments.getCommentThreads(FILE_ID);
    results.comments = { status: comments.isError ? 'FAILED' : 'OK' };
    console.log('   ' + (comments.isError ? '✗' : '✓') + ' Comments');
  } catch (e) {
    results.comments = { status: 'FAILED', error: e.message };
    console.log('   ✗ Comments failed:', e.message);
  }

  // 11. Library
  console.log('11. LIBRARY - linked libraries...');
  try {
    const libs = await client.library.getLinkedLibraries(FILE_ID);
    results.library = { status: libs.isError ? 'FAILED' : 'OK' };
    console.log('   ' + (libs.isError ? '✗' : '✓') + ' Library');
  } catch (e) {
    results.library = { status: 'FAILED', error: e.message };
    console.log('   ✗ Library failed:', e.message);
  }

  // 12. FileChanges - add frame
  console.log('12. FILE_CHANGES - add frame...');
  try {
    const frame = await client.fileChanges.addFrame(FILE_ID, PAGE_ID, {
      x: 2000, y: 0, width: 375, height: 812, name: 'Test Frame'
    });
    results.add_frame = { status: frame.isError ? 'FAILED' : 'OK' };
    console.log('   ' + (frame.isError ? '✗' : '✓') + ' Add Frame');
  } catch (e) {
    results.add_frame = { status: 'FAILED', error: e.message };
    console.log('   ✗ Add frame failed:', e.message);
  }

  // 13. FileChanges - add rectangle
  console.log('13. FILE_CHANGES - add rectangle...');
  try {
    const rect = await client.fileChanges.addRectangle(FILE_ID, PAGE_ID, {
      x: 2050, y: 100, width: 100, height: 50, name: 'Test Rect', fill: '#FF5733'
    });
    results.add_rectangle = { status: rect.isError ? 'FAILED' : 'OK' };
    console.log('   ' + (rect.isError ? '✗' : '✓') + ' Add Rectangle');
  } catch (e) {
    results.add_rectangle = { status: 'FAILED', error: e.message };
    console.log('   ✗ Add rectangle failed:', e.message);
  }

  // 14. FileChanges - add ellipse
  console.log('14. FILE_CHANGES - add ellipse...');
  try {
    const ellipse = await client.fileChanges.addEllipse(FILE_ID, PAGE_ID, {
      x: 2200, y: 100, width: 80, height: 80, name: 'Test Circle', fill: '#3498DB'
    });
    results.add_ellipse = { status: ellipse.isError ? 'FAILED' : 'OK' };
    console.log('   ' + (ellipse.isError ? '✗' : '✓') + ' Add Ellipse');
  } catch (e) {
    results.add_ellipse = { status: 'FAILED', error: e.message };
    console.log('   ✗ Add ellipse failed:', e.message);
  }

  // 15. FileChanges - create color token
  console.log('15. FILE_CHANGES - create color...');
  try {
    const color = await client.fileChanges.addColor(FILE_ID, {
      name: 'Primary Blue', color: '#007AFF', opacity: 1
    });
    results.create_color = { status: color.isError ? 'FAILED' : 'OK' };
    console.log('   ' + (color.isError ? '✗' : '✓') + ' Create Color');
  } catch (e) {
    results.create_color = { status: 'FAILED', error: e.message };
    console.log('   ✗ Create color failed:', e.message);
  }

  // 16. FileChanges - create typography
  console.log('16. FILE_CHANGES - create typography...');
  try {
    const typo = await client.fileChanges.addTypography(FILE_ID, {
      name: 'Heading 1',
      'font-family': 'Inter',
      'font-size': 32,
      'font-weight': '700',
      'line-height': 1.2
    });
    results.create_typography = { status: typo.isError ? 'FAILED' : 'OK' };
    console.log('   ' + (typo.isError ? '✗' : '✓') + ' Create Typography');
  } catch (e) {
    results.create_typography = { status: 'FAILED', error: e.message };
    console.log('   ✗ Create typography failed:', e.message);
  }

  console.log('\n=== SUMMARY ===');
  const passed = Object.values(results).filter(r => r.status === 'OK').length;
  const total = Object.keys(results).length;
  console.log(`Passed: ${passed}/${total}`);
  
  console.log('\n=== DETAILS ===');
  for (const [key, val] of Object.entries(results)) {
    console.log(`${val.status === 'OK' ? '✓' : '✗'} ${key}: ${val.status}`);
  }
}

testAllTools().catch(console.error);
