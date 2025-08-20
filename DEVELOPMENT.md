# Development Guide

This document contains technical setup and development instructions for the Evenly project.

## Prerequisites

- Node.js 18+ 
- PostgreSQL database
- Clerk account for authentication
- Plaid account for bank integration (optional)

## Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd evenly
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   # Database
   DATABASE_URL="postgresql://username:password@localhost:5432/evenly"

   # Clerk Authentication
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_publishable_key
   CLERK_SECRET_KEY=sk_test_your_clerk_secret_key

   # Plaid (for bank integration)
   PLAID_CLIENT_ID=your_plaid_client_id
   PLAID_SECRET=your_plaid_secret
   PLAID_ENV=sandbox

   # App Configuration
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. **Set up the database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
evenly/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── auth/              # Authentication pages
│   │   ├── dashboard/         # Main dashboard and features
│   │   ├── api/               # API routes
│   │   └── globals.css        # Global styles and design tokens
│   ├── components/            # Reusable UI components
│   │   ├── ui/               # Base UI components
│   │   └── dashboard/        # Dashboard-specific components
│   └── lib/                  # Utility functions and configurations
├── prisma/                   # Database schema and migrations
├── public/                   # Static assets
└── package.json
```

## Key Features Implementation

### Authentication
- Uses Clerk for secure user authentication
- Supports email/password and social login
- Protected routes with middleware

### Database Schema
- Users and authentication integration
- Circles and circle memberships
- Transactions and splits
- Bank account connections
- Friend relationships

### Design System
- Custom color palette with blue primary colors
- Consistent typography with Inter font
- Responsive design with mobile-first approach
- Dark mode support

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Database Management

- `npx prisma studio` - Open Prisma Studio for database management
- `npx prisma generate` - Generate Prisma client
- `npx prisma db push` - Push schema changes to database
- `npx prisma migrate dev` - Create and apply migrations

## Mobile Responsiveness

The app is built with a mobile-first approach using Tailwind CSS breakpoints:

- **Mobile**: `sm:` (640px+)
- **Tablet**: `md:` (768px+)
- **Desktop**: `lg:` (1024px+)
- **Large Desktop**: `xl:` (1280px+)

### Key Mobile Optimizations

- Touch-friendly buttons (minimum 44px height)
- Responsive grids and layouts
- Mobile-optimized navigation
- Proper viewport meta tags
- Optimized spacing and typography

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically on push

### Environment Variables for Production

Make sure to set these in your production environment:
- `DATABASE_URL` - Production PostgreSQL connection string
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk publishable key
- `CLERK_SECRET_KEY` - Clerk secret key
- `PLAID_CLIENT_ID` - Plaid client ID
- `PLAID_SECRET` - Plaid secret
- `PLAID_ENV` - Plaid environment (sandbox/development/production)

## API Routes

The app uses Next.js API routes for backend functionality:

- `/api/dashboard` - Dashboard data
- `/api/circles` - Circle management
- `/api/friends` - Friend system
- `/api/plaid/*` - Bank integration
- `/api/transactions/*` - Transaction management

## Testing

Currently, the project doesn't include automated tests. Consider adding:

- Unit tests with Jest
- Integration tests with Playwright
- API tests with Supertest

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Troubleshooting

### Common Issues

1. **Database connection errors**
   - Check your `DATABASE_URL` environment variable
   - Ensure PostgreSQL is running
   - Run `npx prisma generate` after schema changes

2. **Clerk authentication issues**
   - Verify your Clerk keys are correct
   - Check that redirect URLs are configured properly
   - Ensure middleware is set up correctly

3. **Plaid integration problems**
   - Verify your Plaid credentials
   - Check that you're using the correct environment (sandbox/development)
   - Ensure webhook endpoints are configured

4. **Mobile responsiveness issues**
   - Test on actual devices, not just browser dev tools
   - Check that viewport meta tag is present
   - Verify touch targets meet minimum size requirements

## Performance Optimization

- Use Next.js Image component for optimized images
- Implement proper loading states
- Optimize database queries
- Use React.memo for expensive components
- Implement proper error boundaries

## Security Considerations

- All API routes are protected with authentication
- Input validation using Zod schemas
- SQL injection prevention with Prisma ORM
- XSS protection with proper escaping
- CSRF protection with Clerk
