#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Post-build script to replace 'assert { type: "json" }' with 'with { type: "json" }'
 * for Node.js 22+ compatibility while maintaining support for Node.js 17.5+
 */

function processFile(filePath) {
  if (!filePath.endsWith('.js')) return;
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace assert syntax with with syntax for Node 22+ compatibility
    const updated = content.replace(
      /assert\s*{\s*type:\s*["']json["']\s*}/g, 
      'with { type: "json" }'
    );
    
    if (content !== updated) {
      fs.writeFileSync(filePath, updated, 'utf8');
      console.log(`Updated import assertions in: ${path.relative(process.cwd(), filePath)}`);
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
  }
}

function processDirectory(dirPath) {
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      
      if (entry.isDirectory()) {
        processDirectory(fullPath);
      } else if (entry.isFile()) {
        processFile(fullPath);
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dirPath}:`, error.message);
  }
}

const distPath = path.join(process.cwd(), 'dist');

if (fs.existsSync(distPath)) {
  console.log('Processing built files for import assertion compatibility...');
  processDirectory(distPath);
  console.log('Post-build processing complete.');
} else {
  console.warn('Dist directory not found. Run build first.');
  process.exit(1);
}