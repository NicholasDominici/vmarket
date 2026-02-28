'use client';

import { useEffect, useState } from 'react';
import { Clock, CircleDot } from 'lucide-react';

function getMarketStatus() {
  const now = new Date();
  const et = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const day = et.getDay();
  const hours = et.getHours();
  const minutes = et.getMinutes();
  const time = hours * 60 + minutes;

  const isWeekday = day >= 1 && day <= 5;
  const marketOpen = 9 * 60 + 30; // 9:30 AM ET
  const marketClose = 16 * 60; // 4:00 PM ET

  if (isWeekday && time >= marketOpen && time < marketClose) {
    const minsLeft = marketClose - time;
    const h = Math.floor(minsLeft / 60);
    const m = minsLeft % 60;
    return {
      isOpen: true,
      label: 'Market Open',
      countdown: `Closes in ${h}h ${m}m`,
      etTime: et.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'America/New_York' }),
    };
  }

  // Calculate next open
  let nextOpen = new Date(et);
  if (isWeekday && time >= marketClose) {
    nextOpen.setDate(nextOpen.getDate() + 1);
  } else if (day === 6) {
    nextOpen.setDate(nextOpen.getDate() + 2);
  } else if (day === 0) {
    nextOpen.setDate(nextOpen.getDate() + 1);
  }
  // Set to 9:30 AM
  nextOpen.setHours(9, 30, 0, 0);

  // Skip to Monday if next open lands on weekend
  while (nextOpen.getDay() === 0 || nextOpen.getDay() === 6) {
    nextOpen.setDate(nextOpen.getDate() + 1);
  }

  const diff = nextOpen.getTime() - et.getTime();
  const totalMins = Math.floor(diff / 60000);
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;

  return {
    isOpen: false,
    label: 'Market Closed',
    countdown: `Opens in ${h}h ${m}m`,
    etTime: et.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'America/New_York' }),
  };
}

export function MarketCalendar() {
  const [status, setStatus] = useState(getMarketStatus);

  useEffect(() => {
    const interval = setInterval(() => setStatus(getMarketStatus()), 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="border border-border rounded-md bg-card p-4">
      <div className="flex items-center gap-2 mb-2">
        <Clock className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-[11px] text-muted-foreground uppercase tracking-wider">Market Hours</span>
      </div>
      <div className="flex items-center gap-2">
        <CircleDot className={`w-3 h-3 ${status.isOpen ? 'text-data-positive animate-pulse' : 'text-data-negative'}`} />
        <span className={`text-sm font-semibold ${status.isOpen ? 'text-data-positive' : 'text-data-negative'}`}>
          {status.label}
        </span>
      </div>
      <div className="text-[11px] text-muted-foreground mt-1">{status.countdown}</div>
      <div className="text-[10px] text-muted-foreground/60 mt-0.5">ET: {status.etTime}</div>
    </div>
  );
}
