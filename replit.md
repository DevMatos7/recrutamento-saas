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

- **June 17, 2025**: Implemented Candidate Assessment Module (Avaliações)
  - Added comprehensive assessment management system with DISC behavioral assessments and technical evaluations
  - Created assessment creation interface with question builder and answer validation
  - Implemented automatic DISC profile calculation (Dominante, Influente, Estável, Consciente)
  - Added technical assessment scoring with correct answer validation
  - Integrated assessment assignment functionality with role-based permissions
  - Enhanced database schema with assessments and assessment results tables
  - Added sample DISC and technical assessments for JavaScript and Python
  - Created dedicated assessments management page with admin/recruiter access controls

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

- **June 18, 2025**: Enhanced Candidate Portal with Comprehensive Curriculum Registration
  - Implemented multi-step curriculum registration form with 5 detailed sections
  - Added extensive candidate profile fields including personal information, professional experience, education, skills, languages, and certifications
  - Enhanced database schema with comprehensive curriculum fields (CPF, address, professional summary, work experience array, education history, skills, languages, certifications)
  - Created dynamic form components for adding/removing multiple experiences, education records, languages, and certifications
  - Fixed critical bug where candidates appeared automatically enrolled in jobs without applying
  - Corrected candidate portal profile endpoint to return actual applications instead of dashboard statistics
  - Updated backend service to handle extended candidate data with all curriculum fields
  - Applied database migrations for new candidate profile structure

- **June 20, 2025**: Fixed User Registration Department Loading Issue
  - Resolved problem where departments weren't loading in user registration form
  - Implemented cascading selection (company → department) with proper validation
  - Added dynamic placeholders and visual feedback for better user experience
  - Fixed SelectItem component error with empty values
  - Enhanced form UX with department field disabling until company selection

- **June 23, 2025**: Reorganized Navigation Structure
  - Moved empresas, usuários, departamentos and dashboard to "Configurações" menu
  - Set Analytics as the main landing page after login (route "/")
  - Created collapsible sidebar submenu for configuration options
  - Implemented separate routes for each configuration section
  - Maintained role-based access control for all configuration sections
  - Updated sidebar navigation with collapsible Configurações submenu
  - Moved comunicações to Configurações submenu
  - Added Credenciais page for SMTP and WhatsApp API configuration
  - Created secure credential management interface for administrators

- **June 23, 2025**: Fixed Duplicate Sidebar Issue System-Wide
  - Resolved duplicate sidebar appearing on all application pages
  - Centralized sidebar management through ProtectedRoute component
  - Removed redundant Sidebar components from individual pages
  - Fixed JSX syntax errors and component structure issues
  - Corrected indentation and layout structure across all pages
  - Ensured single sidebar consistency throughout the application

- **June 23, 2025**: Module Rebranding - Testes DISC to Avaliações
  - Renamed "Testes DISC" module to "Avaliações" throughout the system
  - Updated sidebar navigation, page titles, and user interface text
  - Maintained all functionality while improving terminology clarity
  - Updated documentation to reflect new naming convention

- **June 23, 2025**: Implemented Mandatory DISC Assessment System
  - Created comprehensive DISC assessment system with 24 question blocks
  - Added database tables: avaliacoes, questoes_disc, respostas_disc
  - Implemented AvaliacaoService with full DISC logic and scoring calculation
  - Created dedicated DISC assessment page for candidates (/avaliacao-disc)
  - Added API endpoints for DISC model, initiation, response saving, and finalization
  - Integrated automatic DISC profile calculation (D, I, S, C factors)
  - Added assessment progress tracking and result visualization
  - Seeded database with complete DISC question set (24 blocks x 4 phrases each)
  - Made DISC assessment mandatory and accessible only to candidates
  - Added assessment history tracking with results and completion dates

- **June 23, 2025**: Enhanced DISC System with Portal Integration and Admin Management
  - Added prominent DISC test alerts in candidate portal dashboard
  - Created comprehensive DISC results viewing in candidates admin section
  - Implemented email/WhatsApp invitation system for sending test links
  - Added visual status indicators showing test completion status
  - Enhanced candidate detail view with dedicated DISC results tab
  - Created API endpoints for bulk DISC results and invitation management

