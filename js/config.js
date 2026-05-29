// ============================================================
//  CONFIG.JS — Edit this file to connect to Google Sheets
// ============================================================

const CONFIG = {
  // ⚠️  Paste your deployed Google Apps Script Web App URL here
  GOOGLE_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbxvyHGSUZ8JCODRbRD89XuiA7WF3VpQOLZ2PBNUrAOruEWr8mG8dEHhryWVh9hYPhNEOQ/exec',

  APP_NAME:      'Artist Workstation Audit',
  COMPANY_NAME:  'House of Blue Beans',

  ITEMS_PER_PAGE: 15,

  SOFTWARE_OPTIONS: [
    'Blender',
    'Unreal Engine',
    'Maya',
    'Adobe Photoshop',
    'Adobe Illustrator',
    'Adobe After Effects',
    'Adobe Premiere Pro',
    'Adobe Substance 3D Painter',
    '3ds Max',
    'ZBrush',
    'Houdini',
    'Other'
  ],

  PROJECT_TYPE_OPTIONS: [
    'Modelling',
    'Texturing',
    'Still Rendering',
    'Lifestyle Rendering',
    'Lifestyle + AI',
    'Product Animation',
    'Unreal Engine Environment',
    'Unreal Engine Animation',
    'Others'
  ],

  HARDWARE_ISSUES: [
    'Rendering slow',
    'Unreal crashing',
    'GPU memory full',
    'Viewport lag',
    'Export slow',
    'Storage issue'
  ],

  // Column headers — must match Code.gs order
  ADMIN_COLUMNS: [
    'Timestamp', 'Employee Name', 'Role / Designation', 'Department / Team',
    'Software Used', 'Project Types', 'Primary Project Names',
    'Secondary Project Names', 'PC Handles Work?', 'Hardware Issues', 'Additional Notes'
  ]
};
