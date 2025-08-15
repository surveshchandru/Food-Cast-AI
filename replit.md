
# FoodCast AI - Food Demand Forecasting Application

## Overview

FoodCast AI is a comprehensive web application designed to predict food demand trends using machine learning algorithms. The system helps restaurants and food service businesses optimize inventory management through AI-powered forecasting, real-time analytics, and intelligent recommendations. Built with a modern full-stack architecture, it provides users with interactive dashboards, demand predictions, inventory tracking, and performance analytics to make data-driven decisions about food procurement and preparation.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The application uses React with TypeScript as the frontend framework, leveraging Vite for development and build tooling. The UI is built with shadcn/ui components based on Radix UI primitives, styled with Tailwind CSS for responsive design. The architecture follows a component-based approach with:

- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Form Handling**: React Hook Form with Zod validation for type-safe form processing
- **Charts & Visualization**: Recharts library for rendering interactive charts and graphs
- **Styling**: Tailwind CSS with custom design tokens and CSS variables for theming

### Backend Architecture
The server is built with Express.js using TypeScript in ESM module format. The backend follows a RESTful API design pattern with:

- **Request Processing**: Express middleware for JSON parsing, logging, and error handling
- **Data Storage**: In-memory storage implementation with interfaces designed for easy database migration
- **Business Logic**: Forecasting service implementing multiple prediction algorithms (moving average, linear trend, seasonal adjustment)
- **API Structure**: Resource-based endpoints for dashboard metrics, sales data, predictions, inventory, and analytics

### Data Storage Solutions
Currently implements an in-memory storage system with well-defined interfaces (IStorage) that can be easily replaced with persistent database solutions. The schema is designed for PostgreSQL using Drizzle ORM:

- **Users**: Authentication and user management
- **Sales Data**: Historical sales transactions with items, quantities, and revenue
- **Predictions**: AI-generated demand forecasts with confidence levels
- **Inventory**: Current stock levels with minimum/maximum thresholds
- **Model Metrics**: Performance tracking for forecasting algorithms (accuracy, RMSE, F1-score)

### Machine Learning Integration
The forecasting service implements multiple prediction algorithms:

- **Time Series Analysis**: Moving average calculations for trend identification
- **Linear Regression**: Trend-based predictions using least squares method
- **Seasonal Adjustment**: Pattern recognition for cyclical demand variations
- **Confidence Scoring**: Statistical confidence intervals for prediction reliability
- **Model Performance Metrics**: Comprehensive evaluation using accuracy, RMSE, precision, recall, and F1-score

## External Dependencies

### Database & ORM
- **Drizzle ORM**: Type-safe database operations with PostgreSQL dialect
- **@neondatabase/serverless**: Serverless PostgreSQL connection for production deployment

### UI Components & Styling
- **Radix UI**: Comprehensive set of accessible, unstyled UI components
- **Tailwind CSS**: Utility-first CSS framework for responsive design
- **Recharts**: Declarative charting library built on D3.js for data visualization

### Development & Build Tools
- **Vite**: Fast build tool and development server with React plugin
- **TypeScript**: Static type checking for both frontend and backend
- **ESBuild**: Fast JavaScript bundler for production builds

### Form & Data Validation
- **React Hook Form**: Performant forms library with minimal re-renders
- **Zod**: TypeScript-first schema validation for runtime type safety
- **@hookform/resolvers**: Integration between React Hook Form and validation libraries

### State Management & API
- **TanStack Query**: Server state management with caching, background updates, and optimistic updates
- **Wouter**: Minimalist routing library for React applications

### Session Management
- **connect-pg-simple**: PostgreSQL session store for Express sessions (prepared for authentication implementation)
