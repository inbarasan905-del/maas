// Real-time 8-Hour Work Tracker Engine

const REQUIRED_SECONDS = 8 * 3600; // 28,800 seconds
let activeTimerInterval = null;

export function formatHHMMSS(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;
  return [
    hours.toString().padStart(2, '0'),
    minutes.toString().padStart(2, '0'),
    seconds.toString().padStart(2, '0')
  ].join(':');
}

export function formatDurationHuman(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  }
  return `${minutes}m ${seconds}s`;
}

export function formatTimeOnly(isoString) {
  if (!isoString) return '--:--';
  const d = new Date(isoString);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function calculateLiveAttendance(record) {
  if (!record || !record.checkIn) {
    return {
      netWorkedSeconds: 0,
      totalBreakSeconds: 0,
      remainingSeconds: REQUIRED_SECONDS,
      percent: 0,
      isOvertime: false,
      overtimeSeconds: 0,
      isOnBreak: false,
      formattedTime: '00:00:00',
      formattedRemaining: '8h 00m 00s'
    };
  }

  const checkInMs = new Date(record.checkIn).getTime();
  const endMs = record.checkOut ? new Date(record.checkOut).getTime() : Date.now();
  const totalElapsed = Math.max(0, Math.floor((endMs - checkInMs) / 1000));

  let currentBreakSeconds = record.totalBreakSeconds || 0;
  if (record.isOnBreak && record.breakStartTime) {
    const ongoingBreak = Math.max(0, Math.floor((Date.now() - new Date(record.breakStartTime).getTime()) / 1000));
    currentBreakSeconds += ongoingBreak;
  }

  const netWorkedSeconds = Math.max(0, totalElapsed - currentBreakSeconds);
  const remainingSeconds = Math.max(0, REQUIRED_SECONDS - netWorkedSeconds);
  const isOvertime = netWorkedSeconds > REQUIRED_SECONDS;
  const overtimeSeconds = isOvertime ? netWorkedSeconds - REQUIRED_SECONDS : 0;
  const percent = Math.min(100, Math.round((netWorkedSeconds / REQUIRED_SECONDS) * 100));

  return {
    netWorkedSeconds,
    totalBreakSeconds: currentBreakSeconds,
    remainingSeconds,
    percent,
    isOvertime,
    overtimeSeconds,
    isOnBreak: !!record.isOnBreak,
    isCompleted: !!record.checkOut || netWorkedSeconds >= REQUIRED_SECONDS,
    formattedTime: formatHHMMSS(netWorkedSeconds),
    formattedBreak: formatHHMMSS(currentBreakSeconds),
    formattedRemaining: formatDurationHuman(remainingSeconds),
    formattedOvertime: formatDurationHuman(overtimeSeconds)
  };
}

export function startLiveTracker(recordProvider, onTick) {
  stopLiveTracker();

  const update = () => {
    const record = typeof recordProvider === 'function' ? recordProvider() : recordProvider;
    const stats = calculateLiveAttendance(record);
    if (onTick) {
      onTick(stats, record);
    }
  };

  update();
  activeTimerInterval = setInterval(update, 1000);
}

export function stopLiveTracker() {
  if (activeTimerInterval) {
    clearInterval(activeTimerInterval);
    activeTimerInterval = null;
  }
}
