# Evenly 💰

**Split bills effortlessly with friends. Connect your bank accounts, create groups, and let Evenly handle the math.**

[![Next.js](https://img.shields.io/badge/Next.js-15.4.7-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.14.0-2D3748?style=flat-square&logo=prisma)](https://www.prisma.io/)
[![Clerk](https://img.shields.io/badge/Clerk-Auth-6B46C1?style=flat-square)](https://clerk.com/)
[![Plaid](https://img.shields.io/badge/Plaid-Financial-00D6A3?style=flat-square)](https://plaid.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)

## 🚀 Live Demo

**[View Live Demo](https://evenly-taupe.vercel.app/)**

## 📱 Screenshots

### Dashboard Overview
![Dashboard](<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/037741d7-a72c-41f5-a7e4-65c9a509e811" />)
*Clean, mobile-first dashboard with financial overview and quick actions*

### Circle Management
![Circles](<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/843d4224-aa18-4cfd-b0d4-69ea17e61381" />)
*Create and manage expense groups with friends and roommates*

### Transaction Tracking
![Transactions](<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/b06c605c-3acf-4cc7-80f2-4e29275ad2d2" />)
*Track shared expenses with automatic splitting and payment status*

### Bank Integration
![Bank Integration](<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/7bb77faa-5903-49e1-9c02-367b4800afe2" />)
*Securely connect bank accounts and import transactions via Plaid*

## ✨ Features

### 🏦 **Bank Integration**
- **Plaid Integration**: Secure bank account connection
- **Transaction Import**: Automatically import and categorize transactions
- **Real-time Sync**: Keep expenses up-to-date with your bank

### 👥 **Smart Group Management**
- **Circle Creation**: Create expense groups for roommates, trips, events
- **Member Invites**: Invite friends via email or shareable links
- **Role Management**: Admin controls for group settings

### 💳 **Intelligent Expense Tracking**
- **Multiple Split Types**: Equal, percentage, or custom amount splits
- **Payment Status**: Track who's paid and who owes what
- **Transaction History**: Complete audit trail of all expenses

### 📊 **Financial Insights**
- **Balance Overview**: See what you owe and what you're owed
- **Settlement Tracking**: Monitor payment status across all groups
- **Mobile-First Design**: Optimized for on-the-go expense management

### 🔐 **Security & Authentication**
- **Clerk Authentication**: Secure user management with OAuth support
- **Data Privacy**: Your financial data stays private and secure
- **Role-based Access**: Control who can see and edit expenses

## 🛠️ Tech Stack

### **Frontend**
- **Next.js 15**: App Router, Server Components, TypeScript
- **Tailwind CSS**: Utility-first styling with custom components
- **React Hooks**: Modern state management and side effects
- **Lucide Icons**: Beautiful, consistent iconography

### **Backend & Database**
- **Prisma ORM**: Type-safe database queries and migrations
- **PostgreSQL**: Reliable, scalable database (via Vercel Postgres)
- **Next.js API Routes**: Serverless API endpoints

### **Authentication & Security**
- **Clerk**: Complete authentication solution with OAuth
- **JWT Tokens**: Secure session management
- **CORS Protection**: Cross-origin request security

### **Financial Integration**
- **Plaid API**: Bank account connection and transaction sync
- **Webhook Handling**: Real-time data updates
- **Error Handling**: Robust error management for financial operations

### **Deployment & Infrastructure**
- **Vercel**: Serverless deployment and hosting
- **Environment Variables**: Secure configuration management
- **Database Migrations**: Automated schema updates

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- PostgreSQL database
- Clerk account (for authentication)
- Plaid account (for bank integration)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/evenly.git
   cd evenly
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Configure your `.env.local`:
   ```env
   # Database
   DATABASE_URL="postgresql://..."
   
   # Clerk Authentication
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
   CLERK_SECRET_KEY=sk_...
   
   # Plaid Integration
   PLAID_CLIENT_ID=...
   PLAID_SECRET=...
   PLAID_ENV=sandbox
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

## 📁 Project Structure

```
evenly/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API routes
│   │   ├── auth/              # Authentication pages
│   │   ├── dashboard/         # Main app pages
│   │   └── layout.tsx         # Root layout
│   ├── components/            # Reusable UI components
│   │   ├── ui/               # Base UI components
│   │   └── dashboard/        # Dashboard-specific components
│   └── lib/                  # Utility functions and configs
├── prisma/                   # Database schema and migrations
├── public/                   # Static assets
└── package.json
```

## 🔧 Key Implementation Details

### **Database Schema**
- **Users**: Profile management with Clerk integration
- **Circles**: Expense groups with member relationships
- **Transactions**: Expense records with split configurations
- **TransactionSplits**: Individual payment obligations
- **BankAccounts**: Connected financial institutions

### **API Architecture**
- **RESTful Design**: Clean, predictable API endpoints
- **Type Safety**: Full TypeScript coverage with Zod validation
- **Error Handling**: Comprehensive error responses
- **Authentication**: Protected routes with Clerk middleware

### **Mobile-First Design**
- **Responsive Layout**: Optimized for all screen sizes
- **Touch Interactions**: Mobile-friendly navigation and controls
- **Performance**: Fast loading with Next.js optimizations

## 🧪 Testing

```bash
# Run type checking
npm run type-check

# Run linting
npm run lint

# Run build
npm run build
```

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Manual Deployment
```bash
npm run build
npm start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Clerk** for seamless authentication
- **Plaid** for secure financial data access
- **Vercel** for reliable hosting and deployment
- **Next.js Team** for the amazing framework
- **Tailwind CSS** for the utility-first styling approach

## 📞 Contact

**Tasnim Ahmed** - [LinkedIn](https://linkedin.com/in/tasnimxahmed) - [GitHub](https://github.com/tasnimxahmed)

Project Link: [https://github.com/tasnimxahmed/evenly](https://github.com/tasnimxahmed/evenly)

---
