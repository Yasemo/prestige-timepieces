// services/whatsapp.ts - WhatsApp Business API integration service

// Configuration from environment variables
const WHATSAPP_PROVIDER = Deno.env.get("WHATSAPP_PROVIDER") || "twilio"; // twilio, meta, or mock
const WHATSAPP_BUSINESS_NUMBER = Deno.env.get("WHATSAPP_BUSINESS_NUMBER") || "+1234567890";

// Twilio configuration
const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID") || "";
const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN") || "";
const TWILIO_WHATSAPP_NUMBER = Deno.env.get("TWILIO_WHATSAPP_NUMBER") || "whatsapp:+14155238886";

// Meta WhatsApp Business API configuration
const META_ACCESS_TOKEN = Deno.env.get("META_ACCESS_TOKEN") || "";
const META_PHONE_NUMBER_ID = Deno.env.get("META_PHONE_NUMBER_ID") || "";
const META_BUSINESS_ACCOUNT_ID = Deno.env.get("META_BUSINESS_ACCOUNT_ID") || "";

interface WhatsAppMessage {
  to: string;
  body: string;
  mediaUrl?: string;
  templateName?: string;
  templateParams?: string[];
}

interface WhatsAppResponse {
  messageId: string;
  status: string;
  timestamp: string;
  provider: string;
}

export async function sendWhatsAppMessage(to: string, message: string, mediaUrl?: string): Promise<WhatsAppResponse> {
  // Normalize phone number (ensure it has country code)
  const normalizedTo = normalizePhoneNumber(to);
  
  console.log(`Sending WhatsApp message to ${normalizedTo} via ${WHATSAPP_PROVIDER}`);
  
  const messageData: WhatsAppMessage = {
    to: normalizedTo,
    body: message,
    mediaUrl
  };

  switch (WHATSAPP_PROVIDER.toLowerCase()) {
    case "twilio":
      return await sendViaTwilio(messageData);
    case "meta":
      return await sendViaMeta(messageData);
    default:
      return await sendViaMock(messageData);
  }
}

export async function sendWhatsAppNotification(message: string): Promise<WhatsAppResponse> {
  // Send notification to the business WhatsApp number
  return await sendWhatsAppMessage(WHATSAPP_BUSINESS_NUMBER, message);
}

export async function sendTemplateMessage(
  to: string, 
  templateName: string, 
  templateParams: string[] = []
): Promise<WhatsAppResponse> {
  const normalizedTo = normalizePhoneNumber(to);
  
  console.log(`Sending WhatsApp template ${templateName} to ${normalizedTo}`);
  
  const messageData: WhatsAppMessage = {
    to: normalizedTo,
    body: "", // Template messages don't use body
    templateName,
    templateParams
  };

  switch (WHATSAPP_PROVIDER.toLowerCase()) {
    case "twilio":
      return await sendTwilioTemplate(messageData);
    case "meta":
      return await sendMetaTemplate(messageData);
    default:
      return await sendViaMock(messageData);
  }
}

// Twilio WhatsApp implementation
async function sendViaTwilio(messageData: WhatsAppMessage): Promise<WhatsAppResponse> {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
    console.warn("Twilio credentials not configured, using mock response");
    return await sendViaMock(messageData);
  }

  try {
    const auth = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);
    
    const body = new URLSearchParams({
      From: TWILIO_WHATSAPP_NUMBER,
      To: `whatsapp:${messageData.to}`,
      Body: messageData.body
    });

    if (messageData.mediaUrl) {
      body.append("MediaUrl", messageData.mediaUrl);
    }

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: "POST",
        headers: {
          "Authorization": `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: body.toString()
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Twilio API error: ${response.status} ${errorData}`);
    }

    const data = await response.json();
    
    return {
      messageId: data.sid,
      status: data.status,
      timestamp: new Date().toISOString(),
      provider: "twilio"
    };
  } catch (error) {
    console.error("Twilio WhatsApp send failed:", error);
    throw new Error(`Twilio WhatsApp send failed: ${error.message}`);
  }
}

