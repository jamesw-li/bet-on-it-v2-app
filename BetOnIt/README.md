# Bet On It 🎲

A social mobile application that transforms any gathering into an exciting competition through friendly wagers and bets.

## Features

- 🎯 **Event Creation**: Create custom betting events for any occasion
- 👥 **Easy Joining**: Join events with simple 6-character codes or QR codes
- 🎲 **Custom Bets**: Create unlimited custom bets or choose from pre-made templates
- 🏆 **Live Leaderboards**: Real-time tracking of winnings and rankings
- 💰 **Payment Integration**: Track who owes what (no real money handling)
- 📱 **Cross-Platform**: Built with Expo for iOS and Android

## Tech Stack

- **Frontend**: React Native with Expo
- **Backend**: Supabase (PostgreSQL + Auth + Realtime)
- **Navigation**: React Navigation
- **UI Components**: Custom components with Linear Gradients
- **QR Codes**: react-native-qrcode-svg

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- Expo CLI (`npm install -g @expo/cli`)
- Supabase account

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd BetOnIt
```

2. Install dependencies:
```bash
npm install
```

3. Set up Supabase:
   - Create a new Supabase project
   - Run the SQL migration in `supabase/migrations/create_initial_schema.sql`
   - Copy your project URL and anon key

4. Configure environment variables:
```bash
cp .env.example .env
```
Edit `.env` with your Supabase credentials.

5. Start the development server:
```bash
npx expo start
```

## Project Structure

```
BetOnIt/
├── src/
│   ├── components/          # Reusable UI components
│   ├── contexts/           # React contexts (Auth, etc.)
│   ├── data/              # Static data and templates
│   ├── navigation/        # Navigation configuration
│   ├── screens/           # Screen components
│   ├── services/          # API and database services
│   └── utils/             # Utility functions
├── supabase/
│   └── migrations/        # Database migrations
├── App.js                 # Main app component
└── app.config.js         # Expo configuration
```

## Key Features Implementation

### Authentication
- Email/password signup and signin
- User profiles with payment info
- Secure session management with Supabase Auth

### Event Management
- Create events with unique codes
- Join events via code or QR scan
- Host/co-host role management
- Real-time event updates

### Betting System
- Custom bet creation
- Pre-made bet templates by category
- Multiple choice betting options
- Real-time bet settlement

### Leaderboards
- Live ranking calculations
- Win rate tracking
- Total winnings display
- Event-specific leaderboards

## Database Schema

The app uses a PostgreSQL database with the following main tables:
- `profiles` - User information
- `events` - Betting events
- `event_participants` - Event membership
- `bets` - Individual bets
- `bet_options` - Betting choices
- `user_bets` - User bet placements

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Disclaimer

Bet On It does not handle real money transactions. The app is designed for entertainment purposes only, helping friends track friendly wagers. All financial settlements must be handled outside the application.