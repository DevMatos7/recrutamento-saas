# GentePRO - HR Management System

## Overview

GentePRO is a full-stack Human Resources management system built with React, Express, and PostgreSQL. The application provides comprehensive recruitment management capabilities including job postings, candidate tracking, employee management, and recruitment pipeline management.

## System Architecture

### Frontend Stack
- **React 18** with TypeScript for the user interface
- **Wouter** for client-side routing
- **TanStack Query** for state management and API caching
- **Tailwind CSS** with shadcn/ui components for styling
- **React Hook Form** with Zod validation for form handling
- **Vite** as the build tool and development server

### Backend Stack
- **Express.js** with TypeScript for the REST API
- **Passport.js** with local strategy for authentication
- **Express Session** with PostgreSQL session store for session management
- **Drizzle ORM** for database operations
- **Neon Database** for PostgreSQL hosting
- **bcrypt** for password hashing

### Database
- **PostgreSQL** with Drizzle ORM for type-safe database operations
- Database schema includes companies, departments, users, jobs, candidates, and pipeline tracking

## Key Components

### Authentication System
- Session-based authentication using Passport.js
- Role-based access control (admin, recruiter, manager, candidate)
- Password hashing with bcrypt
- Protected routes on both frontend and backend

### Database Schema
- **Companies (empresas)**: Organization management
- **Departments (departamentos)**: Department structure within companies
- **Users (usuarios)**: System users with role-based permissions
- **Jobs (vagas)**: Job postings with detailed requirements
- **Candidates (candidatos)**: Candidate profiles and information
- **Pipeline (vagaCandidatos)**: Recruitment pipeline tracking
- **Tests (testes)**: DISC behavioral and technical assessment tests
- **Test Results (testesResultados)**: Candidate test responses and evaluations
- **Interviews (entrevistas)**: Interview scheduling and management system
- **Communications (comunicacoes)**: WhatsApp and Email automated messaging system

### Frontend Architecture
- Component-based architecture with reusable UI components
- Centralized state management with TanStack Query
- Protected route system with authentication checks
- Responsive design with mobile-first approach
- Toast notifications for user feedback

### Backend Architecture
- RESTful API design with Express.js
- Modular route organization
- Database abstraction layer with storage service
- Middleware for authentication and authorization
- Error handling and logging

## Data Flow

1. **User Authentication**: Users log in through the frontend, which sends credentials to the backend API
2. **Session Management**: Backend creates secure sessions stored in PostgreSQL
3. **API Requests**: Frontend makes authenticated requests using TanStack Query
4. **Database Operations**: Backend uses Drizzle ORM to interact with PostgreSQL
5. **Real-time Updates**: Query invalidation ensures UI stays synchronized with database changes

## External Dependencies

