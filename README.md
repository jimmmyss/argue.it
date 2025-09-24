# argue.it

A focused forum for controversial posts with yes/no voting. Built with React, Node.js, Express, and Firebase.

## 🚀 Features

- **User Authentication**: Email/password authentication with Firebase Auth
- **Post Creation**: Create controversial posts with categories and tags
- **Yes/No Voting**: Simple binary voting system with real-time updates
- **Smart Filtering**: Filter posts by Date, Attraction (most votes), or Controversy (closest to 50/50 split)
- **Categories**: Organized discussions across Politics, Relationships, Tech, Ethics, Entertainment, Lifestyle, and Society
- **Admin Panel**: Comprehensive admin tools for user and content management
- **Real-time Updates**: Live vote counts and post updates using Firestore listeners
- **Mobile-First Design**: Responsive design optimized for all devices
- **Rate Limiting**: Built-in protection against spam and abuse

## 🛠 Tech Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **React Router** for navigation
- **React Query** for data fetching and caching
- **React Hook Form** for form handling
- **Firebase SDK** for authentication and real-time data
- **Lucide React** for icons

### Backend
- **Node.js** with Express
- **Firebase Admin SDK** for server-side operations
- **Joi** for validation
- **Helmet** for security
- **Morgan** for logging
- **Rate limiting** and **CORS** protection

### Database & Auth
- **Firebase Authentication** for user management
- **Cloud Firestore** for data storage
- **Firestore Security Rules** for data protection

## 📋 Prerequisites

- Node.js 16+ and npm
- Firebase project with Authentication and Firestore enabled
- Firebase service account key

## 🚀 Quick Start

### 1. Clone the Repository

