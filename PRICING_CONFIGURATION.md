# Pricing and Token Limits Configuration

## Plan Structure

### 1. Free Plan
- **Price**: $0/month
- **Cost to you**: ~$0.006/month per user (less than 1 cent!)
- **Available Models**: 
  - GPT-4o-mini only: **20,000 tokens/month**
- **Restrictions**:
  - ❌ No blog export access
  - ❌ No access to premium models (GPT-4.1, Claude 4, Gemini 2.5 Pro)
  - ❌ Limited to basic GPT-4o-mini model only

### 2. Pro Plan
- **Price**: $20/month
- **Target Profit**: $10/month (50% margin)
- **Available Budget**: $10/month for API costs
- **Full blog export access**: ✅

#### Pro Plan Model Limits & Costs (CONSERVATIVE)

| Model | Monthly Token Limit | Max Cost/Month | Use Case |
|-------|-------------------|-------------------|----------|
| **GPT-4o-mini** | 2,000,000 tokens | ~$1.20 | High-volume basic tasks |
| **GPT-4.1** | 50,000 tokens | ~$1.25 | Advanced reasoning |
| **Claude 4 Sonnet** | 100,000 tokens | ~$1.80 | Long-form content |
| **Gemini 2.5 Pro** | 200,000 tokens | ~$2.25 | Multimodal tasks |

**TOTAL MAX COST**: ~$6.50/month (conservative budget)

#### Legacy Models (Minimal Pro Access)
| Model | Free Limit | Pro Limit | Purpose |
|-------|------------|-----------|---------|
| GPT-4o | 0 | 50,000 | Backward compatibility |
| GPT-4 | 0 | 50,000 | Backward compatibility |
| Claude Opus 4 | 0 | 50,000 | Premium experiments |
| Claude 3 Haiku | 0 | 100,000 | Fast responses |
| Claude 3 Sonnet | 0 | 100,000 | Balanced performance |
| Gemini Pro (1.5) | 0 | 100,000 | Legacy support |

## Cost Analysis

### API Pricing Reference (Per Million Tokens)
- **GPT-4o-mini**: $0.15 input / $0.60 output
- **GPT-4.1**: $2.00 input / $8.00 output  
- **Claude 4 Sonnet**: $3.00 input / $15.00 output
- **Gemini 2.5 Pro**: $1.25 input / $10.00 output

### Monthly Cost Breakdown (Pro Plan)
Assuming 70% input / 30% output token mix:

1. **GPT-4o-mini** (2M tokens): ~$1.20
2. **GPT-4.1** (50K tokens): ~$1.25
3. **Claude 4 Sonnet** (100K tokens): ~$1.80
4. **Gemini 2.5 Pro** (200K tokens): ~$2.25

**Total Maximum Cost**: ~$6.50/month (if all limits used)
**Expected Average Cost**: ~$3-5/month (typical usage)
**Revenue**: $20/month
**Target Profit**: $13.50-17/month (67-85% margin)

## Technical Implementation

### Environment Variables (docker-compose.yaml)
```yaml
# FREE PLAN (GPT-4o-mini only)
- FREE_LIMIT_GPT_4O_MINI=20000

# PRO PLAN - Primary Models (Conservative limits within $6.50 budget)
- PRO_LIMIT_GPT_4O_MINI=2000000
- PRO_LIMIT_GPT_4_1=50000
- PRO_LIMIT_CLAUDE_SONNET_4=100000
- PRO_LIMIT_GEMINI_2_5_PRO=200000

# Legacy Models (disabled for free, minimal for pro)
- FREE_LIMIT_GPT_4O=0
- PRO_LIMIT_GPT_4O=50000
- FREE_LIMIT_GPT_4=0
- PRO_LIMIT_GPT_4=50000
- FREE_LIMIT_CLAUDE_OPUS_4=0
- PRO_LIMIT_CLAUDE_OPUS_4=50000
- FREE_LIMIT_CLAUDE_3_HAIKU=0
- PRO_LIMIT_CLAUDE_3_HAIKU=100000
- FREE_LIMIT_CLAUDE_3_SONNET=0
- PRO_LIMIT_CLAUDE_3_SONNET=100000
- FREE_LIMIT_GEMINI_PRO=0
- PRO_LIMIT_GEMINI_PRO=100000
```

### Model Name Normalization
The system automatically maps model names to environment variables:

- `gpt-4o-mini` → `gpt_4o_mini`
- `gpt-4.1` → `gpt_4_1`  
- `claude-sonnet-4-20250514` → `claude_sonnet_4`
- `gemini-2.5-pro-exp-03-25` → `gemini_2_5_pro`

### Blog Export Access Control
- **Free users**: ❌ Blocked with 403 error + upgrade prompt
- **Guest users**: ❌ Blocked with 401 error + signup prompt
- **Pro users**: ✅ Full access with token limit enforcement

### Usage Tracking & Limits
- All API calls tracked with token estimation (1 token ≈ 4 characters)
- Real-time usage checking before request processing
- Monthly limits reset automatically
- Visual warnings at 80% usage
- Hard blocks at 100% usage with upgrade prompts

## User Experience

### Free Plan Experience
1. Access to GPT-4o-mini with 20K monthly tokens
2. Clear messaging when attempting to use premium features
3. Upgrade prompts with pricing information
4. Usage dashboard showing remaining tokens

### Pro Plan Experience  
1. Access to all 4 primary models with generous limits
2. Blog export functionality included
3. Usage dashboard showing all model limits
4. Warning notifications at 80% usage
5. Graceful degradation when limits approached

## Business Metrics

### Revenue Targets
- **Monthly Revenue**: $20 per Pro subscriber
- **Target Profit Margin**: 50% ($10 profit per subscriber)
- **Break-even**: 1 Pro subscriber covers ~3-4 Free users
- **Scalability**: Profitable from first Pro subscriber

### Cost Management
- Conservative token limits ensure profitability
- Multiple model options reduce single-provider risk
- Legacy model access maintains backward compatibility
- Real-time monitoring prevents cost overruns

## Recommendations

### For Users
1. **Free Plan**: Perfect for testing and light usage
2. **Pro Plan**: Essential for:
   - Content creators (blog export)
   - Heavy AI users (high token needs)
   - Businesses requiring premium models

### For Operations
1. Monitor actual usage patterns monthly
2. Adjust limits based on real cost data
3. Consider adding enterprise tiers for high-volume users
4. Track conversion rates from free to pro plans

## Migration Notes

### Existing Users
- Free users: Automatically limited to new structure
- Pro users: Immediate access to all new limits
- Usage history: Preserved and continues tracking

### Database Changes
- No schema changes required
- Existing usage tracking continues normally
- Plan detection works with current subscription system

---

**Last Updated**: January 2025
**Configuration**: Applied and Active
**Status**: ✅ Implemented and Deployed 