const cron = require('node-cron');
const { prisma } = require('../lib/prisma');
const { publishEvent } = require('../utils/eventBus');

/**
 * Parses a simple recurring schedule and calculates the next run.
 */
function getNextRun(scheduleType, startDate, lastRun) {
  const baseDate = lastRun || startDate;
  const next = new Date(baseDate);

  if (scheduleType === 'daily') {
    next.setDate(next.getDate() + 1);
  } else if (scheduleType === 'weekly') {
    next.setDate(next.getDate() + 7);
  } else if (scheduleType === 'monthly') {
    // Handle edge cases like 31st of Jan -> 28th/29th of Feb
    const currentDay = next.getDate();
    next.setMonth(next.getMonth() + 1);
    
    // If the month rolled over to +2 months (e.g. Jan 31 -> Mar 3), fix it
    if (next.getDate() < currentDay) {
      next.setDate(0); // Set to last day of previous month
    }
  } else {
    // Unsupported or custom
    return null;
  }
  return next;
}

async function runScheduler() {
  console.log('[Scheduler] Running task check...', new Date().toISOString());
  
  try {
    const now = new Date();
    
    // Get all active tasks
    const activeTasks = await prisma.recurringTask.findMany({
      where: {
        status: 'ACTIVE',
        OR: [
          { endDate: null },
          { endDate: { gt: now } }
        ]
      }
    });

    for (const task of activeTasks) {
      const nextRun = getNextRun(task.scheduleType, task.startDate, task.lastRunAt);
      
      if (nextRun && nextRun <= now) {
        try {
          // Attempt to create occurrence
          // Unique constraint on (recurringTaskId, scheduledFor) prevents duplicates
          await prisma.recurringTaskOccurrence.create({
            data: {
              recurringTaskId: task.id,
              scheduledFor: nextRun,
              status: 'PENDING'
            }
          });

          // Update task lastRunAt
          await prisma.recurringTask.update({
            where: { id: task.id },
            data: { lastRunAt: now }
          });

          // Notify Assignee
          if (task.assigneeId) {
            await publishEvent('recurring_task.generated', {
              entityType: 'RecurringTask',
              entityId: task.id,
              actorUserId: 'system',
              actorName: 'System',
              title: `Task Generated: ${task.title}`,
              description: `A new instance of the recurring task is due.`,
              moduleName: 'Operations',
              priority: 'High',
              actionUrl: `/admin/automation`,
              notify: true,
              assigneeId: task.assigneeId,
              notifyUsers: [task.assigneeId]
            });
          }

        } catch (err) {
          // Prisma code P2002 means unique constraint failed (already created by another instance)
          if (err.code === 'P2002') {
            console.log(`[Scheduler] Task ${task.id} occurrence already exists for ${nextRun}.`);
          } else {
            console.error(`[Scheduler] Error generating task ${task.id}:`, err);
          }
        }
      }
    }
  } catch (err) {
    console.error('[Scheduler] Error in runScheduler:', err);
  }
}

async function cleanupPastDates() {
  console.log('[Scheduler] Running past dates cleanup...', new Date().toISOString());
  try {
    const trips = await prisma.trip.findMany({ select: { id: true, availableDates: true }});
    
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;
    
    for (const trip of trips) {
      if (!trip.availableDates || !Array.isArray(trip.availableDates)) continue;
      
      const originalCount = trip.availableDates.length;
      const futureDates = trip.availableDates.filter(d => d.date >= todayStr);
      
      if (futureDates.length < originalCount) {
        await prisma.trip.update({
          where: { id: trip.id },
          data: { availableDates: futureDates }
        });
        console.log(`[Scheduler] Trip ${trip.id}: Removed ${originalCount - futureDates.length} past dates.`);
      }
    }
  } catch (err) {
    console.error('[Scheduler] Error in cleanupPastDates:', err);
  }
}

function startScheduler() {
  console.log('⏰ Scheduler initialized');
  
  // Existing hourly recurring tasks check
  cron.schedule('0 * * * *', () => {
    runScheduler();
  });

  // Daily cleanup of past trip dates at midnight
  cron.schedule('0 0 * * *', () => {
    cleanupPastDates();
  });
}

module.exports = { startScheduler, runScheduler, cleanupPastDates };
