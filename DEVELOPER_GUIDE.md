# GentePRO Developer Guide

## Overview

This guide provides comprehensive information for developers working with the GentePRO system, including setup instructions, development workflows, architecture patterns, and best practices.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Architecture Overview](#architecture-overview)
3. [Development Setup](#development-setup)
4. [Code Organization](#code-organization)
5. [Development Workflows](#development-workflows)
6. [Testing Strategies](#testing-strategies)
7. [Deployment Guide](#deployment-guide)
8. [Performance Optimization](#performance-optimization)
9. [Security Best Practices](#security-best-practices)
10. [Troubleshooting](#troubleshooting)

## Getting Started

### Prerequisites

- **Node.js 18+**: JavaScript runtime
- **PostgreSQL 13+**: Database server
- **Git**: Version control
- **VS Code**: Recommended IDE with extensions

### Quick Start

```bash
# Clone the repository
git clone <repository-url>
cd gentepro

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Configure database connection in .env
DATABASE_URL="postgresql://username:password@localhost:5432/gentepro"

# Apply database schema
npm run db:push

# Start development server
npm run dev
```

**Access the application:**
- Frontend: `http://localhost:5000`
- API: `http://localhost:5000/api`

### Default Accounts

After first setup, use these accounts:

```
Admin: admin@gentepro.com / admin123
Recruiter: recrutador@gentepro.com / recrutador123
Manager: gestor@gentepro.com / gestor123
```

## Architecture Overview

### System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   React + TS    │◄──►│   Express + TS  │◄──►│   PostgreSQL    │
│   Vite + SWC    │    │   Drizzle ORM   │    │   Neon Cloud    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   State Mgmt    │    │   Services      │    │   Migrations    │
│   React Query   │    │   Business Logic│    │   Schema Mgmt   │
│   Local State   │    │   External APIs │    │   Data Seeding  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Technology Stack

#### Frontend Stack
- **React 18**: UI framework with concurrent features
- **TypeScript**: Type safety and developer experience
- **Vite**: Fast build tool and dev server
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: High-quality component library
- **React Query**: Server state management
- **React Hook Form**: Form state and validation
- **Wouter**: Lightweight client-side routing

#### Backend Stack
- **Node.js**: JavaScript runtime environment
- **Express.js**: Web application framework
- **TypeScript**: Type safety for server code
- **Drizzle ORM**: Type-safe SQL toolkit
- **PostgreSQL**: Relational database
- **Passport.js**: Authentication middleware
- **Express Session**: Session management

#### External Services
- **OpenAI**: AI-powered recommendations
- **SendGrid**: Email delivery service
- **WhatsApp API**: Messaging integration
- **Neon Database**: Managed PostgreSQL

### Folder Structure

```
gentepro/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/           # Utility functions
│   │   └── App.tsx        # Main application component
│   ├── public/            # Static assets
│   └── vite.config.ts     # Vite configuration
├── server/                # Backend Node.js application
│   ├── services/          # Business logic services
│   ├── middleware/        # Express middleware
│   ├── routes.ts          # API route definitions
│   ├── auth.ts            # Authentication setup
│   ├── storage.ts         # Data access layer
│   └── index.ts           # Server entry point
├── shared/                # Shared code between client/server
│   └── schema.ts          # Database schema and types
├── migrations/            # Database migration files
├── docs/                  # Documentation files
└── package.json          # Project dependencies
```

## Development Setup

### Environment Configuration

Create `.env` file with the following variables:

```bash
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/gentepro"

# Session
SESSION_SECRET="your-super-secret-session-key"

# Environment
NODE_ENV="development"
PORT=5000

# Email Configuration (Choose one)
# Option 1: SendGrid
SENDGRID_API_KEY="your-sendgrid-api-key"
FROM_EMAIL="noreply@yourcompany.com"

# Option 2: SMTP
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"

# WhatsApp (Optional)
WHATSAPP_API_URL="https://api.whatsapp.com/send"
WHATSAPP_API_TOKEN="your-whatsapp-api-token"

# AI Features (Optional)
OPENAI_API_KEY="your-openai-api-key"
HF_API_KEY="your-huggingface-api-key"
```

### VS Code Setup

Recommended extensions:
- TypeScript
- ES7+ React/Redux/React-Native snippets
- Tailwind CSS IntelliSense
- Prettier
- ESLint
- Auto Rename Tag
- GitLens

`.vscode/settings.json`:
```json
{
  "typescript.preferences.includePackageJsonAutoImports": "auto",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "emmet.includeLanguages": {
    "typescript": "html",
    "typescriptreact": "html"
  }
}
```

### Database Setup

#### Local PostgreSQL

```bash
# Install PostgreSQL (macOS)
brew install postgresql

# Start PostgreSQL service
brew services start postgresql

# Create database
createdb gentepro

# Create user
psql gentepro
CREATE USER gentepro_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE gentepro TO gentepro_user;
```

#### Using Neon (Recommended)

1. Sign up at [neon.tech](https://neon.tech)
2. Create a new project
3. Copy the connection string to `.env`

#### Apply Schema

```bash
# Push schema to database
npm run db:push

# Run seed data (optional)
npm run db:seed
```

## Code Organization

### Component Structure

```typescript
// components/ExampleComponent.tsx
import React from 'react';
import { cn } from '@/lib/utils';

interface ExampleComponentProps {
  title: string;
  description?: string;
  variant?: 'default' | 'outline';
  children?: React.ReactNode;
  className?: string;
}

export function ExampleComponent({
  title,
  description,
  variant = 'default',
  children,
  className
}: ExampleComponentProps) {
  return (
    <div className={cn(
      'rounded-lg border p-4',
      variant === 'default' && 'bg-white',
      variant === 'outline' && 'border-2',
      className
    )}>
      <h3 className="text-lg font-semibold">{title}</h3>
      {description && (
        <p className="text-muted-foreground">{description}</p>
      )}
      {children}
    </div>
  );
}
```

### Service Layer Pattern

```typescript
// services/candidate-service.ts
export class CandidateService {
  private db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  async createCandidate(data: CreateCandidateData): Promise<Candidate> {
    // Validation
    this.validateCandidateData(data);
    
    // Business logic
    const hashedPassword = await this.hashPassword(data.password);
    
    // Database operation
    const candidate = await this.db
      .insert(candidatos)
      .values({ ...data, password: hashedPassword })
      .returning();
    
    // Post-processing
    await this.sendWelcomeEmail(candidate);
    
    return candidate;
  }

  private validateCandidateData(data: CreateCandidateData): void {
    if (!data.email || !isValidEmail(data.email)) {
      throw new ValidationError('Invalid email address');
    }
    // Additional validation...
  }

  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  private async sendWelcomeEmail(candidate: Candidate): Promise<void> {
    // Email sending logic...
  }
}
```

### Error Handling Pattern

```typescript
// lib/errors.ts
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400,
    public field?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, field?: string) {
    super(message, 'VALIDATION_ERROR', 400, field);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 'NOT_FOUND', 404);
  }
}

// Usage in routes
app.post('/api/candidates', async (req, res, next) => {
  try {
    const candidate = await candidateService.createCandidate(req.body);
    res.status(201).json(candidate);
  } catch (error) {
    next(error);
  }
});

// Global error handler
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      message: error.message,
      code: error.code,
      field: error.field
    });
  }
  
  console.error(error);
  res.status(500).json({
    message: 'Internal server error',
    code: 'INTERNAL_ERROR'
  });
});
```

### React Query Integration

```typescript
// hooks/useCandidates.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useCandidates(filters?: CandidateFilters) {
  return useQuery({
    queryKey: ['candidates', filters],
    queryFn: () => fetchCandidates(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCreateCandidate() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createCandidate,
    onSuccess: () => {
      // Invalidate and refetch candidates
      queryClient.invalidateQueries({ queryKey: ['candidates'] });
    },
    onError: (error) => {
      // Handle error (show toast, etc.)
      toast.error(error.message);
    }
  });
}

// Usage in component
function CandidatesPage() {
  const [filters, setFilters] = useState<CandidateFilters>({});
  const { data: candidates, isLoading, error } = useCandidates(filters);
  const createCandidateMutation = useCreateCandidate();

  const handleCreateCandidate = (data: CreateCandidateData) => {
    createCandidateMutation.mutate(data);
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <div>
      <CandidateFilters filters={filters} onChange={setFilters} />
      <CandidateList candidates={candidates} />
      <CreateCandidateModal onSubmit={handleCreateCandidate} />
    </div>
  );
}
```

## Development Workflows

### Git Workflow

```bash
# Feature development
git checkout -b feature/candidate-bulk-actions
# Make changes
git add .
git commit -m "feat: add bulk actions for candidates"
git push origin feature/candidate-bulk-actions
# Create pull request

# Hotfix
git checkout -b hotfix/fix-login-issue
# Make changes
git add .
git commit -m "fix: resolve login session issue"
git push origin hotfix/fix-login-issue
# Create pull request to main
```

### Code Review Checklist

#### Frontend
- [ ] Component props are properly typed
- [ ] Accessibility attributes are included
- [ ] Loading and error states are handled
- [ ] Form validation is implemented
- [ ] Responsive design is tested
- [ ] Performance optimizations are applied

#### Backend
- [ ] Input validation is comprehensive
- [ ] Error handling is consistent
- [ ] Database queries are optimized
- [ ] Authentication/authorization is enforced
- [ ] API documentation is updated
- [ ] Rate limiting is considered

### Development Commands

```bash
# Development
npm run dev              # Start development server
npm run check            # TypeScript type checking
npm run build            # Build for production
npm run start            # Start production server

# Database
npm run db:push          # Apply schema changes
npm run db:studio        # Open Drizzle Studio
npm run db:generate      # Generate migrations
npm run db:migrate       # Run migrations

# Code Quality
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint issues
npm run format           # Format code with Prettier
npm run type-check       # TypeScript checking

# Testing
npm run test             # Run tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Generate coverage report
npm run test:e2e         # Run end-to-end tests
```

### Debugging

#### Frontend Debugging

```typescript
// React DevTools
// Install React Developer Tools browser extension

// Console debugging
console.log('Debug data:', { candidates, filters });

// React Query DevTools
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

function App() {
  return (
    <>
      <MyApp />
      <ReactQueryDevtools initialIsOpen={false} />
    </>
  );
}

// Error boundaries
class ErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }
    return this.props.children;
  }
}
```

#### Backend Debugging

```typescript
// Debug logging
import debug from 'debug';
const log = debug('app:candidates');

log('Creating candidate: %O', candidateData);

// Database query debugging
const candidates = await db
  .select()
  .from(candidatos)
  .where(eq(candidatos.status, 'ativo'));

console.log('SQL Query:', candidates.toSQL());

// Performance monitoring
const start = Date.now();
const result = await expensiveOperation();
console.log(`Operation took ${Date.now() - start}ms`);

// Memory usage
const memUsage = process.memoryUsage();
console.log('Memory usage:', {
  rss: `${Math.round(memUsage.rss / 1024 / 1024)} MB`,
  heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)} MB`
});
```

## Testing Strategies

### Frontend Testing

#### Unit Testing with Vitest

```typescript
// components/__tests__/CandidateCard.test.tsx
import { render, screen } from '@testing-library/react';
import { CandidateCard } from '../CandidateCard';
import { mockCandidate } from '../../__mocks__/candidates';

describe('CandidateCard', () => {
  it('displays candidate information correctly', () => {
    render(<CandidateCard candidate={mockCandidate} />);
    
    expect(screen.getByText(mockCandidate.nome)).toBeInTheDocument();
    expect(screen.getByText(mockCandidate.email)).toBeInTheDocument();
    expect(screen.getByText(mockCandidate.cargo)).toBeInTheDocument();
  });

  it('handles missing optional fields gracefully', () => {
    const candidateWithoutCargo = { ...mockCandidate, cargo: null };
    
    render(<CandidateCard candidate={candidateWithoutCargo} />);
    
    expect(screen.queryByText('Cargo não informado')).toBeInTheDocument();
  });
});
```

#### Integration Testing

```typescript
// pages/__tests__/CandidatesPage.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CandidatesPage } from '../CandidatesPage';
import { server } from '../../__mocks__/server';

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false }
  }
});

function renderWithQueryClient(ui: React.ReactElement) {
  const testQueryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={testQueryClient}>
      {ui}
    </QueryClientProvider>
  );
}

describe('CandidatesPage', () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('loads and displays candidates', async () => {
    renderWithQueryClient(<CandidatesPage />);
    
    expect(screen.getByText('Carregando...')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('João Silva')).toBeInTheDocument();
      expect(screen.getByText('Maria Santos')).toBeInTheDocument();
    });
  });

  it('filters candidates by status', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<CandidatesPage />);
    
    await waitFor(() => {
      expect(screen.getByText('João Silva')).toBeInTheDocument();
    });
    
    await user.selectOptions(screen.getByRole('combobox', { name: /status/i }), 'inativo');
    
    await waitFor(() => {
      expect(screen.queryByText('João Silva')).not.toBeInTheDocument();
    });
  });
});
```

### Backend Testing

#### API Testing

```typescript
// routes/__tests__/candidates.test.ts
import request from 'supertest';
import { app } from '../../app';
import { db } from '../../db';
import { candidatos } from '../../../shared/schema';

