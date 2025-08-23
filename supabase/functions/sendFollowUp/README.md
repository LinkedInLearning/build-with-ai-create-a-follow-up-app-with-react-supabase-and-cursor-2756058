# Send Follow-Up Email Edge Function

This Supabase Edge Function sends follow-up emails to leads using predefined templates.

## Functionality

1. **Reads lead ID and template** from the JSON request body
2. **Looks up lead information** from the `leads` table (email and name)
3. **Sends follow-up email** via Resend with personalized message based on template
4. **Creates/updates follow-up record** in the `followups` table
5. **Logs audit event** for tracking
6. **Returns status** indicating success

## Usage

### Request

```bash
POST /functions/v1/sendFollowUp
Content-Type: application/json

{
  "leadId": "uuid-of-lead",
  "template": "welcome"
}
```

### Response

```json
{
  "status": "sent"
}
```

## Available Templates

- **welcome**: Welcome message for new leads
- **check-in**: Check-in message to see how things are going
- **reminder**: Friendly reminder about recent inquiry
- **update**: Important update regarding the request

## Error Responses

### Missing leadId

```json
{
  "error": "leadId is required"
}
```

Status: 400

### Missing template

```json
{
  "error": "template is required"
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

## Email Templates

The function includes predefined templates with professional HTML formatting:

- **Welcome**: Introduces the company and sets expectations
- **Check-in**: Asks about progress and offers support
- **Reminder**: Follows up on previous communication
- **Update**: Provides status updates on requests

## Audit Logging

The function automatically logs an audit event with:

- **Action**: `followup_email_sent`
- **Table**: `leads`
- **Additional Data**: Recipient email, name, email type, and template used

## Example Usage in Frontend

```typescript
const sendFollowUp = async (leadId: string, template: string) => {
  try {
    const { data, error } = await supabase.functions.invoke("sendFollowUp", {
      body: { leadId, template },
    });

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Error sending follow-up:", error);
    throw error;
  }
};
```

## Database Integration

The function automatically:

1. Creates or updates a record in the `followups` table
2. Sets the status to "done" when email is sent successfully
3. Records the template used and timestamp
4. Links the follow-up to the specific lead