- **June 23, 2025**: Implemented Intelligent Candidate-Job Matching System
  - Enhanced database schema with matching fields for vagas and candidatos tables
  - Created comprehensive MatchingService with weighted scoring algorithm
  - Implemented multi-criteria matching: competências (40%), experiência (20%), formação (10%), localização (10%), salário (10%), DISC (10%)
  - Added automatic candidate compatibility scoring with configurable minimum thresholds
  - Created dedicated matching interface (/vagas/:id/matches) with advanced filtering
  - Implemented match statistics and analytics dashboard with score distribution
  - Added detailed candidate profile views with compatibility breakdowns
  - Integrated matching system with existing job management interface
  - Added real-time match calculation with audit logging for compliance

- **June 23, 2025**: Fixed Portal JSX Syntax and Completed System Integration
  - Resolved duplicate component definition errors in candidate portal
  - Fixed JSX syntax issues preventing application startup
  - Completed integration between DISC assessment and matching systems
  - Validated API endpoints for both DISC tests and candidate matching
  - Ensured both systems work together seamlessly for recruitment workflow

- **June 25, 2025**: Fixed Critical DISC Test Block Title and Alternative Alignment Issue
  - Resolved critical misalignment between DISC block titles and their corresponding alternatives
  - Updated database with 96 corrected DISC question entries across all 24 blocks (A-X)
  - Modified AvaliacaoService to provide accurate title mappings matching question content
  - Fixed titles like "Tende a agir de forma..." now correctly display with "Assertiva, Persuasiva, Paciente, Contemplativa"
  - Corrected all alternative options to match exact specifications with proper order and wording
  - Verified complete DISC test flow working properly with coherent question-to-alternative correspondence
  - Ensured all 24 test blocks now have proper contextual alignment for improved candidate experience
  - Final validation confirmed all blocks display authentic DISC alternatives as specified

- **June 26, 2025**: Implemented Contextual AI-powered Candidate Recommendation Engine
  - Created comprehensive AI recommendation service with OpenAI integration for intelligent candidate analysis
  - Implemented compatibility scoring algorithm considering technical fit, cultural fit, and experience fit
  - Added detailed reasoning generation with strengths, concerns, and actionable recommendations
  - Created robust fallback system using rule-based analysis when AI API is unavailable
  - Developed complete frontend interface for AI recommendations with job selection and candidate insights
  - Integrated candidate insights modal with detailed compatibility breakdowns and interview recommendations
  - Added AI recommendations to sidebar navigation with proper authentication and role-based access
  - Successfully tested system with both AI-powered and fallback analysis modes ensuring continuous functionality

- **June 26, 2025**: Reorganized Navigation Menu Structure for Better UX
  - Moved "Editor DISC" from main menu to submenu under "Avaliações"
  - Created collapsible "Avaliações" menu with "Gerenciar Avaliações" and "Editor DISC" submenus
  - Changed button text from "Criar Avaliação DISC" to "Criar Avaliação" for better genericity
  - Created collapsible "Vagas" menu with "Gerenciar Vagas", "Recomendações IA" and "Candidaturas Pendentes" submenus
  - Improved navigation organization with logical grouping of job-related and assessment-related features
  - Maintained role-based access controls for all menu items and submenus
  - Enhanced user experience with cleaner, more organized menu structure

## Key Features

### Candidate Assessment Module (Avaliações)
- **Assessment Creation**: Admin users can create DISC behavioral assessments and technical evaluations
- **Question Builder**: Interactive interface for creating questions with multiple choice answers
- **Automatic Scoring**: DISC profile calculation and technical assessment percentage scoring  
- **Role-Based Access**: Admins create assessments, recruiters assign them, all authorized users view results
- **Assessment Assignment**: Integration with candidate pipeline for seamless assessment distribution
- **Result Analysis**: Comprehensive assessment result tracking and candidate evaluation

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