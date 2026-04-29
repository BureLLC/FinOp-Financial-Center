// Market hours utility — all times in ET (America/New_York)

export type MarketStatus = {
  label: string;
  color: string;
  rgb: string;
  bg: string;
  border: string;
  detail: string;
};

function getETTime(): { day: number; hour: number; minute: number } {
  const now = new Date();
  const et = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
  return {
    day: et.getDay(),      // 0=Sun, 1=Mon, ..., 6=Sat
    hour: et.getHours(),
    minute: et.getMinutes(),
  };
}

function toMinutes(hour: number, minute: number): number {
  return hour * 60 + minute;
}

export function getMarketStatus(): MarketStatus {
  const { day, hour, minute } = getETTime();
  const now = toMinutes(hour, minute);

  const isWeekday = day >= 1 && day <= 5;
  const isSaturday = day === 6;
  const isSunday = day === 0;

  // Equities: Mon–Fri 9:30 AM – 4:00 PM ET
  const equityOpen  = toMinutes(9, 30);
  const equityClose = toMinutes(16, 0);
  const equityPremarket = toMinutes(4, 0);
  const equityAfterHours = toMinutes(20, 0);

  // Futures: Sun 6 PM ET – Fri 5 PM ET, 1hr break 5–6 PM ET daily
  const futuresBreakStart = toMinutes(17, 0);
  const futuresBreakEnd   = toMinutes(18, 0);
  const futuresSundayOpen = toMinutes(18, 0);
  const futuresFridayClose = toMinutes(17, 0);

  // Crypto: always open
  // Forex: Sun 5 PM – Fri 5 PM ET

  const isEquityOpen = isWeekday && now >= equityOpen && now < equityClose;
  const isPremarket  = isWeekday && now >= equityPremarket && now < equityOpen;
  const isAfterHours = isWeekday && now >= equityClose && now < equityAfterHours;

  const isFuturesOpen = (() => {
    if (isSaturday) return false;
    if (isSunday) return now >= futuresSundayOpen;
    if (day === 5) return now < futuresFridayClose; // Friday close at 5 PM
    // Mon–Thu: open except 5–6 PM break
    if (isWeekday) return !(now >= futuresBreakStart && now < futuresBreakEnd);
    return false;
  })();

  const isForexOpen = (() => {
    if (isSaturday) return false;
    if (isSunday) return now >= toMinutes(17, 0);
    if (day === 5) return now < toMinutes(17, 0);
    return true;
  })();

  // Crypto always open
  if (isEquityOpen) {
    return {
      label: "MARKETS OPEN",
      color: "#22c55e",
      rgb: "34,197,94",
      bg: "rgba(34,197,94,0.08)",
      border: "rgba(34,197,94,0.2)",
      detail: "Equities · Futures · Forex · Options · Crypto",
    };
  }

  if (isPremarket) {
    return {
      label: "PRE-MARKET",
      color: "#f59e0b",
      rgb: "245,158,11",
      bg: "rgba(245,158,11,0.08)",
      border: "rgba(245,158,11,0.2)",
      detail: `4:00–9:30 AM ET · Futures ${isFuturesOpen ? "open" : "closed"} · Crypto 24/7`,
    };
  }

  if (isAfterHours) {
    return {
      label: "AFTER HOURS",
      color: "#f59e0b",
      rgb: "245,158,11",
      bg: "rgba(245,158,11,0.08)",
      border: "rgba(245,158,11,0.2)",
      detail: `4:00–8:00 PM ET · Futures ${isFuturesOpen ? "open" : "closed"} · Crypto 24/7`,
    };
  }

  if (isFuturesOpen || isForexOpen) {
    return {
      label: "FUTURES & FOREX OPEN",
      color: "#38bdf8",
      rgb: "56,189,248",
      bg: "rgba(56,189,248,0.08)",
      border: "rgba(56,189,248,0.2)",
      detail: `Equities closed · ${isFuturesOpen ? "Futures open" : ""} · ${isForexOpen ? "Forex open" : ""} · Crypto 24/7`,
    };
  }

  // Weekend — only crypto open
  return {
    label: "MARKETS CLOSED",
    color: "#ef4444",
    rgb: "239,68,68",
    bg: "rgba(239,68,68,0.08)",
    border: "rgba(239,68,68,0.2)",
    detail: "Equities · Futures · Forex closed · Crypto 24/7",
  };
}
