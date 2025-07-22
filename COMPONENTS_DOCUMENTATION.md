# GentePRO Components Documentation

## Overview

This document provides comprehensive documentation for all React components in the GentePRO application, including usage examples, props, and integration patterns.

## Table of Contents

1. [Core Layout Components](#core-layout-components)
2. [Form Components](#form-components)
3. [Data Display Components](#data-display-components)
4. [Modal Components](#modal-components)
5. [UI Components](#ui-components)
6. [Page Components](#page-components)
7. [Hooks and Utilities](#hooks-and-utilities)

## Core Layout Components

### App Component
**Location:** `client/src/App.tsx`

The main application component that sets up routing, authentication, and global providers.

```typescript
import App from './App';

// Usage
<App />
```

**Features:**
- React Query client setup
- Authentication provider
- Tooltip provider
- Toast notifications
- Route management with wouter
- Protected route handling

**Dependencies:**
- `@tanstack/react-query`
- `wouter`
- Custom authentication hooks
- UI components (Toaster, TooltipProvider)

### ProtectedRoute Component
**Location:** `client/src/lib/protected-route.tsx`

Wrapper component that ensures only authenticated users can access protected pages.

```typescript
import { ProtectedRoute } from '@/lib/protected-route';

// Usage
<ProtectedRoute path="/dashboard" component={DashboardComponent} />
```

**Props:**
- `path`: Route path
- `component`: Component to render if authenticated
- Additional route props

## Form Components

### Candidate Detail Modal
**Location:** `client/src/components/candidato-detail-modal.tsx`

Comprehensive modal for displaying candidate information including personal data, professional experience, and DISC results.

```typescript
import { CandidatoDetailModal } from '@/components/candidato-detail-modal';

// Usage
<CandidatoDetailModal
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
  candidatoId="candidate-uuid"
/>
```

**Props:**
```typescript
interface CandidatoDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidatoId: string | null;
}
```

**Features:**
- Personal information display
- Professional experience timeline
- Education and certifications
- Skills and competencies
- DISC assessment results
- Ethical status indicator
- Contact information

**Sections Displayed:**
- 📋 Basic Information (name, email, phone, location)
- 💼 Professional Summary
- 🎓 Education
- 🏢 Work Experience
- 🛠️ Skills and Competencies
- 🌐 Languages
- 🏆 Certifications
- 🧠 DISC Profile Results
- ⚖️ Ethical Status

### Pipeline Stages Configuration
**Location:** `client/src/components/PipelineEtapasConfig.tsx`

Component for configuring custom pipeline stages for job positions.

```typescript
import { PipelineEtapasConfig } from '@/components/PipelineEtapasConfig';

// Usage
<PipelineEtapasConfig
  vagaId="job-uuid"
  onSave={(etapas) => console.log('Stages saved:', etapas)}
/>
```

**Features:**
- Drag and drop stage reordering
- Color picker for stages
- Required fields configuration
- Responsible users assignment
- Real-time preview

**Stage Configuration Options:**
- Stage name
- Display order
- Color theme
- Required fields (nota, comentarios)
- Responsible users list

### Skills Autocomplete
**Location:** `client/src/components/skills-autocomplete.tsx`

Searchable autocomplete component for selecting skills and competencies.

```typescript
import { SkillsAutocomplete } from '@/components/skills-autocomplete';

// Usage
<SkillsAutocomplete
  value={selectedSkills}
  onChange={setSelectedSkills}
  placeholder="Search skills..."
  multiple={true}
/>
```

**Props:**
```typescript
interface SkillsAutocompleteProps {
  value: Skill[] | Skill;
  onChange: (skills: Skill[] | Skill) => void;
  placeholder?: string;
  multiple?: boolean;
  disabled?: boolean;
}
```

**Features:**
- Real-time search with debouncing
- Multiple selection support
- Categorized results
- ESCO/CBO code integration
- Create new skills on-the-fly

### Cargo Autocomplete
**Location:** `client/src/components/cargo-autocomplete.tsx`

Autocomplete component for job position/role selection.

```typescript
import { CargoAutocomplete } from '@/components/cargo-autocomplete';

// Usage
<CargoAutocomplete
  value={selectedCargo}
  onChange={setSelectedCargo}
  placeholder="Search positions..."
/>
```

**Features:**
- Brazilian job market positions
- CBO (Brazilian Classification of Occupations) integration
- Smart suggestions based on skills
- Custom position creation

## Modal Components

### Vaga Modal
**Location:** `client/src/components/modals/vaga-modal.tsx`

Modal for creating and editing job positions.

```typescript
import { VagaModal } from '@/components/modals/vaga-modal';

// Usage
<VagaModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  vaga={editingVaga}
  onSave={handleSaveVaga}
/>
```

**Props:**
```typescript
interface VagaModalProps {
  isOpen: boolean;
  onClose: () => void;
  vaga?: Vaga | null;
  onSave: (vaga: VagaFormData) => void;
}
```

**Form Fields:**
- Basic Information (title, description, location)
- Requirements and qualifications
- Salary range and benefits
- Contract type
- Department and manager assignment
- Skills requirements
- Work mode (remote/hybrid/on-site)

### User Modal
**Location:** `client/src/components/modals/user-modal.tsx`

Modal for user management (create/edit users).

```typescript
import { UserModal } from '@/components/modals/user-modal';

// Usage
<UserModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  user={editingUser}
  onSave={handleSaveUser}
/>
```

**Features:**
- User profile selection (admin, recrutador, gestor, candidato)
- Company and department assignment
- Role-based field visibility
- Password strength validation
- Email uniqueness validation

### Perfil Vaga Modal
**Location:** `client/src/components/modals/perfil-vaga-modal.tsx`

Modal for creating and managing job profile templates.

```typescript
import { PerfilVagaModal } from '@/components/modals/perfil-vaga-modal';

// Usage
<PerfilVagaModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  perfil={editingPerfil}
  onSave={handleSavePerfil}
/>
```

**Features:**
- Template creation for common positions
- Technical and behavioral competencies
- Salary range templates
- Benefits packages
- Internal notes and observations

### Status Ético Modal
**Location:** `client/src/components/status-etico-modal.tsx`

Modal for managing candidate ethical status approval/rejection.

```typescript
import { StatusEticoModal } from '@/components/status-etico-modal';

// Usage
<StatusEticoModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  candidato={selectedCandidate}
  onStatusChange={handleStatusChange}
/>
```

**Status Options:**
- `aprovado`: Approved for recruitment
- `reprovado`: Rejected with reason
- `pendente`: Pending review

**Features:**
- Ethical evaluation form
- Reason for rejection (required if rejected)
- Decision history tracking
- Administrative audit trail

## Data Display Components

### Vaga Auditoria
**Location:** `client/src/components/VagaAuditoria.tsx`

Component for displaying job audit trail and change history.

```typescript
import { VagaAuditoria } from '@/components/VagaAuditoria';

// Usage
<VagaAuditoria vagaId="job-uuid" />
```

**Features:**
- Chronological change history
- User attribution for changes
- Before/after value comparison
- Action categorization (create, edit, delete)
- IP address tracking
- Export to PDF/Excel

**Displayed Information:**
- User who made the change
- Timestamp of change
- Type of action performed
- Fields that were modified
- Previous and new values
- IP address and session info

## UI Components

The application uses a comprehensive set of UI components based on shadcn/ui and Radix UI.

### Core UI Components
**Location:** `client/src/components/ui/`

- **Alert Dialog**: Confirmation dialogs and alerts
- **Button**: Various button styles and states
- **Card**: Content containers with header/body/footer
- **Carousel**: Image/content carousels
- **Chart**: Data visualization components
- **Dialog**: Modal dialogs and popups
- **Form**: Form components with validation
- **Input**: Text inputs with validation states
- **Label**: Form labels with accessibility
- **Navigation Menu**: Main navigation component
- **Popover**: Floating content containers
- **Select**: Dropdown selection components
- **Separator**: Visual content separators
- **Table**: Data tables with sorting/filtering
- **Tabs**: Tabbed content organization
- **Textarea**: Multi-line text inputs
- **Toast**: Notification system
- **Tooltip**: Contextual help tooltips

### Advanced UI Components

#### MultiSelect
**Location:** `client/src/components/ui/multiselect.tsx`

Advanced multi-selection component with search and filtering.

```typescript
import { MultiSelect } from '@/components/ui/multiselect';

// Usage
<MultiSelect
  options={skillOptions}
  value={selectedSkills}
  onChange={setSelectedSkills}
  placeholder="Select skills..."
  searchPlaceholder="Search skills..."
/>
```

**Features:**
- Search functionality
- Checkbox selection
- Select all/none options
- Custom option rendering
- Loading states

#### Chart Components
**Location:** `client/src/components/ui/chart.tsx`

Reusable chart components for analytics.

```typescript
import { BarChart, LineChart, PieChart } from '@/components/ui/chart';

// Usage
<BarChart
  data={analyticsData}
  xAxis="month"
  yAxis="candidates"
  title="Candidates by Month"
/>
```

**Chart Types:**
- Bar charts for categorical data
- Line charts for trends
- Pie charts for distributions
- Area charts for cumulative data

## Page Components

### Analytics Page
**Location:** `client/src/pages/analytics.tsx`

Main dashboard with KPIs and data visualization.

**Features:**
- Real-time statistics
- Interactive charts
- Date range filtering
- Department/company filtering
- Export capabilities

### Vagas Page
**Location:** `client/src/pages/vagas.tsx`

Job management interface with CRUD operations.

**Features:**
- Job listing with filters
- Create/edit job positions
- Stage configuration
- Candidate pipeline view
- Export job data

### Candidatos Page
**Location:** `client/src/pages/candidatos.tsx`

Candidate management with comprehensive filtering.

**Features:**
- Advanced filtering (status, origin, skills)
- Bulk operations
- Import from resume files
- DISC assessment integration
- Ethical status management

### Pipeline Page
**Location:** `client/src/pages/pipeline.tsx`

Kanban-style pipeline management.

**Features:**
- Drag and drop functionality
- Stage customization
- Candidate movement tracking
- Notes and scoring
- Real-time updates

### Testes Page
**Location:** `client/src/pages/testes.tsx`

Test and assessment management.

**Features:**
- Technical test creation
- DISC assessment configuration
- Test assignment to candidates
- Results analysis
- Performance metrics

### Entrevistas Page
**Location:** `client/src/pages/entrevistas.tsx`

Interview scheduling and management.

**Features:**
- Calendar integration
- Automated scheduling
- Interview feedback
- Candidate confirmation
- Video link generation

### AI Recommendations Page
**Location:** `client/src/pages/ai-recommendations.tsx`

AI-powered candidate recommendations (admin only).

**Features:**
- OpenAI integration
- Intelligent matching
- Candidate insights
- Recommendation feedback
- Learning improvements

### Candidate Portal Page
**Location:** `client/src/pages/candidate-portal.tsx`

Public portal for candidates.

**Features:**
- Candidate registration
- Job application
- Test completion
- Application tracking
- Interview scheduling

### DISC Assessment Pages

#### Avaliação DISC Page
**Location:** `client/src/pages/avaliacao-disc.tsx`

DISC assessment management for HR users.

#### Candidate DISC Test
**Location:** `client/src/pages/candidate-disc-test.tsx`

DISC assessment interface for candidates.

#### DISC Editor
**Location:** `client/src/pages/disc-editor.tsx`

DISC question management (admin only).

## Best Practices

### Component Structure
1. **Props Interface**: Always define TypeScript interfaces for props
2. **Default Props**: Use defaultProps or default parameters
3. **Error Boundaries**: Wrap complex components in error boundaries
4. **Loading States**: Always handle loading and error states
5. **Accessibility**: Include ARIA labels and keyboard navigation

### State Management
1. **React Query**: Use for server state management
2. **Local State**: Use useState for component-local state
3. **Form State**: Use react-hook-form for complex forms
4. **Global State**: Use context for truly global state

### Performance
1. **Memoization**: Use React.memo for expensive components
2. **Lazy Loading**: Use React.lazy for code splitting
3. **Virtualization**: Use react-window for large lists
4. **Debouncing**: Debounce search inputs and API calls
