# Send Confirmation Email Edge Function

This Supabase Edge Function sends a confirmation email to a lead after they submit a request form.

## Functionality

1. **Reads lead ID** from the JSON request body
2. **Looks up lead information** from the `leads` table (email and name)
3. **Sends confirmation email** via Resend with personalized message
4. **Logs audit event** for tracking
5. **Returns status** indicating success

## Usage

### Request

```bash
POST /functions/v1/sendConfirmationEmail
Content-Type: application/json

{
  "leadId": "uuid-of-lead"
}
```

### Response

```json
{
  "status": "sent"
}
```

## Error Responses

### Missing leadId

```json
{
  "error": "leadId is required"
}
```

Status: 400

### Lead not found

```json
{
  "error": "Lead not found",
  "details": "No rows returned"
}
```

Status: 404

### No email address

```json
{
  "error": "Lead does not have an email address"
}
```

Status: 400

### Server error

```json
{
  "error": "Internal server error",
  "details": "Error message"
}
```

Status: 500

## Environment Variables Required

Set these in your Supabase dashboard under Settings → Edge Functions → Environment Variables:

```bash
RESEND_API_KEY=your_resend_api_key_here
EMAIL_SERVICE_URL=https://api.resend.com/emails
FROM_EMAIL=noreply@yourdomain.com
```

## Email Template

The function sends a confirmation email with:

- **Subject**: "Thank you for your request!"
- **Content**: Personalized message including the lead's name
- **Format**: HTML email with professional styling

## Audit Logging

The function automatically logs an audit event with:

- **Action**: `confirmation_email_sent`
- **Table**: `leads`
- **Additional Data**: Recipient email, name, and email type

## Example Usage in Frontend

```typescript
const sendConfirmation = async (leadId: string) => {
  const { data, error } = await supabase.functions.invoke(
    "sendConfirmationEmail",
    {
      body: { leadId },
    }
  );

  if (error) {
    console.error("Error sending confirmation:", error);
    return;
  }

  console.log("Confirmation sent:", data);
};
```

## Deployment

Deploy this function using the Supabase CLI:

```bash
supabase functions deploy sendConfirmationEmail
```

Or deploy all functions:

```bash
supabase functions deploy
```
