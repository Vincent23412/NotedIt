import { setStorage, getStorage } from "../utils/noteUtils";
import { Timer } from "../types/timer.types";

const DURATION = 30 * 60; // 預設倒數時間

export async function startTimer(
  item: string,
  startTime: number,
  duration: number
) {
  const timers: Timer[] = (await getStorage<Timer[]>("timers")) || [];
  const timer: Timer = {
    item,
    startTime,
    isStop: false,
    stopTime: 0,
    resTime: duration,
  };
  timers.push(timer);
  await setStorage({ timers });
}

export function startCountdown(
  resTimeRef: { value: number },
  countIntervalRef: { id: number | null },
  timerDisplay: HTMLDivElement
) {
  if (countIntervalRef.id !== null) {
    clearInterval(countIntervalRef.id);
  }

  countIntervalRef.id = window.setInterval(() => {
    let totalResSeconds = resTimeRef.value;
    if (totalResSeconds < 0) totalResSeconds = 0;

    const minute = Math.floor(totalResSeconds / 60);
    const second = totalResSeconds % 60;

    timerDisplay.textContent = `${String(minute).padStart(2, "0")}:${String(
      second
    ).padStart(2, "0")}`;

    if (totalResSeconds === 0) {
      clearInterval(countIntervalRef.id!);
      countIntervalRef.id = null;
    }

    resTimeRef.value--;
  }, 1000);
}

export async function startCountdownFromStorage(
  countIntervalRef: { id: number | null },
  timerDisplay: HTMLDivElement,
  resTimeRef: { value: number }
) {
  const timers: Timer[] = (await getStorage<Timer[]>("timers")) || [];

  if (timers.length > 0 && timers[0].isStop === false) {
    resTimeRef.value =
      DURATION - Math.floor((Date.now() - timers[0].startTime) / 1000);
    timers[0].resTime = resTimeRef.value;
    await setStorage({ timers });
  } else if (timers.length > 0 && timers[0].isStop === true) {
    resTimeRef.value = Math.floor(timers[0].resTime);
  } else {
    const startTime = Date.now();
    await startTimer("test", startTime, DURATION);
    resTimeRef.value = DURATION;
  }

  startCountdown(resTimeRef, countIntervalRef, timerDisplay);
}

export function pauseTime(
  countIntervalRef: { id: number | null },
  resTimeRef: { value: number }
) {
  return async () => {
    if (countIntervalRef.id !== null) {
      clearInterval(countIntervalRef.id);
      countIntervalRef.id = null;
    }

    const timers: Timer[] = (await getStorage<Timer[]>("timers")) || [];
    if (timers.length === 0) return;

    timers[0].isStop = true;
    timers[0].resTime = resTimeRef.value;
    await setStorage({ timers });
  };
}
