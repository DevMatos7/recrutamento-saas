# GentePRO Documentation Index

## Overview

This is the comprehensive documentation suite for the GentePRO Human Resources Management System. The documentation is organized into specialized guides covering different aspects of the system.

## Documentation Structure

### 📚 Core Documentation

#### [API Documentation](API_DOCUMENTATION.md)
Complete REST API reference with endpoints, authentication, request/response examples, and usage instructions.

**Contents:**
- Authentication & Authorization
- Company, Department & User Management
- Job & Candidate Management  
- Pipeline Management & Stage Configuration
- Test Management & DISC Assessments
- Interview Scheduling & Management
- AI-Powered Matching & Recommendations
- Communication Management
- Analytics & Reporting
- File Upload & Processing
- Error Handling & Rate Limiting
- SDK Examples & Integration Patterns

#### [Components Documentation](COMPONENTS_DOCUMENTATION.md)
Comprehensive guide to React components, their props, usage patterns, and integration examples.

**Contents:**
- Core Layout Components
- Form Components & Modals
- Data Display Components
- UI Component Library
- Page Components
- Custom Hooks & Utilities
- Component Architecture Patterns
- Best Practices & Testing

#### [Services Documentation](SERVICES_DOCUMENTATION.md)
Backend services documentation covering business logic, data access patterns, and service integrations.

**Contents:**
- Authentication Services
- Core Business Services
- Communication Services (Email/WhatsApp)
- Assessment Services (Tests/DISC)
- AI & Matching Services
- Data Storage Service
- Middleware Services
- Error Handling & Security

#### [Developer Guide](DEVELOPER_GUIDE.md)
Complete developer onboarding and workflow guide for contributing to the project.

**Contents:**
- Getting Started & Setup
- Architecture Overview
- Development Workflows
- Testing Strategies
- Deployment Guide
- Performance Optimization
- Security Best Practices
- Troubleshooting Guide

### 📋 Existing Documentation

#### [Installation Guide](INSTALLATION_GUIDE.md)
Step-by-step installation instructions for development and production environments.

#### [Dependencies Guide](DEPENDENCIES.md)
Detailed list of project dependencies and their purposes.

#### [README](README.md)
Project overview, features, and quick start guide.

#### [Audit Guide](AUDITORIA_GUIDE.md)
System audit trail and compliance documentation.

#### [Replit Configuration](replit.md)
Replit-specific configuration and deployment instructions.

## Quick Navigation

### For Developers
1. Start with [Developer Guide](DEVELOPER_GUIDE.md) for setup
2. Reference [API Documentation](API_DOCUMENTATION.md) for endpoints
3. Use [Components Documentation](COMPONENTS_DOCUMENTATION.md) for frontend
4. Consult [Services Documentation](SERVICES_DOCUMENTATION.md) for backend

