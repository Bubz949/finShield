import { storage } from './storage';
import { chatService } from './chat-service';

export class ReminderService {
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;

  start() {
    if (this.isRunning) {
      console.log('Reminder service is already running');
      return;
    }

    this.isRunning = true;
    console.log('Starting reminder service...');

    // Check for reminders every hour
    this.intervalId = setInterval(async () => {
      await this.processReminders();
    }, 60 * 60 * 1000); // 1 hour

    // Run immediately on start
    this.processReminders();
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('Reminder service stopped');
  }

  private async processReminders() {
    try {
      console.log('Processing situation reminders...');
      
      const situationsNeedingReminders = await storage.getSituationsNeedingReminders();
      
      for (const situation of situationsNeedingReminders) {
        await this.createSituationReminder(situation);
        
        // Update last reminder sent
        await storage.updateSituation(situation.id, {
          lastReminderSent: new Date()
        });
      }

      if (situationsNeedingReminders.length > 0) {
        console.log(`Created ${situationsNeedingReminders.length} situation reminders`);
      }
    } catch (error) {
      console.error('Error processing reminders:', error);
    }
  }

  private async createSituationReminder(situation: any) {
    const daysSinceStart = Math.floor(
      (new Date().getTime() - situation.startDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    let title = '';
    let description = '';

    switch (situation.situationType) {
      case 'hospital':
        title = 'Hospital Stay Status Check';
        description = `It's been ${daysSinceStart} days since you mentioned being in the hospital. Are you still there? If not, click here to update your status so we can adjust your spending monitoring.`;
        break;
      
      case 'travel':
        title = 'Travel Status Check';
        description = `It's been ${daysSinceStart} days since you mentioned traveling. Are you still away from home? Click here to update your travel status.`;
        break;
      
      case 'recovery':
        title = 'Recovery Status Check';
        description = `It's been ${daysSinceStart} days since you mentioned being in recovery. How are you feeling? Click here to update your recovery status.`;
        break;
      
      default:
        title = `${situation.situationType.charAt(0).toUpperCase() + situation.situationType.slice(1)} Status Check`;
        description = `It's been ${daysSinceStart} days since you updated your situation. Are you still in the same circumstances? Click here to update your status.`;
    }

    await storage.createAlert({
      userId: situation.userId,
      alertType: 'situation_reminder',
      severity: 'low',
      title,
      description
    });
  }

  // Manual trigger for testing
  async triggerReminders() {
    await this.processReminders();
  }
}

export const reminderService = new ReminderService();