async function sendTwilioTemplate(messageData: WhatsAppMessage): Promise<WhatsAppResponse> {
  // Twilio template implementation
  // For now, fallback to regular message
  return await sendViaTwilio({
    ...messageData,
    body: `Template: ${messageData.templateName} with params: ${messageData.templateParams?.join(", ")}`
  });
}

// Meta WhatsApp Business API implementation
async function sendViaMeta(messageData: WhatsAppMessage): Promise<WhatsAppResponse> {
  if (!META_ACCESS_TOKEN || !META_PHONE_NUMBER_ID) {
    console.warn("Meta WhatsApp credentials not configured, using mock response");
    return await sendViaMock(messageData);
  }

  try {
    const payload = {
      messaging_product: "whatsapp",
      to: messageData.to,
      type: "text",
      text: {
        body: messageData.body
      }
    };

    const response = await fetch(
      `https://graph.facebook.com/v18.0/${META_PHONE_NUMBER_ID}/messages`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${META_ACCESS_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Meta API error: ${response.status} ${errorData}`);
    }

    const data = await response.json();
    
    return {
      messageId: data.messages[0].id,
      status: "sent",
      timestamp: new Date().toISOString(),
      provider: "meta"
    };
  } catch (error) {
    console.error("Meta WhatsApp send failed:", error);
    throw new Error(`Meta WhatsApp send failed: ${error.message}`);
  }
}

async function sendMetaTemplate(messageData: WhatsAppMessage): Promise<WhatsAppResponse> {
  if (!META_ACCESS_TOKEN || !META_PHONE_NUMBER_ID) {
    return await sendViaMock(messageData);
  }

  try {
    const payload = {
      messaging_product: "whatsapp",
      to: messageData.to,
      type: "template",
      template: {
        name: messageData.templateName,
        language: { code: "en_US" },
        components: messageData.templateParams?.length ? [{
          type: "body",
          parameters: messageData.templateParams.map(param => ({
            type: "text",
            text: param
          }))
        }] : []
      }
    };

    const response = await fetch(
      `https://graph.facebook.com/v18.0/${META_PHONE_NUMBER_ID}/messages`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${META_ACCESS_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Meta template API error: ${response.status} ${errorData}`);
    }

    const data = await response.json();
    
    return {
      messageId: data.messages[0].id,
      status: "sent",
      timestamp: new Date().toISOString(),
      provider: "meta"
    };
  } catch (error) {
    console.error("Meta WhatsApp template send failed:", error);
    throw new Error(`Meta WhatsApp template send failed: ${error.message}`);
  }
}

// Mock implementation for development/testing
async function sendViaMock(messageData: WhatsAppMessage): Promise<WhatsAppResponse> {
  console.log("🔧 MOCK WhatsApp Message:");
  console.log(`📱 To: ${messageData.to}`);
  console.log(`💬 Message: ${messageData.body}`);
  if (messageData.mediaUrl) {
    console.log(`🖼️ Media: ${messageData.mediaUrl}`);
  }
  if (messageData.templateName) {
    console.log(`📋 Template: ${messageData.templateName}`);
    console.log(`🔤 Params: ${messageData.templateParams?.join(", ")}`);
  }
  console.log("---");

  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));

  return {
    messageId: `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    status: "sent",
    timestamp: new Date().toISOString(),
    provider: "mock"
  };
}

// Utility functions
function normalizePhoneNumber(phone: string): string {
  // Remove all non-digit characters
  let normalized = phone.replace(/\D/g, "");
  
  // Add country code if missing (assume US +1 for demo)
  if (!normalized.startsWith("1") && normalized.length === 10) {
    normalized = "1" + normalized;
  }
  
  // Add + prefix
  if (!normalized.startsWith("+")) {
    normalized = "+" + normalized;
  }
  
  return normalized;
}

export function validatePhoneNumber(phone: string): boolean {
  const normalized = normalizePhoneNumber(phone);
  // Basic validation: should be +1 followed by 10 digits for US numbers
  return /^\+1\d{10}$/.test(normalized);
}

// Predefined message templates
export const MESSAGE_TEMPLATES = {
  INQUIRY_CONFIRMATION: {
    name: "inquiry_confirmation",
    message: "Thank you for your inquiry about our luxury timepiece! We've received your message and will respond within 24 hours. 🏆"
  },
  QUOTE_PROVIDED: {
    name: "quote_provided", 
    message: "We've reviewed your watch and prepared a quote. Please check your email or call us to discuss the details. 💰"
  },
  APPOINTMENT_REMINDER: {
    name: "appointment_reminder",
    message: "Reminder: You have an appointment with Prestige Timepieces tomorrow. We look forward to seeing you! ⌚"
  },
  WATCH_SOLD: {
    name: "watch_sold",
    message: "Great news! Your watch has found a new home. We'll process your payment within 24 hours. 🎉"
  },
  NEW_ARRIVAL: {
    name: "new_arrival",
    message: "🆕 New arrival! We just added a stunning timepiece to our collection that matches your interests. Check it out!"
  }
};

export function getMessageTemplate(templateName: string, customParams?: string[]): string {
  const template = MESSAGE_TEMPLATES[templateName as keyof typeof MESSAGE_TEMPLATES];
  if (!template) {
    return "Thank you for your interest in Prestige Timepieces!";
  }
  
  let message = template.message;
  
  // Replace placeholders with custom parameters if provided
  if (customParams) {
    customParams.forEach((param, index) => {
      message = message.replace(`{${index}}`, param);
    });
  }
  
  return message;
}

// WhatsApp Business API webhook handler (for receiving messages)
export async function handleWhatsAppWebhook(body: any): Promise<void> {
  try {
    console.log("WhatsApp webhook received:", JSON.stringify(body, null, 2));
    
    // Handle different webhook events
    if (body.entry) {
      for (const entry of body.entry) {
        if (entry.changes) {
          for (const change of entry.changes) {
            if (change.value?.messages) {
              for (const message of change.value.messages) {
                await processIncomingMessage(message, change.value.contacts?.[0]);
              }
            }
            
            if (change.value?.statuses) {
              for (const status of change.value.statuses) {
                await processMessageStatus(status);
              }
            }
          }
        }
      }
    }
  } catch (error) {
    console.error("WhatsApp webhook processing error:", error);
  }
}

async function processIncomingMessage(message: any, contact: any): Promise<void> {
  console.log(`Incoming WhatsApp message from ${contact?.profile?.name || message.from}:`);
  console.log(`Message: ${message.text?.body || message.type}`);
  
  // Here you could:
  // 1. Store the message in database
  // 2. Trigger auto-responses
  // 3. Notify admins
  // 4. Update inquiry status
  
  // Auto-response example
  if (message.text?.body?.toLowerCase().includes("price") || 
      message.text?.body?.toLowerCase().includes("quote")) {
    
    const autoResponse = "Thank you for your message! 🏆 Our team will review your inquiry and provide pricing information within 24 hours. For immediate assistance, please call us at +1-234-567-8900.";
    
    await sendWhatsAppMessage(message.from, autoResponse);
  }
}

async function processMessageStatus(status: any): Promise<void> {
  console.log(`Message ${status.id} status: ${status.status}`);
  
  // Handle delivery confirmations, read receipts, etc.
  // You could update message status in your database here
}

// Webhook verification for WhatsApp Business API
export function verifyWhatsAppWebhook(mode: string, token: string, challenge: string): string | null {
  const VERIFY_TOKEN = Deno.env.get("WHATSAPP_VERIFY_TOKEN") || "prestige_timepieces_verify_token";
  
  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("WhatsApp webhook verified successfully");
    return challenge;
  } else {
    console.warn("WhatsApp webhook verification failed");
    return null;
  }
}

// Business logic helpers
export async function sendWatchInquiryNotification(watchDetails: any, customerInfo: any): Promise<void> {
  const message = `🔔 New Watch Inquiry
  
Watch: ${watchDetails.brand} ${watchDetails.model}
Reference: ${watchDetails.reference}
Price: ${watchDetails.price?.toLocaleString()}

Customer: ${customerInfo.name}
Email: ${customerInfo.email}
Phone: ${customerInfo.phone || 'Not provided'}

Message: ${customerInfo.message}

Reply to this customer promptly! 💼`;

  await sendWhatsAppNotification(message);
}

export async function sendSellSubmissionNotification(submission: any): Promise<void> {
  const message = `💰 New Sell Submission
  
Watch Details:
• Brand: ${submission.brand}
• Model: ${submission.model}
• Reference: ${submission.reference || 'Not specified'}
• Year: ${submission.year || 'Not specified'}
• Condition: ${submission.condition}
• Accessories: ${submission.accessories || 'Not specified'}

Customer: ${submission.customer_name}
Email: ${submission.customer_email}
Phone: ${submission.customer_phone}

${submission.description ? `Description: ${submission.description}` : ''}

Provide quote and contact customer! 📞`;

  await sendWhatsAppNotification(message);
}

export async function sendQuoteUpdateNotification(submission: any, quote: number, notes?: string): Promise<void> {
  const message = `💵 Quote Ready for ${submission.customer_name}

Watch: ${submission.brand} ${submission.model}
Our Offer: ${quote.toLocaleString()}

${notes ? `Notes: ${notes}` : ''}

Customer Contact:
📧 ${submission.customer_email}
📱 ${submission.customer_phone}

Follow up with the customer! 📞`;

  await sendWhatsAppNotification(message);
}

// Rate limiting for outbound messages
const messageQueue: Array<() => Promise<void>> = [];
let isProcessingQueue = false;
const MESSAGE_RATE_LIMIT = 1000; // 1 message per second

export async function queueWhatsAppMessage(messageFunction: () => Promise<void>): Promise<void> {
  messageQueue.push(messageFunction);
  
  if (!isProcessingQueue) {
    await processMessageQueue();
  }
}

async function processMessageQueue(): Promise<void> {
  isProcessingQueue = true;
  
  while (messageQueue.length > 0) {
    const messageFunction = messageQueue.shift();
    if (messageFunction) {
      try {
        await messageFunction();
        await new Promise(resolve => setTimeout(resolve, MESSAGE_RATE_LIMIT));
      } catch (error) {
        console.error("Queued message failed:", error);
      }
    }
  }
  
  isProcessingQueue = false;
}

// Analytics and reporting
export interface WhatsAppAnalytics {
  messagesSent: number;
  messagesDelivered: number;
  messagesRead: number;
  messagesFailed: number;
  responseRate: number;
  averageResponseTime: number;
}

export async function getWhatsAppAnalytics(timeframe: "day" | "week" | "month" = "week"): Promise<WhatsAppAnalytics> {
  // In a real implementation, you'd query your database for message statistics
  // For now, return mock analytics
  return {
    messagesSent: 150,
    messagesDelivered: 145,
    messagesRead: 120,
    messagesFailed: 5,
    responseRate: 0.8, // 80%
    averageResponseTime: 1800 // 30 minutes in seconds
  };
}

// Error handling and retry logic
export async function sendWhatsAppWithRetry(
  to: string, 
  message: string, 
  maxRetries: number = 3,
  mediaUrl?: string
): Promise<WhatsAppResponse> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`WhatsApp send attempt ${attempt}/${maxRetries} to ${to}`);
      return await sendWhatsAppMessage(to, message, mediaUrl);
    } catch (error) {
      lastError = error as Error;
      console.error(`WhatsApp send attempt ${attempt} failed:`, error);
      
      if (attempt < maxRetries) {
        // Exponential backoff: wait 2^attempt seconds
        const waitTime = Math.pow(2, attempt) * 1000;
        console.log(`Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }
  
  throw new Error(`WhatsApp send failed after ${maxRetries} attempts. Last error: ${lastError?.message}`);
}

