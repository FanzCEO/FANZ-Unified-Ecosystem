# FanzWorld

A modern social media platform with a cyberpunk aesthetic built with React, TypeScript, and Express.

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run check` - Run TypeScript type checking
- `npm run db:push` - Push database schema changes

### Git Repository Maintenance

- `npm run git:cleanup` - Complete Git repository cleanup (recommended)
- `npm run git:gc` - Garbage collection and pruning (`git gc --prune=now`)
- `npm run git:reflog-expire` - Expire reflog entries (`git reflog expire --expire=now --all`)

The Git maintenance scripts help optimize repository performance by removing unreferenced objects and expired reflog entries.

## Tech Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS
- **Backend**: Express.js, TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **UI Components**: Radix UI with shadcn/ui
- **State Management**: TanStack Query

For detailed architecture information, see [replit.md](./replit.md).
# Fanz World

A modern full-stack social media application built with a cyberpunk aesthetic. The application allows users to create posts, interact with content through likes and comments, follow other users, and discover trending content. It features a futuristic UI design with neon colors and cyber-themed styling.

## 🚀 Quick Start

### Prerequisites

- Node.js 20 or higher
- PostgreSQL database
- npm or yarn package manager

### Clone and Setup

```bash
# Clone the repository
git clone https://github.com/FanzCEO/FanzWorld.git
cd FanzWorld

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration (see below)

# Set up the database
npm run setup

# Start the development server
npm run dev
```

The application will be available at `http://localhost:5000`

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/fanzworld

# Session Configuration
SESSION_SECRET=your-secure-session-secret-key-here

# Optional: Development Configuration
NODE_ENV=development
PORT=5000
```

### Database Setup

1. **Create PostgreSQL Database:**
   ```bash
   createdb fanzworld
   ```

2. **Configure Environment Variables:**
   Copy `.env.example` to `.env` and update the `DATABASE_URL`:
   ```env
   DATABASE_URL=postgresql://username:password@localhost:5432/fanzworld
   SESSION_SECRET=your-secure-session-secret-key-here
   ```

3. **Initialize Database Schema:**
   ```bash
   npm run setup
   ```
   
   Or manually:
   ```bash
   npm run db:push
   ```

### Development

Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:5000`

### Production Build

Build the application for production:

```bash
npm run build
```

Start the production server:

```bash
npm start
```

## 🏗️ Architecture

### Frontend
- **Framework:** React with TypeScript using Vite
- **Styling:** Tailwind CSS with cyberpunk theme
- **UI Components:** shadcn/ui built on Radix UI primitives
- **State Management:** TanStack Query (React Query)
- **Routing:** Wouter for lightweight client-side routing
- **Form Handling:** React Hook Form with Zod validation

### Backend
- **Server:** Express.js with TypeScript
- **Database:** PostgreSQL with Drizzle ORM
- **Authentication:** Express sessions with PostgreSQL store
- **File Upload:** Google Cloud Storage integration
- **API:** RESTful endpoints for all features

### Database Schema
- Users, posts, comments, likes, and follows
- Session storage in PostgreSQL
- Type-safe schema definitions with Drizzle ORM

## 📁 Project Structure

```
├── client/                 # React frontend application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utility functions and configurations
│   │   └── pages/          # Application pages/routes
├── server/                 # Express.js backend
│   ├── auth.ts            # Authentication middleware
│   ├── db.ts              # Database configuration
│   ├── index.ts           # Server entry point
│   ├── routes.ts          # API route definitions
│   ├── storage.ts         # Data access layer
│   └── vite.ts            # Vite development integration
├── shared/                 # Shared types and schemas
│   └── schema.ts          # Zod schemas and TypeScript types
├── attached_assets/        # Static assets
├── migrations/            # Database migration files
└── dist/                  # Built application files
```

## 🛠️ Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run check` - Type check with TypeScript
- `npm run db:push` - Push database schema changes
- `npm run setup` - Initialize database and check environment setup

## 🌟 Features

- **User Authentication:** Secure signup/signin with sessions
- **Social Features:** Posts, comments, likes, follows, bookmarks
- **Real-time Updates:** Live feed with new content
- **File Upload:** Support for images and media
- **Responsive Design:** Mobile-first cyberpunk UI
- **User Profiles:** Customizable user profiles with activity tracking
- **Search & Discovery:** Find users and trending content

## 🔧 Development

### Hot Reload
The development server includes hot module replacement for both frontend and backend changes.

### Database Changes
When modifying the database schema in `shared/schema.ts`, run:
```bash
npm run db:push
```

### Type Safety
The application uses TypeScript throughout with shared types between frontend and backend for type safety.

## 🚀 Deployment

### Replit (Recommended)
This application is optimized for Replit deployment:

1. Import the repository to Replit
2. Configure environment variables in Replit Secrets
3. The application will automatically deploy

### Manual Deployment
1. Set up PostgreSQL database
2. Configure environment variables
3. Build the application: `npm run build`
4. Start the server: `npm start`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the package.json file for details.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/FanzCEO/FanzWorld/issues) page
2. Create a new issue with detailed information
3. Include error messages and steps to reproduce

### Common Issues

**Database Connection Error:**
- Ensure PostgreSQL is running: `brew services start postgresql` (macOS) or `sudo service postgresql start` (Linux)
- Check your DATABASE_URL in .env file
- Create the database: `createdb fanzworld`

**Port Already in Use:**
- Change the PORT in your .env file to a different value
- Kill the process using port 5000: `lsof -ti:5000 | xargs kill`

**Environment Variables:**
- Copy .env.example to .env: `cp .env.example .env`
- Update DATABASE_URL with your PostgreSQL connection string
- Generate a strong SESSION_SECRET: `openssl rand -base64 32`

## 🔗 Related Documentation

- [System Architecture](./replit.md) - Detailed technical architecture
- [Replit Configuration](./.replit) - Replit-specific deployment settings
