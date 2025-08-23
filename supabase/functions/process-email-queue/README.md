# Email Queue Processor Edge Function

This edge function processes the email queue in batches, sending emails through your preferred email service.

## Features

- **Batch Processing**: Processes emails in configurable batches (default: 10)
- **Priority Queue**: Handles emails by priority (1=normal, 2=high, 3=urgent)
- **Retry Logic**: Automatically retries failed emails up to 3 times
- **Error Handling**: Comprehensive error handling and logging
- **Audit Logging**: Logs all email activities for monitoring
- **Resend Integration**: Uses Resend client for reliable email delivery
- **Email Templates**: Professional HTML templates with personalization
- **Lead Personalization**: Automatically includes lead names in emails

## Deployment

### 1. Deploy the Edge Function

```bash
# Navigate to your project root
cd your-project-directory

# Deploy the edge function
supabase functions deploy process-email-queue
```

### 2. Set Environment Variables

Make sure your Supabase project has the following environment variables set:

```bash
PROJECT_URL=your_supabase_project_url
PROJECT_SERVICE_ROLE_KEY=your_service_role_key
RESEND_API_KEY=your_resend_api_key
FROM_EMAIL=noreply@yourdomain.com
```

**Note**: Supabase doesn't allow environment variable names to start with "supabase", so we use these alternative names.

### 3. Run Database Setup

Execute the updated `setup-database.sql` script in your Supabase SQL editor to create:

- `email_queue` table
- `add_email_to_queue()` function
- `get_pending_emails()` function
- `mark_email_sent()` function
- `mark_email_failed()` function
- RLS policies

## Usage

### Adding Emails to Queue

```typescript
import { addEmailToQueue } from "@/lib/supabase";

// Add a welcome email to the queue
await addEmailToQueue(
  "user@example.com",
  "Welcome to Our Service!",
  "<h1>Welcome!</h1><p>Thank you for joining us.</p>",
  "welcome",
  leadId, // optional
  userId, // optional
  1, // priority
  new Date() // scheduled time
);
```

### Processing Email Queue

```typescript
import { processEmailQueue } from "@/lib/supabase";

// Process queue with default batch size (10)
const result = await processEmailQueue();

// Process queue with custom batch size
const result = await processEmailQueue(5);
```

### Manual Processing via cURL

```bash
curl -X POST 'https://your-project.supabase.co/functions/v1/process-email-queue' \
  -H 'Authorization: Bearer your-anon-key' \
  -H 'Content-Type: application/json' \
  -d '{"batchSize": 10}'
```

## Email Service Configuration

The function uses the Resend client for reliable email delivery:

### Resend Configuration

```typescript
const EMAIL_SERVICE_CONFIG = {
  apiKey: Deno.env.get("RESEND_API_KEY"),
  fromEmail: Deno.env.get("FROM_EMAIL"),
};

// Initialize Resend client
const resend = new Resend(EMAIL_SERVICE_CONFIG.apiKey);
```

### Email Templates

The function includes professional HTML email templates that are automatically customized based on the email type:

- **Welcome Emails**: Personalized welcome messages for new leads
- **Follow-up Emails**: Custom follow-up content with lead personalization
- **Notification Emails**: Important updates and notifications
- **Default Template**: Generic messages with professional styling

Each template includes:

- Responsive HTML design
- Professional styling
- Lead name personalization
- Consistent branding

## Queue Management

### Email Statuses

- **pending**: Email is waiting to be processed
- **processing**: Email is currently being sent
- **sent**: Email was sent successfully
- **failed**: Email failed after 3 attempts

### Priority Levels

- **1**: Normal priority (default)
- **2**: High priority
- **3**: Urgent priority

### Retry Logic

- Emails are retried up to 3 times
- Failed emails are marked as 'failed' after 3 attempts
- Each retry increments the `attempts` counter

## Monitoring

### Check Queue Status

```sql
-- View pending emails
SELECT COUNT(*) as pending_count FROM email_queue WHERE status = 'pending';

-- View failed emails
SELECT * FROM email_queue WHERE status = 'failed' ORDER BY created_at DESC;

-- View recent sent emails
SELECT * FROM email_queue WHERE status = 'sent' ORDER BY sent_at DESC LIMIT 10;
```

### Audit Logs

```sql
-- View email-related audit logs
SELECT * FROM audit_logs
WHERE table_name = 'email_queue'
ORDER BY event_time DESC;
```

## Scheduling

### Manual Processing

You can trigger the queue processor manually:

```bash
# Process queue every 5 minutes
*/5 * * * * curl -X POST 'https://your-project.supabase.co/functions/v1/process-email-queue'
```

### Automated Processing

For production, consider using:

1. **Cron Jobs**: Set up a cron job to call the function regularly
2. **Cloud Scheduler**: Use Google Cloud Scheduler or AWS EventBridge
3. **Supabase Cron**: Use Supabase's built-in cron functionality (if available)

## Error Handling

The function handles various error scenarios:

- **Email Service Errors**: Logs and marks emails as failed
- **Database Errors**: Returns appropriate error responses
- **Network Errors**: Retries with exponential backoff
- **Invalid Data**: Validates email data before processing

## Performance

- **Batch Size**: Configurable (default: 10 emails per batch)
- **Processing Time**: Typically 1-2 seconds per email
- **Concurrency**: Processes emails sequentially for reliability
- **Memory Usage**: Minimal, processes one email at a time

## Security

- **Service Role**: Uses service role key for database access
- **Input Validation**: Validates all email data
- **Error Sanitization**: Safe error messages
- **Audit Logging**: Complete audit trail of all operations
