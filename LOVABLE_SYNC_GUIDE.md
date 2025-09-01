# Lovable + Local Development Sync Guide

## 🚀 Project Status: SYNCED ✅

Your Station-2100 project is now fully synchronized between your local development environment and Lovable!

**Lovable Project URL**: https://lovable.dev/projects/3be45a24-6b88-4267-b181-6d323de70799  
**GitHub Repository**: https://github.com/gtthande/Station-2100.git

## 🔄 Dual Development Workflow

### Option 1: Develop Locally, Sync to Lovable
```bash
# 1. Make changes in your local IDE
# 2. Test locally with npm run dev
# 3. Commit and push to sync with Lovable
git add .
git commit -m "Description of changes"
git push origin main
```

### Option 2: Develop in Lovable, Sync to Local
```bash
# 1. Make changes in Lovable
# 2. Changes auto-commit to GitHub
# 3. Pull changes to local environment
git pull origin main
npm install  # if new dependencies added
```

### Option 3: Hybrid Development
- Use Lovable for quick prototypes and AI-assisted coding
- Use local IDE for complex debugging and testing
- Both environments stay in sync via GitHub

## 🛠️ Local Development Setup

### Prerequisites
- Node.js 18+ and npm
- Git configured with your credentials
- Supabase CLI (optional, for database management)

### Quick Start
```bash
# Clone the repository
git clone https://github.com/gtthande/Station-2100.git
cd Station-2100

# Install dependencies
npm install

# Start development server
npm run dev
```

### Environment Configuration
```bash
# Copy environment template
cp .env.example .env

# Update with your Supabase credentials
VITE_SUPABASE_URL=https://jarlvtojzqkccovburmi.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

## 🔧 Available Scripts

```bash
# Development
npm run dev                    # Start dev server on port 8080
npm run start:all            # Push DB + start dev server

# Database Management
npm run db:push              # Push local migrations to Supabase
npm run link                 # Link to Supabase project
npm run migrate              # Create new migration

# Reset & Maintenance
npm run reset                # Full reset: kill processes + link + push + dev
```

## 📊 Sync Status Check

### Verify Local ↔ Lovable Sync
```bash
# Check if local is up to date
git status

# Check remote changes
git fetch origin
git log HEAD..origin/main --oneline

# Pull latest changes
git pull origin main
```

### Verify Supabase Connection
```bash
# Test database connectivity
curl http://localhost:8080/api/supabase-check
```

## 🚨 Common Sync Issues & Solutions

### Issue: Merge Conflicts
```bash
# 1. Stash local changes
git stash

# 2. Pull latest from remote
git pull origin main

# 3. Apply stashed changes
git stash pop

# 4. Resolve conflicts and commit
git add .
git commit -m "Resolved merge conflicts"
git push origin main
```

### Issue: Local Behind Remote
```bash
# Pull latest changes
git pull origin main

# Install any new dependencies
npm install
```

### Issue: Supabase Schema Mismatch
```bash
# Reset database to match remote
npm run db:push

# Or create new migration
npm run migrate
```

## 🎯 Best Practices

### For Local Development
1. **Always pull before starting work**: `git pull origin main`
2. **Test locally before pushing**: `npm run dev` and verify functionality
3. **Use meaningful commit messages**: Describe what changed and why
4. **Keep dependencies updated**: Run `npm install` after pulling

### For Lovable Development
1. **Use descriptive prompts**: Be specific about what you want to change
2. **Review generated code**: Always test AI-generated code before committing
3. **Leverage AI for repetitive tasks**: Let Lovable handle boilerplate code
4. **Use Lovable for quick prototypes**: Perfect for rapid iteration

### For Database Changes
1. **Create migrations for schema changes**: Use `npm run migrate`
2. **Test migrations locally**: Verify with `npm run db:push`
3. **Document complex changes**: Update README.md for major schema changes

## 🔍 Monitoring & Maintenance

### Regular Sync Checks
```bash
# Daily: Check for remote updates
git fetch origin
git status

# Weekly: Update dependencies
npm update

# Monthly: Review and clean up
npm audit fix
```

### Performance Monitoring
- Monitor build times: `time npm run build`
- Check bundle size: `npm run build && du -sh dist/`
- Verify Supabase performance in dashboard

## 🆘 Troubleshooting

### Development Server Issues
```bash
# Kill stuck processes
taskkill /F /IM node.exe /T

# Clear cache and restart
npm run reset
```

### Database Connection Issues
```bash
# Verify Supabase project link
npm run link

# Check environment variables
echo $env:VITE_SUPABASE_URL
```

### Build Issues
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check TypeScript errors
npx tsc --noEmit
```

## 📞 Support Resources

- **Lovable Documentation**: https://docs.lovable.dev/
- **Supabase Documentation**: https://supabase.com/docs
- **Project Issues**: Create issues in GitHub repository
- **Local Development**: Use `npm run dev` for testing

## 🎉 Success Metrics

Your project is successfully synced when:
- ✅ Local `git status` shows "up to date with origin/main"
- ✅ Lovable shows latest changes from GitHub
- ✅ `npm run dev` starts without errors
- ✅ Supabase connection test passes
- ✅ All components render correctly

---

**Last Updated**: $(date)  
**Sync Status**: ✅ FULLY SYNCHRONIZED  
**Next Sync Check**: Recommended daily during active development
