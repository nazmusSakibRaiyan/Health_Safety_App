# Health & Safety Tracking App

A full-stack health tracking application built with TypeScript, featuring secure authentication, real-time notifications, and comprehensive health data management.

## 🚀 Features

- **User Authentication**: Secure registration and login with JWT tokens
- **Health Data Tracking**: Monitor and manage personal health metrics
- **Real-time Notifications**: Stay updated with push notifications
- **Admin Dashboard**: Administrative controls and user management
- **Data Security**: Encrypted storage and secure API endpoints
- **Cross-platform**: React Native mobile app with responsive design

## 📋 Tech Stack

### Frontend
- **React Native** with Expo
- **TypeScript** for type safety
- **Zustand** for state management
- **TailwindCSS** for styling
- **Axios** for API communication

### Backend
- **Node.js** with Express
- **TypeScript**
- **PostgreSQL** database
- **JWT** authentication
- **Bcrypt** for password hashing
- **Nodemailer** for email services

## 🛠️ Installation

### Prerequisites
- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn
- Expo CLI (for mobile development)

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the backend directory:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=health_tracking_db
DB_USER=your_username
DB_PASSWORD=your_password
JWT_SECRET=your_jwt_secret_key
PORT=3000
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_email_password
```

4. Set up the database:
```bash
# Run the database setup scripts
psql -U postgres -f database/setup.sql
psql -U postgres -d health_tracking_db -f database/schema.sql
psql -U postgres -d health_tracking_db -f database/grant-permissions.sql
```

5. Start the backend server:
```bash
npm run dev
```

The backend will run on `http://localhost:3000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Update the API URL in `services/api.ts` if needed:
```typescript
const API_URL = 'http://your-backend-url:3000/api';
```

4. Start the Expo development server:
```bash
npx expo start
```

5. Scan the QR code with Expo Go app (iOS/Android) or run on an emulator

## 📁 Project Structure

```
├── backend/
│   ├── database/           # Database setup and schema files
│   ├── src/
│   │   ├── controllers/    # Route controllers
│   │   ├── middleware/     # Authentication middleware
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic services
│   │   └── server.ts       # Entry point
│   └── package.json
│
├── frontend/
│   ├── app/                # React Native screens
│   ├── assets/             # Images and resources
│   ├── services/           # API and auth services
│   ├── store/              # State management
│   └── package.json
│
└── README.md
```

## 🔐 Environment Variables

### Backend
- `DB_HOST` - PostgreSQL host
- `DB_PORT` - PostgreSQL port
- `DB_NAME` - Database name
- `DB_USER` - Database username
- `DB_PASSWORD` - Database password
- `JWT_SECRET` - Secret key for JWT tokens
- `PORT` - Server port
- `EMAIL_USER` - Email for notifications
- `EMAIL_PASSWORD` - Email password

## 🔑 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### User Management
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/health-data` - Get health data

### Admin
- `GET /api/admin/users` - Get all users (admin only)
- `PUT /api/admin/users/:id` - Update user (admin only)
- `DELETE /api/admin/users/:id` - Delete user (admin only)

### Notifications
- `GET /api/notifications` - Get user notifications
- `POST /api/notifications` - Create notification
- `PUT /api/notifications/:id` - Mark as read

## 🧪 Testing

### Backend
```bash
cd backend
npm test
```

### Frontend
```bash
cd frontend
npm test
```

## 🚢 Deployment

### Backend
1. Set up a PostgreSQL database on your hosting platform
2. Configure environment variables
3. Deploy to platforms like Heroku, AWS, or DigitalOcean
4. Run database migrations

### Frontend
1. Build the Expo app:
```bash
npx expo build:android
npx expo build:ios
```
2. Submit to Play Store/App Store, or use Expo's hosting

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Authors

- **Nazmus Sakib Raiyan** - [GitHub Profile](https://github.com/nazmusSakibRaiyan)

## 🙏 Acknowledgments

- Built with React Native and Expo
- Backend powered by Node.js and Express
- Database management with PostgreSQL
- UI components inspired by modern mobile design patterns

## 📧 Contact

For questions or support, please open an issue or contact the repository owner.

---

**Note**: Make sure to never commit sensitive information like API keys, database passwords, or JWT secrets to version control. Always use environment variables for sensitive configuration.