### For API Consumers
1. [API Documentation](API_DOCUMENTATION.md) - Complete API reference
2. [Authentication](#authentication) - How to authenticate
3. [Error Handling](#error-responses) - Error codes and responses
4. [Rate Limiting](#rate-limiting) - Usage limits and headers

### For System Administrators
1. [Installation Guide](INSTALLATION_GUIDE.md) - Setup instructions
2. [Dependencies Guide](DEPENDENCIES.md) - System requirements
3. [Deployment Guide](DEVELOPER_GUIDE.md#deployment-guide) - Production deployment
4. [Security Best Practices](DEVELOPER_GUIDE.md#security-best-practices) - Security guidelines

### For Testers
1. [Testing Strategies](DEVELOPER_GUIDE.md#testing-strategies) - Testing approaches
2. [Components Documentation](COMPONENTS_DOCUMENTATION.md) - Component testing
3. [API Documentation](API_DOCUMENTATION.md) - API testing
4. [Error Handling](API_DOCUMENTATION.md#error-responses) - Error scenarios

## Feature Documentation

### 🏢 Multi-Company Management
- [Company Management API](API_DOCUMENTATION.md#company-management)
- [Department Management API](API_DOCUMENTATION.md#department-management)
- [User Management API](API_DOCUMENTATION.md#user-management)

### 👥 Candidate Management
- [Candidate Management API](API_DOCUMENTATION.md#candidate-management)
- [Candidate Portal API](API_DOCUMENTATION.md#candidate-portal-public-apis)
- [Candidate Components](COMPONENTS_DOCUMENTATION.md#form-components)
- [Candidate Services](SERVICES_DOCUMENTATION.md#core-business-services)

### 💼 Job Management
- [Job Management API](API_DOCUMENTATION.md#job-management)
- [Pipeline Management API](API_DOCUMENTATION.md#pipeline-management)
- [Pipeline Components](COMPONENTS_DOCUMENTATION.md#data-display-components)
- [Pipeline Services](SERVICES_DOCUMENTATION.md#core-business-services)

### 🎯 Assessment System
- [Test Management API](API_DOCUMENTATION.md#test-management)
- [DISC Assessment API](API_DOCUMENTATION.md#disc-assessment)
- [Assessment Services](SERVICES_DOCUMENTATION.md#assessment-services)
- [Assessment Components](COMPONENTS_DOCUMENTATION.md#page-components)

### 📅 Interview Management
- [Interview Management API](API_DOCUMENTATION.md#interview-management)
- [Interview Services](SERVICES_DOCUMENTATION.md#assessment-services)
- [Interview Components](COMPONENTS_DOCUMENTATION.md#page-components)

### 🤖 AI & Matching
- [Matching API](API_DOCUMENTATION.md#matching--ai-recommendations)
- [AI Services](SERVICES_DOCUMENTATION.md#ai--matching-services)
- [AI Components](COMPONENTS_DOCUMENTATION.md#page-components)

### 📧 Communication System
- [Communication API](API_DOCUMENTATION.md#communication-management)
- [Communication Services](SERVICES_DOCUMENTATION.md#communication-services)
- [Templates & Variables](API_DOCUMENTATION.md#communication-management)

### 📊 Analytics & Reporting
- [Analytics API](API_DOCUMENTATION.md#analytics--reports)
- [Analytics Services](SERVICES_DOCUMENTATION.md#data-storage-service)
- [Analytics Components](COMPONENTS_DOCUMENTATION.md#page-components)

## Architecture Overview

### Technology Stack

**Frontend:**
- React 18 + TypeScript
- Vite + Tailwind CSS
- React Query + React Hook Form
- shadcn/ui Components

**Backend:**
- Node.js + Express + TypeScript
- Drizzle ORM + PostgreSQL
- Passport.js Authentication
- OpenAI Integration

**Infrastructure:**
- PostgreSQL Database (Neon)
- Session-based Authentication
- Rate Limiting & Security
- File Upload Processing

### System Features

#### Core Functionality
- ✅ Multi-company tenant management
- ✅ Role-based access control (Admin, Recruiter, Manager, Candidate)
- ✅ Comprehensive candidate management
- ✅ Customizable recruitment pipeline
- ✅ Interview scheduling & management
- ✅ Technical & DISC assessments
- ✅ AI-powered candidate matching
- ✅ Email & WhatsApp communications
- ✅ Real-time analytics & reporting

#### Advanced Features
- ✅ Resume parsing (PDF/DOCX/TXT)
- ✅ Drag & drop pipeline interface
- ✅ Automated communication templates
- ✅ Ethical status management
- ✅ Audit trail & compliance
- ✅ Rate limiting & security
- ✅ RESTful API with SDK examples
- ✅ Responsive design
- ✅ Real-time updates

## API Quick Reference

### Authentication
```http
POST /api/login          # User login
POST /api/logout         # User logout
GET  /api/user           # Current user info
```

### Core Resources
```http
GET    /api/empresas     # List companies
GET    /api/usuarios     # List users
GET    /api/vagas        # List jobs
GET    /api/candidatos   # List candidates
```

### Pipeline Management
```http
GET    /api/vagas/{id}/pipeline                      # Get pipeline
PATCH  /api/vagas/{id}/candidatos/{id}/mover        # Move candidate
POST   /api/vagas/{id}/etapas                       # Configure stages
```

### Assessments
```http
GET    /api/testes                                  # List tests
POST   /api/avaliacoes/disc/iniciar                # Start DISC
GET    /api/entrevistas                            # List interviews
```

### AI & Matching
```http
GET    /api/vagas/{id}/matches                     # Get matches
GET    /api/vagas/{id}/ai-recommendations          # AI recommendations
```

## Getting Started Checklist

### For New Developers
- [ ] Read [Developer Guide](DEVELOPER_GUIDE.md)
- [ ] Set up development environment
- [ ] Review [API Documentation](API_DOCUMENTATION.md)
- [ ] Explore [Components Documentation](COMPONENTS_DOCUMENTATION.md)
- [ ] Check [Services Documentation](SERVICES_DOCUMENTATION.md)
- [ ] Run tests and understand testing patterns

### For API Integration
- [ ] Review [API Documentation](API_DOCUMENTATION.md)
- [ ] Understand authentication flow
- [ ] Test with provided SDK examples
- [ ] Implement error handling
- [ ] Consider rate limiting

### For System Administration
- [ ] Follow [Installation Guide](INSTALLATION_GUIDE.md)
- [ ] Review [Dependencies Guide](DEPENDENCIES.md)
- [ ] Configure environment variables
- [ ] Set up monitoring and backups
- [ ] Review security settings

## Support & Contributing

### Documentation Updates
- API changes require updates to [API Documentation](API_DOCUMENTATION.md)
- New components need documentation in [Components Documentation](COMPONENTS_DOCUMENTATION.md)
- Service changes should be reflected in [Services Documentation](SERVICES_DOCUMENTATION.md)
- Development workflow changes update [Developer Guide](DEVELOPER_GUIDE.md)

### Issue Reporting
1. Check existing documentation first
2. Provide detailed reproduction steps
3. Include environment information
4. Reference relevant documentation sections

### Documentation Standards
- Use clear, descriptive headings
- Include code examples with explanations
- Provide both basic and advanced usage patterns
- Keep documentation in sync with code changes
- Use consistent formatting and terminology

## Version Information

**Current Version:** v1.2.0

**Last Updated:** July 2024

**Documentation Maintainers:** Development Team

## Additional Resources

### External Documentation
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Node.js Documentation](https://nodejs.org/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)

### Community Resources
- [GitHub Repository](https://github.com/your-org/gentepro)
- [Issue Tracker](https://github.com/your-org/gentepro/issues)
- [Discussion Forum](https://github.com/your-org/gentepro/discussions)

---

*This documentation is actively maintained and updated. For the most current information, always refer to the latest version in the repository.*