describe('Candidates API', () => {
  beforeEach(async () => {
    await db.delete(candidatos);
  });

  describe('POST /api/candidatos', () => {
    it('creates a new candidate', async () => {
      const candidateData = {
        nome: 'Test Candidate',
        email: 'test@example.com',
        telefone: '11999999999',
        empresaId: 'company-uuid'
      };

      const response = await request(app)
        .post('/api/candidatos')
        .send(candidateData)
        .expect(201);

      expect(response.body).toMatchObject({
        nome: candidateData.nome,
        email: candidateData.email
      });
    });

    it('validates required fields', async () => {
      const response = await request(app)
        .post('/api/candidatos')
        .send({})
        .expect(400);

      expect(response.body.message).toContain('nome is required');
    });
  });

  describe('GET /api/candidatos', () => {
    it('returns paginated candidates', async () => {
      // Create test candidates
      await db.insert(candidatos).values([
        { nome: 'Candidate 1', email: 'c1@test.com', empresaId: 'company-uuid' },
        { nome: 'Candidate 2', email: 'c2@test.com', empresaId: 'company-uuid' }
      ]);

      const response = await request(app)
        .get('/api/candidatos')
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body[0].nome).toBe('Candidate 1');
    });
  });
});
```

#### Service Testing

```typescript
// services/__tests__/candidate-service.test.ts
import { CandidateService } from '../candidate-service';
import { MockDatabase } from '../../__mocks__/database';

