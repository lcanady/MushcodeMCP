# MUSHCODE Knowledge Base Data

This directory contains the persistent JSON files for the MUSHCODE knowledge base.

## File Structure

When populated, this directory will contain:

### Individual Data Files
- `patterns.json` - MUSHCODE patterns and templates
- `examples.json` - Code examples and educational content  
- `dialects.json` - Server dialect definitions (PennMUSH, TinyMUSH, etc.)
- `security-rules.json` - Security vulnerability detection rules
- `learning-paths.json` - Progressive learning sequences
- `metadata.json` - Knowledge base metadata and statistics

### Combined File
- `knowledge-base.json` - Complete knowledge base in single file

## Usage

### Populate Knowledge Base
```bash
# Scrape entire mushcode.com site and save to JSON files
npm run populate-kb

# Force re-scrape even if data exists
npm run populate-kb -- --force
```

### Load Knowledge Base
```bash
# Load and display knowledge base information
npm run load-kb
```

### Programmatic Usage
```typescript
import { KnowledgeBasePersistence } from './src/knowledge/persistence.js';

const persistence = new KnowledgeBasePersistence();

// Save knowledge base
await persistence.save(knowledgeBase);

// Load knowledge base
const loadedKB = await persistence.load();

// Check if data exists
const exists = await persistence.exists();

// Get metadata
const info = await persistence.getInfo();
```

## Data Sources

The knowledge base is populated from:
- **mushcode.com** - Community archive of MUSHCODE examples (395+ files)
- **Built-in patterns** - Common MUSHCODE templates and structures
- **Security rules** - Vulnerability detection patterns
- **Learning paths** - Educational content organization

## File Sizes

Typical file sizes after full population:
- `patterns.json`: ~200-500 KB (133+ patterns)
- `examples.json`: ~1-3 MB (381+ examples)  
- `dialects.json`: ~50-100 KB (server definitions)
- `security-rules.json`: ~20-50 KB (security rules)
- `learning-paths.json`: ~20-50 KB (learning content)
- `knowledge-base.json`: ~1.5-4 MB (combined file)

## Git Ignore

The JSON data files are excluded from git (`.gitignore`) because:
- They are large (several MB total)
- They can be regenerated from source
- They change frequently during development

To share knowledge base data:
1. Run `npm run populate-kb` to generate files
2. Or use the export/import functionality in the persistence layer

## Backup and Export

```typescript
// Export to specific directory
await persistence.exportTo('/backup/path', knowledgeBase);

// Import from specific directory  
const importedKB = await persistence.importFrom('/backup/path');
```