\`\`\`bash
git clone <repository-url>
cd argueit
\`\`\`

### 2. Install Dependencies

\`\`\`bash
# Install root dependencies (for concurrent development)
npm install

# Install all dependencies (root, server, and client)
npm run install:all
\`\`\`

### 3. Firebase Setup

1. Create a new Firebase project at [Firebase Console](https://console.firebase.google.com)
2. Enable Authentication with Email/Password provider
3. Create a Firestore database
4. Generate a service account key:
   - Go to Project Settings > Service Accounts
   - Click "Generate new private key"
   - Save the JSON file securely

### 4. Environment Configuration

#### Server Configuration

Copy the server environment template:
\`\`\`bash
cp server/env.example server/.env
\`\`\`

Edit \`server/.env\` with your Firebase configuration:
\`\`\`env
# Firebase Configuration
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"your-project-id",...}
# OR use file path:
# FIREBASE_SERVICE_ACCOUNT_PATH=./path/to/serviceAccountKey.json

# Server Configuration
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
\`\`\`

#### Client Configuration

Copy the client environment template:
\`\`\`bash
cp client/env.example client/.env
\`\`\`

Edit \`client/.env\` with your Firebase web configuration:
\`\`\`env
REACT_APP_FIREBASE_API_KEY=your-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
REACT_APP_FIREBASE_APP_ID=your-app-id
REACT_APP_API_URL=http://localhost:5000/api
\`\`\`

### 5. Deploy Firestore Security Rules

Deploy the security rules to your Firebase project:
\`\`\`bash
# Install Firebase CLI if you haven't already
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in your project (select Firestore)
firebase init firestore

# Deploy security rules
firebase deploy --only firestore:rules
\`\`\`

### 6. Seed the Database

Initialize the database with sample data:
\`\`\`bash
npm run seed
\`\`\`

This will create:
- Default categories (Politics, Relationships, Tech, etc.)
- Sample users (you'll need to create these accounts in Firebase Auth)
- 20 sample posts with realistic vote distributions
- Sample reports for testing admin features

### 7. Start Development Servers

\`\`\`bash
# Start both client and server concurrently
npm run dev

# Or start them separately:
npm run dev:server  # Starts server on http://localhost:5000
npm run dev:client  # Starts client on http://localhost:3000
\`\`\`

## 📱 Usage

### For Regular Users

1. **Sign Up/Login**: Create an account or sign in
2. **Browse Posts**: View posts on the home page, filter by category or sort mode
3. **Vote**: Click "Yes" or "No" on any post (requires login)
4. **Create Posts**: Click "Create Post" to add your controversial topic
5. **Search**: Use the search bar to find specific topics

### For Admins

1. **Access Admin Panel**: Navigate to `/admin` (requires admin role)
2. **Manage Users**: View, ban, or promote users
3. **Moderate Content**: Delete posts and manage reports
4. **View Analytics**: See platform statistics and trends

## 🏗 Project Structure

\`\`\`
argueit/
├── client/                 # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── contexts/       # React contexts (Auth, etc.)
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   ├── config/         # Configuration files
│   │   └── App.tsx         # Main app component
│   ├── package.json
│   └── tailwind.config.js
├── server/                 # Node.js backend
│   ├── src/
│   │   └── index.js        # Express server
│   ├── routes/             # API routes
│   ├── middleware/         # Express middleware
│   ├── services/           # Business logic
│   ├── config/             # Server configuration
│   ├── scripts/            # Utility scripts
│   └── package.json
├── firestore.rules         # Firestore security rules
├── package.json            # Root package.json
└── README.md
\`\`\`

## 🔧 Available Scripts

### Root Level
- \`npm run dev\` - Start both client and server
- \`npm run build\` - Build client for production
- \`npm run start\` - Start production server
- \`npm run test\` - Run all tests
- \`npm run install:all\` - Install all dependencies
- \`npm run seed\` - Seed database with sample data

### Server Scripts
- \`npm run dev\` - Start development server with nodemon
- \`npm run start\` - Start production server
- \`npm run test\` - Run server tests
- \`npm run seed\` - Run database seeding script

### Client Scripts
- \`npm start\` - Start development server
- \`npm run build\` - Build for production
- \`npm run test\` - Run client tests

## 🧪 Testing

### Running Tests

\`\`\`bash
# Run all tests
npm test

# Run server tests only
cd server && npm test

# Run client tests only
cd client && npm test
\`\`\`

### Test Accounts

After seeding, you can create these test accounts in Firebase Auth:

- **Regular Users**: alice@example.com, bob@example.com, carol@example.com
- **Admin User**: admin@example.com

All accounts can use the password: \`password123\`

## 🚀 Deployment

### Production Build

\`\`\`bash
# Build the client
npm run build

# The server will serve the built client in production mode
\`\`\`

### Environment Variables for Production

Ensure these environment variables are set in your production environment:

**Server:**
- \`NODE_ENV=production\`
- \`PORT=5000\` (or your preferred port)
- \`FIREBASE_SERVICE_ACCOUNT\` (JSON string or file path)
- \`CORS_ORIGIN\` (your frontend domain)

**Client:**
- All \`REACT_APP_FIREBASE_*\` variables
- \`REACT_APP_API_URL\` (your backend API URL)

### Deployment Options

#### Option 1: Vercel (Recommended)
1. Deploy client to Vercel
2. Deploy server to Vercel or Railway
3. Update \`REACT_APP_API_URL\` to point to your server

#### Option 2: Single Server Deployment
1. Build the client: \`npm run build\`
2. Deploy the server with the built client files
3. The server serves both API and static files

#### Option 3: Docker
\`\`\`bash
# Build and run with Docker Compose
docker-compose up --build
\`\`\`

## 🔒 Security Features

- **Firebase Authentication** with email verification
- **Firestore Security Rules** for data protection
- **Rate limiting** on API endpoints
- **Input validation** with Joi schemas
- **CORS protection**
- **Helmet.js** for security headers
- **User ban system** for moderation

## 📊 Key Features Explained

### Voting System
- **One vote per user per post** enforced by Firestore rules
- **Real-time updates** using Firestore listeners
- **Atomic transactions** to prevent race conditions
- **Vote changing** allowed (users can switch from Yes to No)

### Filtering Modes
- **Date**: Newest or oldest posts first
- **Attraction**: Posts with the most total votes
- **Controversy**: Posts closest to a 50/50 split (calculated server-side)

### Admin Features
- **User management**: Ban/unban users, change roles
- **Content moderation**: Delete posts, manage reports
- **Analytics dashboard**: User and content statistics
- **Category management**: Create and edit categories

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: \`git checkout -b feature/amazing-feature\`
3. Commit your changes: \`git commit -m 'Add amazing feature'\`
4. Push to the branch: \`git push origin feature/amazing-feature\`
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues:

1. Check the [Issues](../../issues) page for existing solutions
2. Create a new issue with detailed information
3. Include error logs and environment details

## 🙏 Acknowledgments

- Firebase for authentication and database services
- Tailwind CSS for the beautiful UI components
- React Query for excellent data fetching
- The open-source community for amazing tools and libraries

---

**argue.it** - Where controversial topics meet thoughtful debate. 🗣️