// Message formatting helpers
export function formatWatchMessage(watch: any): string {
  return `⌚ ${watch.brand} ${watch.model}

📋 Reference: ${watch.reference}
📅 Year: ${watch.year || 'N/A'}
🏆 Condition: ${watch.condition}
💰 Price: ${watch.price?.toLocaleString()}

${watch.description}

${watch.accessories ? `📦 Includes: ${watch.accessories}` : ''}

Interested? Reply to this message or call us! 📞`;
}

export function formatInquiryResponse(customerName: string, watchInfo?: any): string {
  let message = `Hi ${customerName}! 👋

Thank you for your inquiry about our luxury timepieces. `;

  if (watchInfo) {
    message += `I see you're interested in the ${watchInfo.brand} ${watchInfo.model}. `;
  }

  message += `Our team of watch experts will review your request and respond within 24 hours with detailed information and pricing.

For immediate assistance:
📞 Call: +1-234-567-8900
📧 Email: info@prestigetimepieces.com
🌐 Visit: www.prestigetimepieces.com

Thank you for choosing Prestige Timepieces! 🏆`;

  return message;
}

// Bulk messaging capabilities
export async function sendBulkWhatsAppMessages(
  recipients: Array<{ phone: string; name: string; customMessage?: string }>,
  defaultMessage: string
): Promise<Array<{ phone: string; success: boolean; messageId?: string; error?: string }>> {
  const results: Array<{ phone: string; success: boolean; messageId?: string; error?: string }> = [];
  
  for (const recipient of recipients) {
    try {
      const message = recipient.customMessage || defaultMessage.replace("{name}", recipient.name);
      
      // Add to queue to respect rate limits
      await queueWhatsAppMessage(async () => {
        const response = await sendWhatsAppMessage(recipient.phone, message);
        results.push({
          phone: recipient.phone,
          success: true,
          messageId: response.messageId
        });
      });
      
    } catch (error) {
      results.push({
        phone: recipient.phone,
        success: false,
        error: (error as Error).message
      });
    }
  }
  
  return results;
}

