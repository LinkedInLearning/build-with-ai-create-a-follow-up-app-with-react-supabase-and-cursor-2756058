# Environment Variables

This project requires the following environment variables to be set. Create a `.env` file in the root directory with these variables:

## Required Environment Variables

### Resend API Configuration
```bash
VITE_RESEND_API_KEY=your_resend_api_key_here
```
Get your Resend API key from: https://resend.com/api-keys

### Supabase Configuration
```bash
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### Email Configuration
```bash
VITE_FROM_EMAIL=noreply@yourdomain.com
```

## Supabase Edge Functions Environment Variables

For the Supabase Edge Functions (like `process-email-queue`), you'll need to set these in your Supabase dashboard:

```bash
RESEND_API_KEY=your_resend_api_key_here
EMAIL_SERVICE_URL=https://api.resend.com/emails
FROM_EMAIL=noreply@yourdomain.com
```

## How to Set Up

1. Create a `.env` file in the root directory
2. Copy the variables above and replace the placeholder values
3. For Supabase Edge Functions, go to your Supabase dashboard → Settings → Edge Functions → Environment Variables
4. Add the required environment variables there

## Security Notes

- Never commit your `.env` file to version control
- The `.env` file is already in `.gitignore`
- Use different API keys for development and production
- Rotate your API keys regularly
