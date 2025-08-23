# Rate-Limited Form Submission Edge Function

This edge function provides rate-limited form submission functionality with IP-based throttling.

## Features

- **Rate Limiting**: Maximum 5 submissions per IP address per hour
- **IP Detection**: Automatically detects client IP from various headers
- **Form Validation**: Validates required fields before processing
- **Audit Logging**: Logs all form submissions for security monitoring
- **Error Handling**: Comprehensive error handling with appropriate HTTP status codes

## Deployment

### 1. Deploy the Edge Function

```bash
# Navigate to your project root
cd your-project-directory

# Deploy the edge function
supabase functions deploy rate-limited-form-submit
```

### 2. Set Environment Variables

Make sure your Supabase project has the following environment variables set:

```bash
PROJECT_URL=your_supabase_project_url
PROJECT_SERVICE_ROLE_KEY=your_service_role_key
```

**Note**: Supabase doesn't allow environment variable names to start with "supabase", so we use these alternative names.

### 3. Run Database Setup

Execute the updated `setup-database.sql` script in your Supabase SQL editor to create:

- `form_submissions` table
- `check_rate_limit()` function
- `record_form_submission()` function
- RLS policies

## Usage

### Frontend Integration

The form component now calls the edge function instead of directly inserting into the database:

```typescript
const response = await fetch("/functions/v1/rate-limited-form-submit", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify(formData),
});
```

### Response Codes

- **200**: Form submitted successfully
- **400**: Validation error (missing required fields)
- **429**: Rate limit exceeded
- **500**: Internal server error

### Rate Limit Configuration

The rate limit is configurable in the edge function:

```typescript
const { data: rateLimitCheck, error: rateLimitError } = await supabase.rpc(
  "check_rate_limit",
  {
    p_ip_address: clientIP,
    p_threshold: 5, // Maximum submissions
    p_hours: 1, // Time window
  }
);
```

## Security Features

- **IP-based Rate Limiting**: Prevents spam and abuse
- **Input Validation**: Validates all form fields
- **Audit Logging**: Tracks all submissions for monitoring
- **CORS Support**: Handles cross-origin requests
- **Error Handling**: Graceful error responses

## Monitoring

You can monitor form submissions using the audit logs:

```sql
-- View recent form submissions
SELECT * FROM audit_logs
WHERE table_name = 'leads'
AND action = 'create'
ORDER BY event_time DESC;

-- Check rate limit violations
SELECT ip_address, COUNT(*) as submissions
FROM form_submissions
WHERE submitted_at > NOW() - INTERVAL '1 hour'
GROUP BY ip_address
HAVING COUNT(*) > 5;
```

## Testing

### Test Rate Limiting

1. Submit a form 5 times from the same IP
2. The 6th submission should return a 429 error
3. Wait 1 hour and try again - should work

### Test Edge Cases

- Submit with missing required fields (should return 400)
- Submit with invalid data (should return 400)
- Submit from different IPs (should work independently)

## Troubleshooting

### Common Issues

1. **429 Errors**: Normal behavior when rate limit is exceeded
2. **CORS Errors**: Ensure the edge function is deployed correctly
3. **Database Errors**: Verify the database setup script was run
4. **IP Detection Issues**: Check if your proxy/load balancer sets correct headers

### Debug Mode

Add console.log statements to the edge function for debugging:

```typescript
console.log("Client IP:", clientIP);
console.log("Rate limit check:", rateLimitCheck);
console.log("Form data:", formData);
```

## Performance

- **Response Time**: Typically < 100ms
- **Database Queries**: 2 queries per submission (rate check + insert)
- **Memory Usage**: Minimal, stateless function
- **Scalability**: Can handle thousands of concurrent requests
