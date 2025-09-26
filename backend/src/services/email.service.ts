import nodemailer from 'nodemailer';
import { User } from '@prisma/client';
import { getEmailConfig, isProduction } from '../lib/config';
import { EmailNotification } from '../types';

export class EmailService {
  private transporter: nodemailer.Transporter;
  private config = getEmailConfig();

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: this.config.host,
      port: this.config.port,
      secure: this.config.secure,
      auth: this.config.auth,
      // Add additional options for better reliability
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
      rateDelta: 1000,
      rateLimit: 5,
    });

    // Verify connection configuration in development
    if (!isProduction()) {
      this.verifyConnection();
    }
  }

  /**
   * Verify SMTP connection
   */
  private async verifyConnection(): Promise<void> {
    try {
      await this.transporter.verify();
      console.log('SMTP connection verified successfully');
    } catch (error) {
      console.error('SMTP connection verification failed:', error);
    }
  }

  /**
   * Send registration confirmation email
   */
  async sendRegistrationConfirmation(user: User): Promise<void> {
    const subject = 'Welcome to JamAlert - Registration Confirmed';
    const html = this.generateRegistrationConfirmationHtml(user);
    const text = this.generateRegistrationConfirmationText(user);

    await this.sendEmail({
      to: user.email,
      subject,
      html,
      text,
    });
  }

  /**
   * Send alert notification email
   */
  async sendAlertNotification(notification: EmailNotification): Promise<void> {
    const subject = `${notification.severity.toUpperCase()} ALERT: ${notification.title}`;
    const html = this.generateAlertNotificationHtml(notification);
    const text = this.generateAlertNotificationText(notification);

    await this.sendEmail({
      to: notification.to,
      subject,
      html,
      text,
    });
  }

  /**
   * Send generic email
   */
  private async sendEmail(options: {
    to: string;
    subject: string;
    html: string;
    text: string;
  }): Promise<void> {
    try {
      const mailOptions = {
        from: {
          name: this.config.from.name,
          address: this.config.from.email,
        },
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        // Add headers for better deliverability
        headers: {
          'X-Mailer': 'JamAlert System',
          'X-Priority': '1',
        },
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log(`Email sent successfully to ${options.to}:`, result.messageId);
    } catch (error) {
      console.error(`Failed to send email to ${options.to}:`, error);
      throw new Error(`Email delivery failed: ${error.message}`);
    }
  }

  /**
   * Generate registration confirmation HTML
   */
  private generateRegistrationConfirmationHtml(user: User): string {
    const parishName = this.formatParishName(user.parish);
    
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to JamAlert</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #1e40af, #3b82f6); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
        .alert-box { background: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
        .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 15px 0; }
        .emergency-contacts { background: #fef2f2; border: 1px solid #fecaca; padding: 15px; border-radius: 6px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🚨 Welcome to JamAlert</h1>
        <p>Your Community Safety Network</p>
      </div>
      
      <div class="content">
        <h2>Hello ${user.firstName}!</h2>
        
        <p>Thank you for registering with JamAlert, Jamaica's community-powered emergency alert system. Your registration has been confirmed for <strong>${parishName}</strong>.</p>
        
        <div class="alert-box">
          <h3>📱 Your Alert Preferences:</h3>
          <ul>
            <li>Email Alerts: ${user.emailAlerts ? '✅ Enabled' : '❌ Disabled'}</li>
            <li>SMS Alerts: ${user.smsAlerts ? '✅ Enabled' : '❌ Disabled'}</li>
            <li>Emergency Only: ${user.emergencyOnly ? '✅ Yes' : '❌ No'}</li>
          </ul>
        </div>
        
        <h3>🌊 What You Can Expect:</h3>
        <ul>
          <li><strong>Real-time Flood Alerts:</strong> Immediate notifications when flooding is detected in your parish</li>
          <li><strong>Weather Warnings:</strong> Advanced notice of severe weather conditions</li>
          <li><strong>Community Reports:</strong> Verified incident reports from your neighbors</li>
          <li><strong>Emergency Guidance:</strong> Clear, actionable safety instructions</li>
        </ul>
        
        <div class="emergency-contacts">
          <h3>🚨 Emergency Contacts:</h3>
          <p><strong>Always keep these numbers handy:</strong></p>
          <ul>
            <li>Police: <strong>119</strong></li>
            <li>Fire: <strong>110</strong></li>
            <li>Emergency Services: <strong>911</strong></li>
            <li>ODPEM: <strong>116</strong></li>
          </ul>
        </div>
        
        <p>You can update your preferences or report incidents anytime by visiting our website.</p>
        
        <p>Stay safe, stay informed!</p>
        
        <p><strong>The JamAlert Team</strong></p>
      </div>
      
      <div class="footer">
        <p>This email was sent to ${user.email} because you registered for JamAlert notifications.</p>
        <p>JamAlert - Keeping Jamaica Safe, One Alert at a Time</p>
      </div>
    </body>
    </html>
    `;
  }

  /**
   * Generate registration confirmation plain text
   */
  private generateRegistrationConfirmationText(user: User): string {
    const parishName = this.formatParishName(user.parish);
    
    return `
Welcome to JamAlert - Your Community Safety Network

Hello ${user.firstName}!

Thank you for registering with JamAlert, Jamaica's community-powered emergency alert system. Your registration has been confirmed for ${parishName}.

Your Alert Preferences:
- Email Alerts: ${user.emailAlerts ? 'Enabled' : 'Disabled'}
- SMS Alerts: ${user.smsAlerts ? 'Enabled' : 'Disabled'}
- Emergency Only: ${user.emergencyOnly ? 'Yes' : 'No'}

What You Can Expect:
- Real-time Flood Alerts: Immediate notifications when flooding is detected in your parish
- Weather Warnings: Advanced notice of severe weather conditions
- Community Reports: Verified incident reports from your neighbors
- Emergency Guidance: Clear, actionable safety instructions

Emergency Contacts (Always keep these numbers handy):
- Police: 119
- Fire: 110
- Emergency Services: 911
- ODPEM: 116

You can update your preferences or report incidents anytime by visiting our website.

Stay safe, stay informed!

The JamAlert Team

---
This email was sent to ${user.email} because you registered for JamAlert notifications.
JamAlert - Keeping Jamaica Safe, One Alert at a Time
    `;
  }

  /**
   * Generate alert notification HTML
   */
  private generateAlertNotificationHtml(notification: EmailNotification): string {
    const severityColor = this.getSeverityColor(notification.severity);
    const severityIcon = this.getSeverityIcon(notification.severity);
    
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${notification.title}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: ${severityColor}; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
        .alert-message { background: white; border-left: 4px solid ${severityColor}; padding: 20px; margin: 20px 0; border-radius: 4px; }
        .parishes { background: #f1f5f9; padding: 15px; border-radius: 6px; margin: 15px 0; }
        .emergency-contacts { background: #fef2f2; border: 1px solid #fecaca; padding: 15px; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${severityIcon} ${notification.severity.toUpperCase()} ALERT</h1>
        <h2>${notification.title}</h2>
      </div>
      
      <div class="content">
        <div class="alert-message">
          <p><strong>Alert Message:</strong></p>
          <p>${notification.message}</p>
        </div>
        
        <div class="parishes">
          <p><strong>Affected Areas:</strong> ${notification.parishes.map(p => this.formatParishName(p)).join(', ')}</p>
        </div>
        
        <div class="emergency-contacts">
          <h3>🚨 Emergency Contacts:</h3>
          <ul>
            <li>Police: <strong>119</strong></li>
            <li>Fire: <strong>110</strong></li>
            <li>Emergency Services: <strong>911</strong></li>
            <li>ODPEM: <strong>116</strong></li>
          </ul>
        </div>
        
        <p><strong>Stay safe and follow official guidance.</strong></p>
      </div>
      
      <div class="footer">
        <p>This alert was sent by JamAlert Emergency Notification System</p>
        <p>Alert ID: ${notification.alertId}</p>
      </div>
    </body>
    </html>
    `;
  }

  /**
   * Generate alert notification plain text
   */
  private generateAlertNotificationText(notification: EmailNotification): string {
    return `
${notification.severity.toUpperCase()} ALERT: ${notification.title}

Alert Message:
${notification.message}

Affected Areas: ${notification.parishes.map(p => this.formatParishName(p)).join(', ')}

Emergency Contacts:
- Police: 119
- Fire: 110
- Emergency Services: 911
- ODPEM: 116

Stay safe and follow official guidance.

---
This alert was sent by JamAlert Emergency Notification System
Alert ID: ${notification.alertId}
    `;
  }

  /**
   * Format parish name for display
   */
  private formatParishName(parish: string): string {
    return parish
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  /**
   * Get severity color
   */
  private getSeverityColor(severity: string): string {
    switch (severity.toLowerCase()) {
      case 'high': return '#dc2626';
      case 'medium': return '#d97706';
      case 'low': return '#059669';
      default: return '#3b82f6';
    }
  }

  /**
   * Get severity icon
   */
  private getSeverityIcon(severity: string): string {
    switch (severity.toLowerCase()) {
      case 'high': return '🚨';
      case 'medium': return '⚠️';
      case 'low': return 'ℹ️';
      default: return '📢';
    }
  }

  /**
   * Test email configuration
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error('Email service test failed:', error);
      return false;
    }
  }

  /**
   * Close email service
   */
  async close(): Promise<void> {
    this.transporter.close();
  }
}