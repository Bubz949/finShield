# AI Chat Setup Guide

## Overview
The chat system has been upgraded from rule-based responses to full generative AI using OpenAI's GPT-3.5-turbo model.

## Setup Instructions

### 1. Get OpenAI API Key
1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in to your account
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key (starts with `sk-`)

### 2. Configure Environment Variables
1. Open `.env` file in the project root
2. Replace `sk-your-actual-openai-api-key-here` with your actual OpenAI API key:
   ```
   OPENAI_API_KEY=sk-your-actual-key-here
   ```

### 3. Install Dependencies
Run the package manager to install the OpenAI dependency:
```bash
npm install
# or
yarn install
# or
pnpm install
```

## Features

### AI Capabilities
- **Natural Language Understanding**: Understands complex questions about finances
- **Context Awareness**: Uses user's transaction history and alerts for personalized responses
- **Senior-Friendly**: Optimized language and responses for older adults
- **Profile Updates**: Automatically detects life situations (hospital, travel) and updates user profiles
- **Fallback System**: Falls back to basic responses if OpenAI API is unavailable

### Example Conversations

**User**: "I'm going to the hospital next week for surgery. Will this affect my account monitoring?"

**AI**: "I understand you're having surgery next week. I've updated your profile to expect medical and pharmacy transactions while being more alert to unusual retail spending. The system will adjust fraud detection during your hospital stay. Focus on your recovery - we'll keep your finances safe!"

**User**: "There's a charge from Amazon for $89 that I don't remember making."

**AI**: "That's concerning! You can review this transaction in your Transactions section. Look for the Amazon charge, click 'Details', then use the review options to flag it as suspicious. If you're certain it's fraud, contact your bank immediately. Would you like me to guide you through the review process?"

## Technical Details

### Model Configuration
- **Model**: GPT-3.5-turbo (cost-effective, fast responses)
- **Max Tokens**: 200 (keeps responses concise)
- **Temperature**: 0.7 (balanced creativity and consistency)

### Security Features
- API key stored securely in environment variables
- Input sanitization for all user messages
- Rate limiting and authentication required
- No sensitive data sent to OpenAI (only general context)

### Cost Management
- Responses limited to 200 tokens (~150 words)
- Efficient prompting to minimize API calls
- Fallback system reduces dependency on external API

## Testing

Test these scenarios to verify AI functionality:

1. **General Help**: "How do I use this app?"
2. **Transaction Questions**: "What's this charge from Walmart?"
3. **Security Concerns**: "I think someone used my card"
4. **Life Situations**: "I'm traveling to Florida next month"
5. **App Navigation**: "Where can I see my alerts?"

## Troubleshooting

### Common Issues

1. **"I'm having trouble connecting to my AI service"**
   - Check OpenAI API key is correct in `.env`
   - Verify internet connection
   - Check OpenAI service status

2. **Generic responses instead of AI**
   - Ensure OpenAI dependency is installed
   - Restart the server after adding API key
   - Check server logs for API errors

3. **API Rate Limits**
   - OpenAI has usage limits for free accounts
   - Consider upgrading to paid plan for production use

## Production Considerations

- Monitor OpenAI usage and costs
- Implement proper error handling and logging
- Consider caching common responses
- Set up monitoring for API availability
- Review and update system prompts regularly