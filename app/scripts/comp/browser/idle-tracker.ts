import { Events } from 'util/events';
import { AppSettings } from 'models/app-settings';

const IdleTracker = {
    actionTime: Date.now(),
    init(): void {
        setInterval(this.checkIdle.bind(this), 1000 * 60);
    },
    checkIdle(): void {
        const idleMinutes = (Date.now() - this.actionTime) / 1000 / 60;
        const maxIdleMinutes = AppSettings.idleMinutes;
        if (maxIdleMinutes && idleMinutes > maxIdleMinutes) {
            Events.emit('before-user-idle');
            Events.emit('user-idle');
        }
    },
    regUserAction(): void {
        this.actionTime = Date.now();
    }
};

Events.on('power-monitor-resume', () => IdleTracker.checkIdle());

export { IdleTracker };
