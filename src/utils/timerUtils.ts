import { setStorage, getStorage } from "../utils/noteUtils";
import { Timer } from "../types/timer.types";

export async function startTimer(item: string, startTime: number) {
  const timers: Timer[] = (await getStorage<Timer[]>("timers")) || [];
  for (const i of timers) {
    if (i.item === item) {
      return;
    }
  }

  const timer: Timer = {
    item,
    startTime,
    isStop: false,
    time: 0,
  };
  timers.push(timer);
  await setStorage({ timers });
}

export async function startCountdownFromStorage(itemMap: Map<string, any>) {
  if (
    itemMap.has("countIntervalRef") &&
    itemMap.get("countIntervalRef") !== null
  ) {
    return;
  }
  const timers = (await getStorage<Timer[]>("timers")) || [];
  const targetTimer = timers.find(
    (timer) => timer.item === itemMap.get("item")
  );
  if (!targetTimer) return;
  if (!targetTimer.isStop) {
    let nowTime = Math.floor((Date.now() - targetTimer.startTime) / 1000);
    itemMap.set("time", nowTime);
  }

  targetTimer.isStop = false;
  await setStorage({ timers });

  const countIntervalRef = window.setInterval(async () => {
    const totalSeconds = itemMap.get("time");
    const minute = Math.floor(totalSeconds / 60);
    const second = totalSeconds % 60;

    itemMap.get("timerDisplay").textContent =
      `${String(minute).padStart(2, "0")}:${String(second).padStart(2, "0")}`;

    itemMap.set("time", totalSeconds + 1);
  }, 1000);
  itemMap.set("countIntervalRef", countIntervalRef);
}

export function pauseTime(itemMap: Map<string, any>) {
  return async () => {
    if (itemMap.get("countIntervalRef") !== null) {
      clearInterval(itemMap.get("countIntervalRef"));
      itemMap.set("countIntervalRef", null);

      const timers: Timer[] = (await getStorage<Timer[]>("timers")) || [];
      if (timers.length === 0) return;
      const targetTimer = timers.find(
        (timer) => timer.item === itemMap.get("item")
      );
      if (!targetTimer) return;

      targetTimer.isStop = true;
      targetTimer.time = itemMap.get("time");
      await setStorage({ timers });
    }
  };
}

export function removeTimer(itemMap: Map<string, any>) {
  return async () => {
    if (itemMap.get("countIntervalRef")) {
      clearInterval(itemMap.get("countIntervalRef"));
      itemMap.delete("countIntervalRef");
    }

    itemMap.set("time", 0);
    itemMap.get("timerDisplay").textContent = "00:00";
    itemMap.set("countIntervalRef", null);
    const timers: Timer[] = (await getStorage<Timer[]>("timers")) || [];
    const target = timers.find((timer) => timer.item === itemMap.get("item"));
    if (!target) return;
    target.time = 0;
    target.isStop = true;
    target.startTime = Date.now();
    await setStorage({ timers });
  };
}

export async function deleteTimer(itemMap: Map<string, any>) {
  const timers: Timer[] = (await getStorage<Timer[]>("timers")) || [];
  const targetIndex = timers.findIndex(
    (timer) => timer.item === itemMap.get("item")
  );
  if (targetIndex !== -1) {
    timers.splice(targetIndex, 1);
    await setStorage({ timers });
  }
}
