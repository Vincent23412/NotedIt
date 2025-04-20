import { setStorage, getStorage } from "../utils/noteUtils";
import { Timer } from "../types/timer.types";

export async function startTimer(item: string, startTime: number) {
  const timers: Timer[] = (await getStorage<Timer[]>("timers")) || [];
  const timer: Timer = {
    item,
    startTime,
    isStop: false,
    time: 0,
  };
  timers.push(timer);
  await setStorage({ timers });
}

export function startCountdown(
  timeRef: { value: number },
  countIntervalRef: { id: number | null },
  timerDisplay: HTMLDivElement
) {
  if (countIntervalRef.id !== null) return;

  countIntervalRef.id = window.setInterval(() => {
    const totalSeconds = timeRef.value;
    const minute = Math.floor(totalSeconds / 60);
    const second = totalSeconds % 60;

    timerDisplay.textContent = `${String(minute).padStart(2, "0")}:${String(
      second
    ).padStart(2, "0")}`;

    timeRef.value++;
  }, 1000);
}

export async function startCountdownFromStorage(
  countIntervalRef: { id: number | null },
  timerDisplay: HTMLDivElement,
  timeRef: { value: number }
) {
  let timers: Timer[] = (await getStorage<Timer[]>("timers")) || [];

  if (timers.length === 0) {
    await startTimer("test", Math.floor(Date.now() / 1000));
    timers = (await getStorage<Timer[]>("timers")) || [];
  }

  if (timers[0].isStop) {
    timeRef.value = timers[0].time;
    timers[0].isStop = false;
    await setStorage({ timers });
  } else {
    timeRef.value = Math.floor(Date.now() / 1000 - timers[0].startTime);
  }

  startCountdown(timeRef, countIntervalRef, timerDisplay);
}

export function pauseTime(
  countIntervalRef: { id: number | null },
  timeRef: { value: number }
) {
  return async () => {
    if (countIntervalRef.id !== null) {
      clearInterval(countIntervalRef.id);
      countIntervalRef.id = null;
    }

    const timers: Timer[] = (await getStorage<Timer[]>("timers")) || [];
    if (timers.length === 0) return;

    timers[0].isStop = true;
    timers[0].time = timeRef.value;
    await setStorage({ timers });
  };
}

export function removeTimer(
  countIntervalRef: { id: number | null },
  timerDisplay: HTMLDivElement
) {
  return async () => {
    if (countIntervalRef.id) {
      clearInterval(countIntervalRef.id);
    }
    await chrome.storage.local.remove("timers");
    timerDisplay.textContent = "00:00";
  };
}
