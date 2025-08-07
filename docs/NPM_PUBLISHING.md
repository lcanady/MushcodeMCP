# NPM Publishing Guide

This guide explains how to publish the MushcodeMCP server as an npm package.

## 🚀 Quick Publish

### Prerequisites

1. **npm account**: Create account at [npmjs.com](https://www.npmjs.com)
2. **npm login**: `npm login`
3. **Built project**: `npm run build`
4. **Tests passing**: `npm test`

### Publish Steps

```bash
# 1. Update version (choose one)
npm version patch  # 1.0.0 -> 1.0.1
npm version minor  # 1.0.0 -> 1.1.0  
npm version major  # 1.0.0 -> 2.0.0

# 2. Build and test
npm run build
npm run test:unit

# 3. Publish to npm
npm publish

# 4. Verify publication
npm view mushcode-mcp-server
```

## 📋 Pre-Publish Checklist

### Required Files
- ✅ `package.json` - Complete with all metadata
- ✅ `README.md` - Comprehensive documentation
- ✅ `LICENSE` - MIT license file
- ✅ `dist/` - Compiled TypeScript code
- ✅ `docs/` - Documentation files
- ✅ `examples/` - Usage examples
- ✅ `mushcode-mcp.config.json` - Default configuration

### Package.json Validation
- ✅ **name**: Unique npm package name
- ✅ **version**: Semantic versioning
- ✅ **description**: Clear, detailed description
- ✅ **main**: Entry point (`dist/server/index.js`)
- ✅ **types**: TypeScript definitions
- ✅ **bin**: CLI command mapping
- ✅ **files**: Files to include in package
- ✅ **keywords**: Relevant search terms
- ✅ **author**: Your information
- ✅ **license**: MIT
- ✅ **repository**: GitHub URL
- ✅ **homepage**: Project homepage
- ✅ **bugs**: Issue tracker URL

### Code Quality
- ✅ **TypeScript compilation**: No errors
- ✅ **Unit tests**: All passing
- ✅ **Linting**: No errors or warnings
- ✅ **Dependencies**: Only production deps in dependencies
- ✅ **Security**: No known vulnerabilities

## 🔧 Configuration Updates

### Update Repository URLs

```bash
# Update package.json with your actual GitHub URLs
sed -i 's/your-username/YOUR_GITHUB_USERNAME/g' package.json
sed -i 's/your-email@domain.com/YOUR_EMAIL/g' package.json
```

### Update README

```bash
# Copy npm-specific README
cp README.npm.md README.md
```

## 📦 Package Contents

When published, your package will include:

```
mushcode-mcp-server/
├── dist/                    # Compiled JavaScript
│   ├── cli/                # CLI interface
│   ├── server/             # Server components
│   ├── tools/              # MCP tools
│   ├── types/              # Type definitions
│   └── utils/              # Utilities
├── data/                   # Knowledge base data
├── docs/                   # Documentation
├── examples/               # Usage examples
├── mushcode-mcp.config.json # Default config
├── README.md               # Package documentation
├── LICENSE                 # MIT license
└── package.json           # Package metadata
```

## 🎯 Usage After Publishing

### Global Installation
```bash
npm install -g mushcode-mcp-server
mushcode-mcp-server --help
```

### Local Installation
```bash
npm install mushcode-mcp-server
npx mushcode-mcp-server --help
```

### Programmatic Usage
```javascript
import { MushcodeProtocolHandler } from 'mushcode-mcp-server';
```

## 🔄 Version Management

### Semantic Versioning

- **PATCH** (1.0.X): Bug fixes, small improvements
- **MINOR** (1.X.0): New features, backwards compatible
- **MAJOR** (X.0.0): Breaking changes

### Version Update Process

```bash
# Patch version (bug fixes)
npm version patch
git push origin main --tags
npm publish

# Minor version (new features)
npm version minor
git push origin main --tags
npm publish

# Major version (breaking changes)
npm version major
git push origin main --tags
npm publish
```

## 🚀 Automated Publishing

### GitHub Actions Workflow

Create `.github/workflows/publish.yml`:

```yaml
name: Publish to NPM

on:
  push:
    tags:
      - 'v*'

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          registry-url: 'https://registry.npmjs.org'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Build
        run: npm run build
        
      - name: Test
        run: npm run test:unit
        
      - name: Publish to NPM
        run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

### Setup Secrets

1. Get npm token: `npm token create`
2. Add to GitHub Secrets: `NPM_TOKEN`

## 📊 Package Analytics

### Monitor Your Package

- **npm stats**: `npm view mushcode-mcp-server`
- **Download stats**: [npmjs.com/package/mushcode-mcp-server](https://npmjs.com/package/mushcode-mcp-server)
- **npm trends**: [npmtrends.com](https://npmtrends.com)

### Package Health

```bash
# Check for vulnerabilities
npm audit

# Check for outdated dependencies
npm outdated

# Update dependencies
npm update
```

## 🔍 Testing Published Package

### Test Installation

```bash
# Create test directory
mkdir test-mushcode-mcp
cd test-mushcode-mcp

# Install your published package
npm install mushcode-mcp-server

# Test CLI
npx mushcode-mcp-server --help
npx mushcode-mcp-server tools

# Test programmatic usage
node -e "import('mushcode-mcp-server').then(console.log)"
```

### Integration Tests

```bash
# Test with Claude Desktop
mushcode-mcp-server init
mushcode-mcp-server config
mushcode-mcp-server start

# Test network mode
mushcode-mcp-server network --port 3001 &
curl http://localhost:3001/health
```

## 📈 Promotion

### Documentation

- ✅ **README.md**: Comprehensive usage guide
- ✅ **API docs**: Generated from TypeScript
- ✅ **Examples**: Real-world usage scenarios
- ✅ **Changelog**: Version history

### Community

- 📝 **Blog post**: Announce your package
- 🐦 **Social media**: Share on Twitter, Reddit
- 📧 **MUD communities**: Share in relevant forums
- 🎥 **Demo video**: Show the package in action

## 🛠️ Maintenance

### Regular Tasks

- 🔄 **Update dependencies**: Monthly
- 🧪 **Run tests**: Before each release
- 📊 **Check analytics**: Monitor usage
- 🐛 **Fix issues**: Respond to bug reports
- ✨ **Add features**: Based on user feedback

### Support

- 📧 **Issue tracking**: GitHub Issues
- 💬 **Discussions**: GitHub Discussions
- 📚 **Documentation**: Keep updated
- 🤝 **Community**: Engage with users

---

**Your npm package is ready for the world! 🌍**

