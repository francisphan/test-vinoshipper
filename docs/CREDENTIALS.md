# API Credentials Guide

Peyto requires Vinoshipper API credentials for each wine producer account you manage.

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
   - **Client Name**: e.g., "Chateau Margaux"
   - **Vinoshipper API Key:Secret**: Paste in format `KEY:SECRET`
   - **Fulfillment Center**: Select from dropdown
5. Click **Add Client**
6. Repeat for each wine producer you manage

### Managing Multiple Clients

Peyto supports managing multiple Vinoshipper accounts:
- Each client has separate credentials
- Switch between clients using the dropdown in the header
- All inventory operations apply to the currently selected client
- Credentials are stored securely in the OS keyring

## Security Best Practices

### Protecting Your API Keys

- **Never share** your API keys publicly or in version control
- **Regenerate keys** immediately if compromised
- **Use separate keys** for development vs production if possible
- **Clear credentials** from Peyto if you're on a shared computer

### How Peyto Stores Credentials

- **Desktop (Tauri)**: Stored in the OS-native keyring (Keychain / Credential Manager / Secret Service)
- **Browser dev mode**: Falls back to localStorage
- Never transmitted except to the Vinoshipper API
- Can be cleared by removing clients in Settings

## Troubleshooting

### Vinoshipper API Issues

**"Authentication failed" error:**
- Verify format is `KEY:SECRET` with colon separator
- Check credentials in Vinoshipper dashboard
- Contact Vinoshipper support if keys don't work

**"API not available" error:**
- Your account may not have API access enabled
- Contact Vinoshipper to request API access

**Inventory not loading:**
- Check your network connection
- If cached data is available, it will be served with a "Last updated" timestamp
- Re-check your API credentials in Settings

## Demo Mode (No Credentials Required)

Want to try Peyto without API keys?

1. Open Peyto
2. On the Settings screen, click **"Try Demo Mode"**
3. Explore the UI with sample client accounts

**Demo mode limitations:**
- Inventory will be empty (no mock data) unless previously cached
- Sync operations will not reach Vinoshipper

Demo mode is perfect for:
- Evaluating Peyto before committing
- Training and demonstrations
- Testing the UI
