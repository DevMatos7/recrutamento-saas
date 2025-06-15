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

## Changelog

Changelog:
- June 15, 2025. Initial setup