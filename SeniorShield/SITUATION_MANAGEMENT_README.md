# AI-Powered Profile Update System

## Overview

The enhanced Nuvanta AI chatbot can now intelligently update user profiles when they mention life situation changes. This system leverages the existing user questionnaire data to provide contextual fraud detection adjustments.

## Key Features

### 1. Intelligent Profile Updates
The AI chatbot can automatically detect when users mention life situation changes and update their existing profiles:
- **Hospital stays**: "I'm in hospital and shouldn't have any day to day outgoings"
- **Travel**: "I'm going on vacation next week"
- **Recovery periods**: "I'm recovering from surgery at home"

### 2. Contextual Fraud Detection
The ML system adjusts fraud detection based on updated user profiles:

#### Hospital Profile Updates
- **Reduces alerts** for medical, pharmacy, and food delivery transactions
- **Increases alerts** for unusual grocery, gas station, or retail spending
- **Updates spending profile** to expect minimal day-to-day activity

#### Travel Profile Updates
- **Reduces alerts** for restaurants, hotels, transportation, and entertainment
- **Accepts higher** spending amounts as normal
- **Updates profile** to expect different merchant locations

#### Recovery Profile Updates
- **Reduces alerts** for medical, pharmacy, home services, and delivery
- **Updates profile** to reflect limited mobility patterns

### 3. Profile Management
- **Automatic updates**: Profile changes based on natural conversation
- **Easy reset**: Simple endpoint to clear current situation status
- **Persistent learning**: Updates integrate with existing questionnaire data

## API Endpoints

### Profile Management
```
PATCH  /api/profile/reset-situation # Reset current situation in profile
```

### Enhanced Chat
```
POST   /api/chat                    # Chat with profile update capability
```

## Usage Examples

### 1. User Tells AI About Hospital Stay
**User**: "I'm in hospital and I shouldn't have any day to day outgoings"

**AI Response**: "I understand you're in the hospital. I've updated your profile to expect minimal day-to-day spending and will adjust fraud detection accordingly. The system will now expect medical and pharmacy transactions while being more alert to unusual retail spending. Take care and focus on your recovery!"

**System Actions**:
- Updates existing spendingProfile with hospital situation
- Updates livingProfile to reflect temporary assistance needs
- Adjusts ML fraud detection parameters based on profile

### 2. Profile Reset
User can reset their situation status:

```bash
curl -X PATCH /api/profile/reset-situation \
  -H "Authorization: Bearer $TOKEN"
```

### 3. Profile-Aware Transaction Analysis
When analyzing a transaction with updated hospital profile:
- Medical/pharmacy purchases: Risk score reduced by 30 points
- Grocery store purchases: Risk score increased by 20 points (unusual during hospital stay)
- Original fraud score: 85/100 → Adjusted score: 55/100 (no alert triggered)

## Database Schema

### Existing User Profiles
The system uses existing user profile fields:
- `living_profile`: JSON string with living situation data
- `spending_profile`: JSON string with spending pattern data

These are updated when the AI detects situation changes in conversation.

## Configuration

### ML Adjustments
Profile-based fraud detection adjustments:

```typescript
// Hospital profile adjustments
if (spendingProfile.currentSituation === 'hospital') {
  if (['medical', 'pharmacy', 'food_delivery'].includes(transaction.category)) {
    adjustedScore = Math.max(0, adjustedScore - 30); // Reduce by 30 points
  }
}
```

## Benefits for Seniors

1. **Reduced False Alerts**: Fewer unnecessary fraud warnings during legitimate life changes
2. **Natural Updates**: Profile changes through normal conversation
3. **Peace of Mind**: AI understands their circumstances and adjusts accordingly
4. **Simple Management**: Easy reset when situations change
5. **Integrated Learning**: Works with existing questionnaire system

## Implementation Notes

### Chat Service Enhancement
The chat service now returns both response text and optional profile updates:

```typescript
interface ChatResponse {
  response: string;
  profileUpdate?: any;
}
```

### ML Service Integration
The ML service considers user profile updates when analyzing transactions:

```typescript
const adjustedResult = this.applyProfileAdjustments(result, transaction, user);
```

### Profile Updates
Profile updates are applied immediately during chat:

```typescript
if (result.profileUpdate) {
  await storage.updateUser(userId, {
    spendingProfile: JSON.stringify(result.profileUpdate.spendingProfile),
    livingProfile: JSON.stringify(result.profileUpdate.livingProfile)
  });
}
```

## Future Enhancements

1. **Smart Profile Learning**: AI learns from profile updates to improve questionnaire
2. **Family Integration**: Automatic family member notifications for profile changes
3. **Calendar Integration**: Sync with calendar events for automatic profile updates
4. **Voice Integration**: Voice-activated profile updates
5. **Predictive Updates**: AI suggests profile changes based on spending patterns

## Testing

### Manual Testing
1. Tell the chatbot about a hospital stay
2. Verify user profile is updated in database
3. Check that fraud detection adjusts for medical transactions
4. Test resetting the situation via API
5. Verify ML adjustments reset after profile reset

### API Testing
```bash
# Chat with profile update
curl -X POST /api/chat \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"message": "I'm in hospital and shouldn't have day to day spending"}'

# Reset situation
curl -X PATCH /api/profile/reset-situation \
  -H "Authorization: Bearer $TOKEN"
```

This profile update system enhances Nuvanta's existing questionnaire-based approach, allowing natural conversation to keep user profiles current and fraud detection contextually accurate.