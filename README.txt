# TaskFlow - Project Management System

TaskFlow is a high-performance project management application built with React, Express, and Firebase. It provides a comprehensive suite of tools for teams to collaborate on projects, track tasks, and monitor progress in real-time.

## Features

- **Authentication**: Secure Google login via Firebase Authentication.
- **Dashboard**: Real-time overview of project stats, task productivity charts, and task distribution.
- **Projects**: Create and manage collaborative workspaces.
- **Tasks**: Robust task tracking system with priorities, due dates, project-based organization, and status management (To Do, In Progress, Review, Completed).
- **RBAC**: Role-base access control (Admin/Member) ensures secure data access.
- **Real-time Sync**: Instant updates across all devices using Firestore.

## Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, shadcn/ui, Framer Motion, Recharts, Lucide React.
- **Backend**: Node.js, Express (serving as the API layer and SPA host).
- **Database**: Google Cloud Firestore.
- **Authentication**: Firebase Auth (Google Provider).

## Deployment

This application is deployed and hosted on Google Cloud Run via AI Studio.

## Architecture

The app follows a modern full-stack architecture:
- **Client-side Logic**: The frontend handles real-time data synchronization directly with Firestore for low latency and high responsiveness.
- **Server-side Utilities**: Express provides additional REST endpoints for system-level queries and health monitoring.
- **Security**: Hardened Firestore Security Rules prevent unauthorized data access, implementing fine-grained RBAC.

## Instructions

1. Log in using your Google account.
2. Create a new project from the Dashboard or Projects page.
3. Add tasks to your project and assign priorities.
4. Track progress on the Dashboard as your team updates task statuses.
