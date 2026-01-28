# Authentication Setup Guide

## Overview
The admin panel now has a complete authentication system integrated with your backend API.

## Features
- ✅ Secure login with email/password
- ✅ JWT token-based authentication
- ✅ Protected routes (requires authentication)
- ✅ Automatic token refresh and validation
- ✅ User-friendly error messages
- ✅ Demo credentials fallback for offline testing
- ✅ Logout functionality
- ✅ User profile display in header

## Environment Setup

1. **Create `.env` file** (for development):
   ```bash
   cp .env.example .env
   ```

2. **Update the API URL** in `.env`:
   ```
   VITE_API_URL=http://localhost:5000/api/v1
   ```

3. **For production**, the `.env.production` file is already configured:
   ```
   VITE_API_URL=https://tiptopapp-backend.onrender.com/api/v1
   ```

## Usage

### Demo Credentials
For testing without backend connection:
- **Email**: admin@thetiptop.com
- **Password**: admin123

### API Integration
The system expects the following response from `POST /auth/login`:

```json
{
  "status": "success",
  "data": {
    "user": {
      "email": "admin@thetiptop.com",
      "name": {
        "first": "John",
        "last": "Doe"
      },
      "role": "admin"
    },
    "tokens": {
      "accessToken": "jwt-token-here"
    }
  }
}
```

### Protected Routes
All routes under `/admin/*` are now protected and require authentication:
- Dashboard
- Orders (Management & Add)
- Customers
- Menu (Management & Add)
- Delivery (Agents & Add)
- User Profile
- UI Elements, Forms, Tables, Charts, etc.

### Authentication Flow

1. **Login**: User enters credentials at `/signin`
2. **Validation**: System checks with backend API
3. **Token Storage**: JWT token saved in localStorage
4. **Auto-redirect**: User redirected to `/admin` dashboard
5. **Protected Access**: All admin routes check for valid token
6. **Auto-logout**: If token is invalid (401), user is logged out

### Key Files

- **`src/config/api.ts`**: API configuration and request utilities
- **`src/context/AuthContext.tsx`**: Authentication state management
- **`src/components/auth/ProtectedRoute.tsx`**: Route protection component
- **`src/components/auth/SignInForm.tsx`**: Login form with validation
- **`src/components/header/UserDropdown.tsx`**: User menu with logout

## Error Handling

The system provides user-friendly messages for:
- ❌ Invalid credentials
- ❌ Network errors
- ❌ Server unavailable
- ❌ Non-admin users
- ❌ Missing fields
- ✅ Successful login

## Security Features

1. **JWT Token Storage**: Tokens stored securely in localStorage
2. **Role Validation**: Only users with 'admin' role can access
3. **Automatic Logout**: Invalid/expired tokens trigger auto-logout
4. **Protected Routes**: Unauthorized access redirects to login
5. **Secure API Calls**: All requests include Authorization header

## Testing

### With Backend:
1. Start your backend server
2. Update `.env` with correct API URL
3. Use real admin credentials
4. Test login, protected routes, and logout

### Without Backend (Demo Mode):
1. Use demo credentials provided
2. System will use local storage only
3. Full UI functionality available
4. No real data persistence

## Troubleshooting

### "Cannot connect to server"
- Check if backend is running
- Verify API URL in `.env`
- Check CORS settings on backend
- Use demo credentials as fallback

### "Access denied. Admin privileges required"
- User role must be 'admin'
- Check backend role assignment
- Verify API response format

### Token Issues
- Clear localStorage
- Re-login to get fresh token
- Check token expiration settings

## Next Steps

1. ✅ Authentication implemented
2. 🔄 Connect remaining CRUD operations:
   - Orders management
   - Customer management
   - Menu management
   - Delivery agent management
3. 🔄 Real-time data updates
4. 🔄 File upload for images
5. 🔄 Advanced filtering and search

## API Endpoints Required

The following endpoints are expected:
- `POST /auth/login` - User login
- `GET /orders` - Fetch orders
- `POST /orders` - Create order
- `GET /customers` - Fetch customers
- `GET /menu` - Fetch menu items
- `POST /menu` - Add menu item
- `GET /delivery` - Fetch delivery agents
- And more...

## Support

For issues or questions:
1. Check console for detailed error messages
2. Verify environment variables
3. Test with demo credentials
4. Check backend API logs