describe('CandidateService', () => {
  let candidateService: CandidateService;
  let mockDb: MockDatabase;

  beforeEach(() => {
    mockDb = new MockDatabase();
    candidateService = new CandidateService(mockDb);
  });

  describe('createCandidate', () => {
    it('creates candidate with hashed password', async () => {
      const candidateData = {
        nome: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        empresaId: 'company-uuid'
      };

      const result = await candidateService.createCandidate(candidateData);

      expect(result.password).not.toBe('password123');
      expect(result.email).toBe(candidateData.email);
      expect(mockDb.insert).toHaveBeenCalledWith(candidatos);
    });

    it('throws validation error for invalid email', async () => {
      const invalidData = {
        nome: 'Test User',
        email: 'invalid-email',
        password: 'password123',
        empresaId: 'company-uuid'
      };

      await expect(candidateService.createCandidate(invalidData))
        .rejects
        .toThrow('Invalid email address');
    });
  });
});
```

### E2E Testing with Playwright

```typescript
// e2e/candidates.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Candidate Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth');
    await page.fill('[data-testid=email]', 'admin@gentepro.com');
    await page.fill('[data-testid=password]', 'admin123');
    await page.click('[data-testid=login-button]');
    await page.waitForURL('/');
  });

  test('creates a new candidate', async ({ page }) => {
    await page.goto('/candidatos');
    await page.click('[data-testid=create-candidate-button]');
    
    await page.fill('[data-testid=candidate-name]', 'João Silva');
    await page.fill('[data-testid=candidate-email]', 'joao@example.com');
    await page.fill('[data-testid=candidate-phone]', '11999999999');
    
    await page.click('[data-testid=save-candidate-button]');
    
    await expect(page.locator('text=João Silva')).toBeVisible();
  });

  test('filters candidates by status', async ({ page }) => {
    await page.goto('/candidatos');
    
    await page.selectOption('[data-testid=status-filter]', 'ativo');
    
    await expect(page.locator('[data-testid=candidate-card]')).toHaveCount(3);
  });
});
```

## Deployment Guide

### Production Build

```bash
# Build the application
npm run build

