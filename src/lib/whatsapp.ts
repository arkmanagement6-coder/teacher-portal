import { DbClient } from './db';

export interface WhatsAppTemplate {
  name: string;
  body: string;
}

export const WHATSAPP_TEMPLATES = {
  due_reminder: {
    name: 'Fee Due Reminder',
    body: 'Dear Parent, Monthly fee of ₹{amount} for {student_name} is due on {due_date}. Please pay using this link: {link}'
  },
  overdue_reminder: {
    name: 'Fee Overdue Reminder',
    body: 'ALERT: Fee of ₹{amount} for {student_name} was due on {due_date} and is now overdue by {days_overdue} days. Please clear it immediately: {link}'
  },
  payment_success: {
    name: 'Payment Success Message',
    body: 'Thank you! We have received your payment of ₹{amount} for {student_name}\'s fee. Order ID: {order_id}.'
  },
  class_reminder: {
    name: 'Class Reminder',
    body: 'Reminder: The class for {batch_name} is scheduled today at {timings}. Please ensure {student_name} attends.'
  },
  attendance_alert: {
    name: 'Attendance Alert',
    body: 'Dear Parent, {student_name} was marked {attendance_status} in the class held on {date}.'
  }
};

export class WhatsAppService {
  static getMessageText(
    type: keyof typeof WHATSAPP_TEMPLATES,
    vars: {
      student_name: string;
      amount?: number;
      due_date?: string;
      days_overdue?: number;
      link?: string;
      order_id?: string;
      batch_name?: string;
      timings?: string;
      attendance_status?: string;
      date?: string;
    }
  ): string {
    let body = WHATSAPP_TEMPLATES[type].body;
    body = body.replace(/{student_name}/g, vars.student_name);
    body = body.replace(/{amount}/g, String(vars.amount || '0'));
    body = body.replace(/{due_date}/g, vars.due_date || '');
    body = body.replace(/{days_overdue}/g, String(vars.days_overdue || '0'));
    body = body.replace(/{link}/g, vars.link || 'https://rzp.io/l/mockpay');
    body = body.replace(/{order_id}/g, vars.order_id || '');
    body = body.replace(/{batch_name}/g, vars.batch_name || '');
    body = body.replace(/{timings}/g, vars.timings || '');
    body = body.replace(/{attendance_status}/g, vars.attendance_status || '');
    body = body.replace(/{date}/g, vars.date || '');
    return body;
  }

  static async sendWhatsApp(
    academyId: string,
    studentId: string,
    type: keyof typeof WHATSAPP_TEMPLATES,
    variables: Parameters<typeof WhatsAppService.getMessageText>[1]
  ): Promise<{ success: boolean; logId: string; message: string }> {
    const message = this.getMessageText(type, variables);
    const log = await DbClient.triggerWhatsAppReminder(academyId, studentId, type, message);
    
    // In production mode, we would call the WhatsApp Business API endpoint here
    console.log(`[WhatsApp Production Send] To: ${log.sent_to}, Message: ${message}`);
    
    return {
      success: log.status === 'delivered',
      logId: log.id,
      message
    };
  }
}
