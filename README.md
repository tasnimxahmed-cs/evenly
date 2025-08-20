# Evenly - Split Bills Effortlessly

Evenly is a modern web application that helps users split bills and expenses with friends, roommates, and groups. Built with Next.js, TypeScript, and Tailwind CSS, it provides a seamless experience for managing shared expenses.

## Features

- **Bank Integration**: Connect bank accounts securely with Plaid
- **Smart Groups**: Create groups for roommates, trips, or recurring expenses
- **Flexible Splitting**: Split expenses equally, by percentage, or custom amounts
- **Transaction Management**: Add transactions manually or import from bank accounts
- **Real-time Settlements**: Track who owes what and settle up easily
- **Modern UI**: Beautiful, responsive design with dark mode support

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4.1
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Clerk
- **Bank Integration**: Plaid
- **Deployment**: Vercel (recommended)

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- Clerk account for authentication
- Plaid account for bank integration (optional)

### Installation

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
- Groups and group memberships
- Transactions and splits
- Bank account connections
- Friend relationships

### Design System
- Custom color palette with blue primary colors
- Consistent typography with Inter font
- Responsive design with mobile-first approach
- Dark mode support

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Database Management

- `npx prisma studio` - Open Prisma Studio for database management
- `npx prisma generate` - Generate Prisma client
- `npx prisma db push` - Push schema changes to database
- `npx prisma migrate dev` - Create and apply migrations

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

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, email support@evenly.app or create an issue in this repository.

---

Built with ❤️ for simplifying expense sharing
