# API Credentials Guide

Peyto requires two types of API credentials to function:

1. **Claude API Key** - For AI-powered natural language processing
2. **Vinoshipper API Credentials** - For each wine producer account you manage

## Claude API Key (Required)

### Getting Your Claude API Key

1. Go to [console.anthropic.com](https://console.anthropic.com/)
2. Sign up or log in to your Anthropic account
3. Navigate to **API Keys** in the dashboard
4. Click **Create Key**
5. Copy the key (it starts with `sk-ant-...`)
6. Store it securely - it won't be shown again

### Pricing (as of 2025)

Claude API uses pay-as-you-go pricing:
- **Claude 3.5 Sonnet**: ~$3 per million input tokens, ~$15 per million output tokens
- Typical conversation: $0.01 - $0.05
- Monthly costs depend on usage (usually $5-20 for moderate use)

### Adding to Peyto

1. Open Peyto
2. In the Settings screen, paste your key in the **Claude API Key** field
3. Click **Save & Connect**

## Vinoshipper API Credentials (Per Client)

### Getting Vinoshipper API Credentials

Vinoshipper provides API access to registered wine producers. The credentials are in the format `API_KEY:SECRET`.

#### Steps to Obtain:

1. **Log in to your Vinoshipper merchant/producer account**
   - Go to [vinoshipper.com](https://vinoshipper.com)
   - Use your producer account credentials

2. **Navigate to API Settings**
   - Look for "Settings", "Developer Settings", "API", or "Integrations" section
   - The exact location may vary based on your account type

3. **Generate or retrieve API credentials**
   - Click "Generate API Key" or similar button
   - You should receive both an API Key and Secret
   - Format: `YOUR_API_KEY:YOUR_SECRET`

4. **If you don't see API settings:**
   - API access may require a specific account tier
   - Contact Vinoshipper support to request API access
   - Email: support@vinoshipper.com
   - Mention you need API credentials for inventory management

### Adding to Peyto

1. Open Peyto and go to Settings
2. Click **Manage Clients**
3. Click **Add Client**
4. Fill in:
   - **Client Name**: e.g., "Château Margaux"
   - **Vinoshipper API Key:Secret**: Paste in format `KEY:SECRET`
   - **Fulfillment Center**: Select from dropdown
5. Click **Add Client**
6. Repeat for each wine producer you manage

### Managing Multiple Clients

Peyto supports managing multiple Vinoshipper accounts:
- Each client has separate credentials
- Switch between clients using the dropdown in the header
- All inventory operations apply to the currently selected client
- Credentials are stored securely in browser localStorage

## Security Best Practices

### Protecting Your API Keys

- **Never share** your API keys publicly or in version control
- **Regenerate keys** immediately if compromised
- **Use separate keys** for development vs production if possible
- **Clear credentials** from Peyto if you're on a shared computer

### How Peyto Stores Credentials

- Stored in browser's localStorage (encrypted by browser)
- Never transmitted except to authorized APIs (Claude, Vinoshipper)
- Can be cleared by:
  - Removing clients in Settings
  - Clearing browser data
  - Using browser developer tools

## Troubleshooting

### Claude API Issues

**"Invalid API key" error:**
- Verify key starts with `sk-ant-`
- Check for extra spaces when pasting
- Regenerate key in Anthropic console

**"Insufficient credits" error:**
- Add payment method at console.anthropic.com
- Check your usage and billing

### Vinoshipper API Issues

**"Authentication failed" error:**
- Verify format is `KEY:SECRET` with colon separator
- Check credentials in Vinoshipper dashboard
- Contact Vinoshipper support if keys don't work

**"API not available" error:**
- Your account may not have API access enabled
- Contact Vinoshipper to request API access

## Demo Mode (No Credentials Required)

Want to try Peyto without API keys?

1. Open Peyto
2. On the Settings screen, click **"Try Demo Mode"**
3. Explore with simulated data and mock AI responses

**Demo mode limitations:**
- Simulated AI responses (not real Claude)
- Mock inventory data
- No actual Vinoshipper integration

Demo mode is perfect for:
- Evaluating Peyto before committing
- Training and demonstrations
- Testing UI without API costs