# Test production build locally
npm run start
```

### Docker Deployment

```dockerfile
# Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM node:18-alpine AS runtime

WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 5000
CMD ["npm", "start"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - SESSION_SECRET=${SESSION_SECRET}
    depends_on:
      - postgres

  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: gentepro
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres_data:
```

### Railway Deployment

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Initialize project
railway init

# Set environment variables
railway variables set DATABASE_URL="your-database-url"
railway variables set SESSION_SECRET="your-session-secret"

# Deploy
railway up
```

### Vercel Deployment

```json
{
  "version": 2,
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "functions": {
    "server/index.js": {
      "maxDuration": 30
    }
  },
  "env": {
    "DATABASE_URL": "@database-url",
    "SESSION_SECRET": "@session-secret"
  }
}
```

### Environment Variables Checklist

Production environment variables:
- [ ] `DATABASE_URL` - PostgreSQL connection string
- [ ] `SESSION_SECRET` - Secure session secret (32+ characters)
- [ ] `NODE_ENV=production` - Environment setting
- [ ] `PORT` - Server port (default: 5000)
- [ ] Email configuration (SendGrid or SMTP)
- [ ] Optional: WhatsApp API credentials
- [ ] Optional: OpenAI API key

## Performance Optimization

### Frontend Optimization

#### Code Splitting

```typescript
// Lazy load pages
const CandidatesPage = lazy(() => import('@/pages/candidatos'));
const VagasPage = lazy(() => import('@/pages/vagas'));

// Route-based code splitting
<Route path="/candidatos" component={lazy(() => import('@/pages/candidatos'))} />
```

#### React Query Optimization

```typescript
// Optimize queries with select
const { data: candidateNames } = useQuery({
  queryKey: ['candidates'],
  queryFn: fetchCandidates,
  select: (data) => data.map(c => ({ id: c.id, nome: c.nome }))
});

// Background refetching
const { data } = useQuery({
  queryKey: ['candidates'],
  queryFn: fetchCandidates,
  staleTime: 5 * 60 * 1000, // 5 minutes
  refetchInterval: 30 * 1000 // 30 seconds
});

// Prefetch related data
const queryClient = useQueryClient();
queryClient.prefetchQuery({
  queryKey: ['candidate', candidateId],
  queryFn: () => fetchCandidate(candidateId)
});
```

#### Component Optimization

```typescript
// Memoize expensive components
const CandidateCard = memo(({ candidate }: { candidate: Candidate }) => {
  return (
    <div>
      <h3>{candidate.nome}</h3>
      <p>{candidate.email}</p>
    </div>
  );
});

// Optimize re-renders with useMemo
const filteredCandidates = useMemo(() => {
  return candidates.filter(c => c.status === 'ativo');
}, [candidates]);

// Optimize callbacks with useCallback
const handleCandidateSelect = useCallback((candidateId: string) => {
  setSelectedCandidate(candidateId);
}, []);
```

### Backend Optimization

#### Database Query Optimization

```typescript
// Use indexes
await db.execute(sql`CREATE INDEX idx_candidates_status ON candidatos(status)`);
await db.execute(sql`CREATE INDEX idx_vaga_candidatos_vaga_id ON vaga_candidatos(vaga_id)`);

// Optimize queries with select
const candidates = await db
  .select({
    id: candidatos.id,
    nome: candidatos.nome,
    email: candidatos.email
  })
  .from(candidatos)
  .where(eq(candidatos.status, 'ativo'));

// Use joins instead of N+1 queries
const candidatesWithCompanies = await db
  .select({
    candidate: candidatos,
    company: empresas
  })
  .from(candidatos)
  .leftJoin(empresas, eq(candidatos.empresaId, empresas.id));

// Pagination
const candidates = await db
  .select()
  .from(candidatos)
  .limit(20)
  .offset(page * 20);
```

#### Caching Strategies

```typescript
// In-memory caching
const cache = new Map<string, any>();

async function getCachedData<T>(key: string, fetcher: () => Promise<T>, ttl = 5 * 60 * 1000): Promise<T> {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < ttl) {
    return cached.data;
  }
  
  const data = await fetcher();
  cache.set(key, { data, timestamp: Date.now() });
  return data;
}

// Redis caching (production)
import Redis from 'ioredis';
const redis = new Redis(process.env.REDIS_URL);

async function getCachedDataRedis<T>(key: string, fetcher: () => Promise<T>, ttl = 300): Promise<T> {
  const cached = await redis.get(key);
  if (cached) {
    return JSON.parse(cached);
  }
  
  const data = await fetcher();
  await redis.setex(key, ttl, JSON.stringify(data));
  return data;
}
```

#### Rate Limiting Optimization

```typescript
// Custom rate limiter with Redis
import { RateLimiterRedis } from 'rate-limiter-flexible';

const rateLimiter = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: 'rl_api',
  points: 100, // requests
  duration: 900, // per 15 minutes
});

export const apiRateLimit = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await rateLimiter.consume(req.ip);
    next();
  } catch (rejRes) {
    res.status(429).json({
      message: 'Too many requests',
      retryAfter: Math.round(rejRes.msBeforeNext / 1000)
    });
  }
};
```

## Security Best Practices

### Input Validation

```typescript
// Use Zod for comprehensive validation
const createCandidateSchema = z.object({
  nome: z.string().min(1).max(255).trim(),
  email: z.string().email().toLowerCase(),
  telefone: z.string().regex(/^\(\d{2}\)\s\d{4,5}-\d{4}$/),
  cpf: z.string().regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/).optional()
});

// Sanitize HTML input
import DOMPurify from 'isomorphic-dompurify';

const sanitizeHTML = (input: string) => {
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [] });
};
```

### Authentication Security

```typescript
// Strong password hashing
import bcrypt from 'bcrypt';

const hashPassword = async (password: string) => {
  const saltRounds = 12; // Increase for higher security
  return bcrypt.hash(password, saltRounds);
};

// Session security
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    httpOnly: true, // Prevent XSS
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'strict' // CSRF protection
  },
  store: new (ConnectPgSimple(session))({
    pool: db, // PostgreSQL session store
    tableName: 'session'
  })
}));
```

### API Security

```typescript
// CORS configuration
import cors from 'cors';

app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com'] 
    : ['http://localhost:3000'],
  credentials: true
}));

// Security headers
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"]
    }
  }
}));

// SQL injection prevention
// Using Drizzle ORM with parameterized queries
const user = await db
  .select()
  .from(usuarios)
  .where(eq(usuarios.email, userEmail)); // Safe - parameterized

// NEVER do this:
// const query = `SELECT * FROM usuarios WHERE email = '${userEmail}'`; // DANGEROUS!
```

### File Upload Security

```typescript
import multer from 'multer';
import path from 'path';

const upload = multer({
  dest: '/tmp',
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 1
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

// Virus scanning (production)
import NodeClam from 'clamscan';

const clamscan = await new NodeClam().init({
  removeInfected: true,
  quarantineInfected: false,
  debugMode: false
});

const scanFile = async (filePath: string) => {
  const { isInfected, file, viruses } = await clamscan.scanFile(filePath);
  if (isInfected) {
    throw new Error(`File is infected: ${viruses.join(', ')}`);
  }
};
```

## Troubleshooting

### Common Issues

#### Database Connection Issues

```bash
# Check database connection
psql $DATABASE_URL

# Test connection from Node.js
node -e "
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query('SELECT NOW()', (err, res) => {
  if (err) console.error(err);
  else console.log('Connected:', res.rows[0]);
  pool.end();
});
"
```

#### Memory Issues

```bash
# Monitor memory usage
node --inspect server/index.js

# Increase Node.js memory limit
node --max-old-space-size=4096 server/index.js
```

#### Session Issues

```typescript
// Debug session middleware
app.use((req, res, next) => {
  console.log('Session:', req.session);
  console.log('User:', req.user);
  next();
});

// Check session store
app.get('/debug/session', (req, res) => {
  res.json({
    sessionID: req.sessionID,
    session: req.session,
    user: req.user
  });
});
```

#### Performance Issues

```typescript
// Profile database queries
import { performance } from 'perf_hooks';

const start = performance.now();
const result = await db.select().from(candidatos);
const end = performance.now();
console.log(`Query took ${end - start} milliseconds`);

// Monitor API response times
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
  });
  next();
});
```

### Debugging Commands

```bash
# Check application logs
npm run dev | grep ERROR

# Database schema inspection
npm run db:studio

# Check environment variables
node -e "console.log(process.env)"

# Network debugging
curl -v http://localhost:5000/api/user

# Memory profiling
node --inspect-brk server/index.js
# Open chrome://inspect in Chrome
```

### Error Monitoring

```typescript
// Sentry integration (production)
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV
});

// Capture errors
app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.errorHandler());

// Custom error tracking
const trackError = (error: Error, context?: any) => {
  console.error(error);
  Sentry.captureException(error, { extra: context });
};
```

### Health Checks

```typescript
// Health check endpoint
app.get('/health', async (req, res) => {
  const health = {
    uptime: process.uptime(),
    message: 'OK',
    timestamp: Date.now(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version
  };

  try {
    // Check database connection
    await db.select().from(usuarios).limit(1);
    health.database = 'Connected';
  } catch (error) {
    health.database = 'Error';
    health.message = 'Database connection failed';
    return res.status(503).json(health);
  }

  res.json(health);
});
```

This developer guide provides comprehensive information for working with the GentePRO system, from initial setup through production deployment and troubleshooting.
