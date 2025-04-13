import { setStorage, getStorage } from "../utils/noteUtils";
import { Timer } from "../types/timer.types";

export async function startTimer(item: string, startTime: number) {
  const timers: Timer[] = (await getStorage<Timer[]>("timers")) || [];
  const timer = {
    item,
    startTime,
  };
  timers.push(timer);
  await setStorage({ timers });
  return;
}

export function startCountdown(
  startTime: number,
  countInterval: number | null,
  DURATION: number,
  timer: HTMLDivElement
) {
  if (countInterval) clearInterval(countInterval);

  countInterval = window.setInterval(() => {
    const now = Date.now();
    const elapsedMs = now - startTime;
    let totalResSeconds = DURATION - Math.floor(elapsedMs / 1000);
    if (totalResSeconds < 0) totalResSeconds = 0;

    const minute = Math.floor(totalResSeconds / 60);
    const second = totalResSeconds % 60;

    timer.textContent = `${String(minute).padStart(2, "0")}:${String(
      second
    ).padStart(2, "0")}`;

    if (totalResSeconds === 0) {
      clearInterval(countInterval!);
      countInterval = null;
    }
  }, 1000);
}

export async function startCountdownFromStorage(
  countInterval: number | null,
  DURATION: number,
  timer: HTMLDivElement
) {
  const timers: Timer[] = (await getStorage<Timer[]>("timers")) || [];

  let startTime: number;

  if (timers.length > 0) {
    startTime = timers[0].startTime;
  } else {
    startTime = Date.now();
    await startTimer("test", startTime);
  }

  startCountdown(startTime, countInterval, DURATION, timer);
}