// Configuration validation
export function validateWhatsAppConfig(): { valid: boolean; issues: string[] } {
  const issues: string[] = [];
  
  if (!WHATSAPP_BUSINESS_NUMBER) {
    issues.push("WHATSAPP_BUSINESS_NUMBER not configured");
  }
  
  if (WHATSAPP_PROVIDER === "twilio") {
    if (!TWILIO_ACCOUNT_SID) issues.push("TWILIO_ACCOUNT_SID not configured");
    if (!TWILIO_AUTH_TOKEN) issues.push("TWILIO_AUTH_TOKEN not configured");
    if (!TWILIO_WHATSAPP_NUMBER) issues.push("TWILIO_WHATSAPP_NUMBER not configured");
  } else if (WHATSAPP_PROVIDER === "meta") {
    if (!META_ACCESS_TOKEN) issues.push("META_ACCESS_TOKEN not configured");
    if (!META_PHONE_NUMBER_ID) issues.push("META_PHONE_NUMBER_ID not configured");
  }
  
  return {
    valid: issues.length === 0,
    issues
  };
}

// Export configuration info for admin panel
export function getWhatsAppConfig() {
  return {
    provider: WHATSAPP_PROVIDER,
    businessNumber: WHATSAPP_BUSINESS_NUMBER,
    configured: validateWhatsAppConfig().valid,
    supportedFeatures: {
      textMessages: true,
      mediaMessages: true,
      templateMessages: WHATSAPP_PROVIDER !== "mock",
      webhooks: WHATSAPP_PROVIDER !== "mock",
      bulkMessaging: true,
      analytics: true
    }
  };
}