# Insight Weaver

**Insight Weaver** is an AI-powered company research and account planning application that provides real-time financial data analysis, intelligent conversation capabilities, and comprehensive company insights.

## 🚀 Features

- **Real-Time Company Research**: Fetch accurate, up-to-date company data from multiple financial APIs
- **Intelligent Chat Interface**: Context-aware conversational AI for company research queries
- **Account Plan Generation**: Automatically generate comprehensive account plans with financial metrics, risks, and opportunities
- **Voice Mode**: Speech-to-text interaction for hands-free research
- **Chat History**: Manage multiple chat sessions with company-based analysis history
- **Company Comparison**: Side-by-side comparison of multiple companies
- **Risk Analysis Charts**: Visual risk and opportunity assessments based on real financial data
- **Dark/Light Mode**: Customizable theme support

## 📋 Prerequisites

- **Node.js** (v18 or higher) - [Install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)
- **npm** or **yarn** package manager
- **API Keys** (optional but recommended):
  - Alpha Vantage API key (free tier available at [alphavantage.co](https://www.alphavantage.co/support/#api-key))
  - Financial Modeling Prep API key (optional, free tier available)

## 🛠️ Setup Instructions

### 1. Clone the Repository

```bash
git clone <YOUR_REPOSITORY_URL>
cd insight-weaver-main
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure API Keys (Optional)

Edit `src/services/realCompanyDataService.ts` and update the API keys:

```typescript
const ALPHA_VANTAGE_API_KEY = 'YOUR_API_KEY_HERE';
const FINANCIAL_MODELING_PREP_API_KEY = 'YOUR_API_KEY_HERE'; // Optional
```

**Note**: The project includes a demo Alpha Vantage API key, but for production use, you should:
- Get your own free API key from [Alpha Vantage](https://www.alphavantage.co/support/#api-key)
- Replace the key in the service file
- Consider using environment variables for production deployments

### 4. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:8080`

### 5. Build for Production

```bash
npm run build
```

The production build will be in the `dist` directory.

### 6. Preview Production Build

```bash
npm run preview
```

## 🏗️ Architecture

### Project Structure

```
insight-weaver-main/
├── src/
│   ├── components/          # React components
│   │   ├── ui/              # shadcn-ui component library
│   │   ├── AccountPlanDocument.tsx
│   │   ├── ChatHistorySidebar.tsx
│   │   ├── ChatMessage.tsx
│   │   ├── HistoryModal.tsx
│   │   ├── RiskAnalysisChart.tsx
│   │   └── VoiceVisualizer.tsx
│   ├── hooks/               # Custom React hooks
│   ├── lib/                 # Utility functions
│   ├── pages/               # Page components
│   │   ├── Index.tsx        # Main application page
│   │   └── NotFound.tsx
│   ├── services/            # Business logic and API services
│   │   ├── companyResearchService.ts    # Chat and research logic
│   │   └── realCompanyDataService.ts    # Financial data fetching
│   ├── App.tsx              # Root component
│   └── main.tsx             # Application entry point
├── public/                  # Static assets
└── package.json            # Dependencies and scripts
```

### Technology Stack

- **Frontend Framework**: React 18.3 with TypeScript
- **Build Tool**: Vite 5.4
- **UI Components**: shadcn-ui (Radix UI primitives)
- **Styling**: Tailwind CSS with custom animations
- **State Management**: React Hooks (useState, useEffect)
- **Routing**: React Router DOM
- **Data Fetching**: Native Fetch API
- **Animations**: Framer Motion
- **Date Handling**: date-fns
- **Charts**: Recharts

### Key Services

#### 1. `realCompanyDataService.ts`
- Fetches real-time company data from multiple financial APIs
- Sources: Alpha Vantage, Yahoo Finance, Financial Modeling Prep
- Converts raw API data into structured company profiles
- Handles API failures with fallback mechanisms

#### 2. `companyResearchService.ts`
- Manages chat conversations and context
- Implements intelligent question detection using keyword matching
- Generates contextual responses based on conversation history
- Handles chat session management and localStorage persistence
- Provides company history tracking

### Data Flow

```
User Query
    ↓
Index.tsx (handleSendMessage)
    ↓
companyResearchService.searchCompany()
    ↓
realCompanyDataService.fetchRealCompanyData()
    ↓
[Alpha Vantage / Yahoo Finance / Financial Modeling Prep APIs]
    ↓
convertToCompanyData() → Structured CompanyData
    ↓
generateContextualResponse() → AgentMessage
    ↓
UI Update (ChatMessage component)
```

## 🎨 Design Decisions

### 1. **Rule-Based Chat System**
- **Decision**: Implemented keyword-based response generation instead of LLM APIs
- **Rationale**: 
  - Cost-effective (no API costs)
  - Predictable responses
  - Fast response times
  - Full control over response quality
- **Trade-off**: Less flexible than AI models, but sufficient for structured company research queries

### 2. **Multiple API Sources**
- **Decision**: Implemented fallback mechanism across 3 financial data APIs
- **Rationale**:
  - Redundancy ensures data availability
  - Different APIs provide complementary data
  - Free tier limitations require multiple sources
- **Implementation**: Sequential API calls with fallback on failure

### 3. **LocalStorage for Persistence**
- **Decision**: Store chat sessions and company history in browser localStorage
- **Rationale**:
  - No backend required
  - Fast access
  - Works offline
  - Privacy-friendly (data stays local)
- **Limitation**: Data is browser-specific and limited to ~5-10MB

### 4. **Component-Based Architecture**
- **Decision**: Modular component structure with shadcn-ui
- **Rationale**:
  - Reusable UI components
  - Consistent design system
  - Easy to maintain and extend
  - Type-safe with TypeScript

### 5. **Real-Time Data Emphasis**
- **Decision**: Prioritize fetching real financial data over generic templates
- **Rationale**:
  - Provides accurate, current information
  - Unique summaries per company
  - Builds user trust
  - More valuable insights

### 6. **Conversation Context Tracking**
- **Decision**: Maintain conversation history for context-aware responses
- **Rationale**:
  - Enables natural follow-up questions
  - Handles pronouns and references
  - Creates ChatGPT-like experience
  - Improves user experience

## 🔧 Configuration

### Environment Variables (Optional)

For production, consider using environment variables for API keys:

1. Create a `.env` file:
```env
VITE_ALPHA_VANTAGE_API_KEY=your_key_here
VITE_FINANCIAL_MODELING_PREP_API_KEY=your_key_here
```

2. Update `realCompanyDataService.ts`:
```typescript
const ALPHA_VANTAGE_API_KEY = import.meta.env.VITE_ALPHA_VANTAGE_API_KEY || 'demo';
```

### API Rate Limits

- **Alpha Vantage**: 5 API calls per minute (free tier)
- **Yahoo Finance**: No official rate limit, but be respectful
- **Financial Modeling Prep**: Varies by tier

The application implements sequential API calls to respect rate limits.

## 📱 Browser Support

- **Chrome/Edge**: Full support (including voice recognition)
- **Firefox**: Full support (voice recognition may be limited)
- **Safari**: Full support (voice recognition may be limited)

Voice recognition uses the Web Speech API, which works best in Chrome/Edge.

## 🚀 Deployment

### Build for Production

```bash
npm run build
```

### Deploy Options

1. **Vercel**: Connect your GitHub repo and deploy automatically
2. **Netlify**: Drag and drop the `dist` folder or connect via Git
3. **GitHub Pages**: Use GitHub Actions to build and deploy
4. **Any Static Host**: Upload the `dist` folder contents

### Production Considerations

- Set up environment variables for API keys
- Consider implementing a backend proxy for API calls (to hide API keys)
- Enable HTTPS for voice recognition features
- Set up proper CORS headers if using external APIs

## 🧪 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Code Style

- TypeScript strict mode enabled
- ESLint for code quality
- Prettier (if configured) for formatting

## 📝 API Integration Details

### Alpha Vantage API
- **Endpoint**: `https://www.alphavantage.co/query`
- **Functions Used**: `OVERVIEW`, `GLOBAL_QUOTE`
- **Data Retrieved**: Company overview, stock quotes, financial metrics

### Yahoo Finance API
- **Endpoint**: `https://query1.finance.yahoo.com/v8/finance/chart/{ticker}`
- **Data Retrieved**: Real-time stock prices, market data

### Financial Modeling Prep API
- **Endpoint**: `https://financialmodelingprep.com/api/v3/`
- **Data Retrieved**: Company profiles, financial quotes

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is private and proprietary.

## 🙏 Acknowledgments

- **shadcn/ui** for the excellent component library
- **Alpha Vantage** for free financial data API
- **Yahoo Finance** for market data
- **Financial Modeling Prep** for company profiles

## 📞 Support

For issues or questions, please open an issue in the repository.

---

**Built with ❤️ using React, TypeScript, and modern web technologies**
