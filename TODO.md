# Project Timer Feature - Implementation Plan

## Overview
Add a timer feature to the PulseIQ project UI to track accurate time spent on projects with Start, Pause, Save, and Stop functionality in 00:00:00 format.

## Tasks

### Phase 1: Frontend - Timer Component
- [x] 1.1 Create ProjectTimer.tsx component with start, pause, save, stop functionality
- [x] 1.2 Display timer in HH:MM:SS format
- [x] 1.3 Add visual feedback for timer states (running, paused, stopped)

### Phase 2: Integration
- [x] 2.1 Add timer state to Project type (types/index.ts)
- [x] 2.2 Integrate ProjectTimer into ProjectDetail.tsx
- [x] 2.3 Pass necessary props and handlers

### Phase 3: Backend (Optional - for persistence)
- [x] 3.1 Add time tracking fields to Project model/database (via handleUpdateProject)
- [x] 3.2 Create API endpoint to save timer sessions (reuses existing project update API)

### Phase 4: Testing
- [ ] 4.1 Test timer functionality (start, pause, save, stop)
- [ ] 4.2 Verify time format displays correctly
- [ ] 4.3 Test integration with project details

## Dependencies
- React hooks (useState, useEffect, useRef, useCallback)
- Existing project infrastructure

## Notes
- Timer should persist in local state while running
- Save should add accumulated time to project's totalHours
- Timer can run across different project views (header level)

