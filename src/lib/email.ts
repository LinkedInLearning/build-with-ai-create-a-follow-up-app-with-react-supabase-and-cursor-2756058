import { getResendApiKey, getFromEmail } from "./utils";

export interface EmailData {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export async function sendEmail(emailData: EmailData): Promise<boolean> {
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getResendApiKey()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: emailData.from || getFromEmail(),
        to: emailData.to,
        subject: emailData.subject,
        html: emailData.html,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `Resend API error: ${errorData.message || response.statusText}`
      );
    }

    return true;
  } catch (error) {
    console.error("Email sending error:", error);
    throw error;
  }
}

// Example usage function for sending follow-up emails
export async function sendFollowUpEmail(
  recipientEmail: string,
  leadName: string,
  followUpContent: string
): Promise<boolean> {
  const emailData: EmailData = {
    to: recipientEmail,
    subject: `Follow-up: ${leadName}`,
    html: `
      <div>
        <h2>Hello ${leadName},</h2>
        <p>${followUpContent}</p>
        <p>Best regards,<br>Your Team</p>
      </div>
    `,
  };

  return sendEmail(emailData);
}