### Production Dependencies
- **@neondatabase/serverless**: Neon PostgreSQL driver
- **@radix-ui/**: Component primitives for UI
- **@tanstack/react-query**: Data fetching and caching
- **drizzle-orm**: Type-safe ORM
- **passport**: Authentication middleware
- **express-session**: Session management
- **connect-pg-simple**: PostgreSQL session store

### Development Tools
- **Vite**: Build tool and dev server
- **TypeScript**: Type safety
- **Tailwind CSS**: Utility-first CSS framework
- **ESBuild**: JavaScript bundler for production

## Deployment Strategy

### Development Environment
- Vite dev server with HMR (Hot Module Replacement)
- PostgreSQL database connection via environment variables
- Session storage in PostgreSQL for development consistency

### Production Build
- Frontend built with Vite to static assets
- Backend bundled with ESBuild for Node.js deployment
- Static file serving through Express
- PostgreSQL connection pooling for production scalability

### Environment Configuration
- Database URL configured via `DATABASE_URL` environment variable
- Session secrets configured for security
- Replit deployment configuration with autoscale target

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

- **June 17, 2025**: Implemented DISC and Technical Tests Module
  - Added comprehensive test management system with DISC behavioral assessments and technical evaluations
  - Created test creation interface with question builder and answer validation
  - Implemented automatic DISC profile calculation (Dominante, Influente, Estável, Consciente)
  - Added technical test scoring with correct answer validation
  - Integrated test assignment functionality with role-based permissions
  - Enhanced database schema with tests and test results tables
  - Added sample DISC and technical tests for JavaScript and Python
  - Created dedicated tests management page with admin/recruiter access controls

- **June 17, 2025**: Implemented Interview Management Module
  - Added comprehensive interview scheduling and management system
  - Created interview agenda with filtering by job, candidate, interviewer, and status
  - Implemented role-based permissions (recruiters schedule, managers/admins can conduct)
  - Added interview status tracking (scheduled, completed, cancelled, no-show)
  - Enhanced database schema with interviews table and business rule validations
  - Created interview scheduling interface with date/time validation
  - Added interview calendar view with status updates and observations
  - Integrated interview management with candidate pipeline workflow

- **June 17, 2025**: Implemented WhatsApp and Email Communications Module
  - Added automated messaging system for candidate communication via WhatsApp and Email
  - Created communication service with template variable processing and SMTP integration
  - Implemented comprehensive communication tracking with status management (pending, sent, error)
  - Added predefined message templates for inscriptions, pipeline updates, interviews, and tests
  - Enhanced database schema with communications table and delivery tracking
  - Created communications management interface with filtering and template selection
  - Integrated nodemailer for email delivery and simulated WhatsApp API integration
  - Added role-based permissions for communication management and sending

- **June 17, 2025**: Implemented Analytics and Reporting Module
  - Added comprehensive analytics service with real-time recruitment metrics and KPIs
  - Created dashboard with general overview including vacancy stats, candidate pipeline, and conversion rates
  - Implemented per-job analysis with detailed pipeline tracking and candidate performance metrics
  - Added department-level analytics with vacancy distribution and team performance indicators
  - Created test results analytics with score distributions and top candidate rankings
  - Implemented candidate source tracking with conversion rate analysis by origin
  - Added time-per-stage analytics for process optimization insights
  - Enhanced backend with dedicated analytics service and role-based API endpoints
  - Created comprehensive frontend interface with tabbed navigation and data visualization

- **June 17, 2025**: Implemented Candidate Portal Module
  - Added public-facing candidate registration and authentication system with secure password hashing
  - Created comprehensive job browsing interface with filtering and detailed job descriptions
  - Implemented candidate application system with duplicate prevention and status tracking
  - Added candidate dashboard with personalized overview of applications, tests, and interviews
  - Created test-taking interface for DISC and technical assessments with response submission
  - Implemented interview schedule viewing and status tracking for candidates
  - Added notification center for candidates to receive and view messages from recruiters
  - Enhanced database schema with candidate password field for portal authentication
  - Created responsive mobile-friendly interface optimized for candidate experience

## Key Features

### DISC and Technical Tests Module
- **Test Creation**: Admin users can create DISC behavioral tests and technical assessments
- **Question Builder**: Interactive interface for creating questions with multiple choice answers
- **Automatic Scoring**: DISC profile calculation and technical test percentage scoring  
- **Role-Based Access**: Admins create tests, recruiters assign them, all authorized users view results
- **Test Assignment**: Integration with candidate pipeline for seamless test distribution
- **Result Analysis**: Comprehensive test result tracking and candidate evaluation

### Interview Management Module
- **Interview Scheduling**: Comprehensive scheduling system with conflict prevention
- **Status Tracking**: Real-time status updates (scheduled, completed, cancelled, no-show)
- **Role-Based Access**: Recruiters schedule interviews, managers and admins can conduct them
- **Calendar Integration**: Visual agenda with filtering by job, candidate, interviewer, and status
- **Business Rules**: Prevents duplicate active interviews and validates future scheduling
- **Observations**: Post-interview notes and feedback tracking system

### WhatsApp and Email Communications Module
- **Automated Messaging**: Send WhatsApp and Email communications based on recruitment events
- **Template System**: Predefined message templates with variable substitution ({{nome}}, {{vaga}}, etc.)
- **Multi-Channel Support**: Email via SMTP and WhatsApp via API integration (simulated in development)
- **Communication Tracking**: Complete history with status tracking (pending, sent, error)
- **Scheduled Messaging**: Support for immediate and scheduled message delivery
- **Role-Based Access**: Admins and recruiters can send, managers can view communications
- **Message Templates**: Pre-built templates for inscriptions, pipeline updates, interviews, and tests
- **Delivery Management**: Automatic retry for failed messages and comprehensive error tracking

### Analytics and Reporting Module
- **Dashboard Overview**: Real-time KPIs including vacancy counts, candidate pipeline status, and conversion rates
- **Job-Specific Analytics**: Detailed analysis per job with candidate distribution, interview tracking, and test results
- **Department Performance**: Consolidated metrics by department with vacancy status and team performance indicators
- **Test Analytics**: Score distributions, top performer rankings, and assessment effectiveness metrics
- **Source Tracking**: Candidate origin analysis with conversion rates by recruitment channel
- **Process Optimization**: Time-per-stage analytics for identifying bottlenecks and improving efficiency
- **Role-Based Access**: Comprehensive view for admins/recruiters, department-specific access for managers

### Candidate Portal Module
- **Public Job Browsing**: View open positions without authentication, with detailed job descriptions
- **Candidate Registration**: Secure account creation with email verification and password protection
- **Application Management**: Apply to jobs with duplicate prevention and real-time status tracking
- **Personal Dashboard**: Overview of applications, pending tests, scheduled interviews, and notifications
- **Test Interface**: Complete DISC behavioral and technical assessments directly through the portal
- **Interview Tracking**: View scheduled interviews with date, time, location, and status updates
- **Message Center**: Receive and view communications from recruiters and HR team
- **Mobile Responsive**: Optimized interface for smartphone and tablet access
- **Secure Authentication**: Session-based login system with password hashing and session management

### Selection Pipeline Module
- **Kanban Interface**: Visual candidate management through 6 pipeline stages
- **Stage Management**: Recebidos, Triagem, Entrevista, Avaliação, Aprovado, Reprovado
- **Movement Validation**: Permission-based candidate progression with audit trails
- **Duplicate Prevention**: System prevents duplicate candidate enrollment in same job
- **Comments and Scoring**: Detailed feedback and evaluation tracking for each movement

## Changelog

- June 15, 2025: Initial setup
- June 17, 2025: DISC and Technical Tests Module implementation
- June 17, 2025: Interview Management Module implementation
- June 17, 2025: WhatsApp and Email Communications Module implementation