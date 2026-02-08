# DropLabz Documentation Index

Welcome to the DropLabz documentation. This index guides you to the right resources based on what you're trying to do.

---

## 🚀 Quick Navigation

### **I'm just getting started**

- **[QUICKSTART.md](./QUICKSTART.md)** — Development commands and setup checklists
- **[SETUP.md](./SETUP.md)** — Detailed environment configuration
- **[README.md](./README.md)** — Project overview and architecture

### **I want to understand the system**

- **[PLATFORM_ARCHITECTURE.md](./PLATFORM_ARCHITECTURE.md)** — Complete system design, features, and data flows
- **[DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md)** — Visual design, brand guidelines, component patterns

### **I need wallet/auth setup**

- **[docs/guides/WALLET_INTEGRATION.md](./docs/guides/WALLET_INTEGRATION.md)** — Solana wallet adapter setup
- **[.github/copilot-instructions.md](./.github/copilot-instructions.md)** — Development patterns and security best practices

### **I'm working on code quality**

- **[PRETTIER_SETUP.md](./PRETTIER_SETUP.md)** — Code formatting with Solana Prettier config
- Run: `pnpm format && pnpm type-check` before committing

---

## 📂 Documentation Structure

```
/docs/
├── guides/                # How-to guides and setup tutorials
│   └── WALLET_INTEGRATION.md
└── archived/              # Completed work, investigations, outdated deployments
    ├── PHASE_*.md         # Phase-specific work summaries
    ├── DISCORD_*.md       # Discord setup investigations (all resolved)
    ├── VERCEL_*.md        # Deployment fix history
    └── ... and 30+ other completed work files
```

---

## 📋 Core Documentation (Root Level)

| Document                     | Purpose                                         | Audience                 |
| ---------------------------- | ----------------------------------------------- | ------------------------ |
| **README.md**                | Project overview, quick start, tech stack       | Everyone                 |
| **QUICKSTART.md**            | Common commands and development workflows       | Developers               |
| **SETUP.md**                 | Detailed environment configuration guide        | New developers           |
| **DESIGN_SYSTEM.md**         | Visual identity, colors, components, typography | Designers, Frontend devs |
| **PLATFORM_ARCHITECTURE.md** | Complete system design, features, data flows    | Architects, Senior devs  |
| **PRETTIER_SETUP.md**        | Code formatting rules and enforcement           | All developers           |

---

## 🔗 Key Resources

### **Development Workflows**

```sh
pnpm install          # Install dependencies
pnpm dev              # Start all services
pnpm format           # Format code with Prettier
pnpm type-check       # Check TypeScript types
pnpm db:push          # Push schema to database
pnpm db:studio        # Open Prisma Studio
```

### **Architecture References**

- **Multi-tenant design**: See PLATFORM_ARCHITECTURE.md → Multi-Tenant Security section
- **Database schema**: See apps/web/prisma/schema.prisma
- **Auth middleware**: See apps/web/src/lib/auth/middleware.ts
- **Solana integration**: See docs/guides/WALLET_INTEGRATION.md

### **Design References**

- **Colors**: DESIGN_SYSTEM.md → Color Palette section
- **Typography**: DESIGN_SYSTEM.md → Typography section
- **Component patterns**: DESIGN_SYSTEM.md → UI Component Patterns section
- **Brand**: DESIGN_SYSTEM.md → Platform Personality section

---

## 📍 Common Questions

### "How do I set up the database?"

→ [SETUP.md](./SETUP.md) → Database Setup section

### "How do I add a new API endpoint?"

→ **.github/copilot-instructions.md** → Common Tasks → Add New API Endpoint

### "What's our color scheme?"

→ [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) → Color Palette section

### "How does wallet verification work?"

→ [docs/guides/WALLET_INTEGRATION.md](./docs/guides/WALLET_INTEGRATION.md)

### "How do I format my code?"

→ [PRETTIER_SETUP.md](./PRETTIER_SETUP.md)

---

---

## 🎯 For Different Roles

### **New Developer Onboarding**

1. Read [README.md](./README.md)
2. Follow [SETUP.md](./SETUP.md)
3. Run through [QUICKSTART.md](./QUICKSTART.md)
4. Review **.github/copilot-instructions.md** for coding patterns

### **Frontend Developer**

- [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) — Visual guidelines
- **apps/web/src/components/** — Component source code

### **Backend Developer**

- [PLATFORM_ARCHITECTURE.md](./PLATFORM_ARCHITECTURE.md) → API Routes section
- **apps/web/prisma/schema.prisma** — Database schema
- **apps/web/src/app/api/** — Route implementations

### **DevOps/Infrastructure**

- [SETUP.md](./SETUP.md) → Database and environment configuration
- [PRETTIER_SETUP.md](./PRETTIER_SETUP.md) — CI formatting requirements
- **apps/web/.env.example** → Environment variables needed

### **Project Manager/Stakeholder**

- [README.md](./README.md) → Project overview
- [PLATFORM_ARCHITECTURE.md](./PLATFORM_ARCHITECTURE.md) → Feature descriptions

---

## 🔄 Documentation Maintenance

Documentation is maintained as code. To update:

1. Edit the relevant `.md` file
2. Run `pnpm format` to ensure consistency
3. Commit with clear message: `docs: update <section>`

---

## 📦 Archived Documentation

Completed work, phase summaries, and resolved investigations are stored in [`/docs/archived/`](./docs/archived/) including:

- **Deployment fixes** — VERCEL*\*.md, REGISTRY*\*.md (reference only; production is live)
- **Phase summaries** — PHASE\_\*.md (completed work summaries)
- **Discord setup investigations** — DISCORD*WIZARD*_.md, DISCORD*BOT*_.md (all resolved; code is live)
- **Other completed work** — Event time fixes, winner announcements, embed builders, etc.

**These are for reference only.** Active development focuses on the core documentation in the root and `/docs/guides/`.

---

**Last Updated**: February 8, 2026  
**Status**: Active - Core documentation consolidated and organized
