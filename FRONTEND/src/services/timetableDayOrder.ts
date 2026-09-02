import { TimetableSlot } from '../types';

// World of a day-order timetable: a slot with `dayOrder` set applies ONLY to that
// day order; a slot with no `dayOrder` is the base timetable and applies to every
// day order unless a specific override exists.

// Effective slot for one (day, period) cell under a given day order.
export function slotForDayOrder(
  slots: TimetableSlot[],
  day: string,
  period: number,
  dayOrder: number | null | undefined
): TimetableSlot | undefined {
  const inScope = slots.filter((s) => s.day === day && s.periodNumber === period);
  if (dayOrder != null) {
    const specific = inScope.find((s) => s.dayOrder === dayOrder);
    if (specific) return specific;
    return inScope.find((s) => s.dayOrder == null) || undefined;
  }
  return inScope.find((s) => s.dayOrder == null) || inScope.find((s) => !!s.dayOrder) || undefined;
}

// Collapse a slot list to effective day-order slots (one per day + period) for the given day order.
export function filteredSlotsForDayOrder(
  slots: TimetableSlot[],
  dayOrder: number | null | undefined
): TimetableSlot[] {
  const map = new Map<string, TimetableSlot>();
  for (const s of slots) {
    const key = `${s.day}|${s.periodNumber}`;
    if (dayOrder != null) {
      if (s.dayOrder === dayOrder) {
        map.set(key, s);
      } else if (s.dayOrder == null && !map.has(key)) {
        map.set(key, s);
      }
    } else if (s.dayOrder == null && !map.has(key)) {
      map.set(key, s);
    }
  }
  return Array.from(map.values());
}

// A slot applies to a given day order (base slots apply to all).
export function slotAppliesToOrder(slot: TimetableSlot, dayOrder: number | null | undefined): boolean {
  if (dayOrder == null) return slot.dayOrder == null;
  return slot.dayOrder == null || slot.dayOrder === dayOrder;
}

// Distinct day orders present in a set of dated entries.
export function availableDayOrders(entries: { dayOrder: number }[]): number[] {
  return Array.from(new Set(entries.map((e) => e.dayOrder))).sort((a, b) => a - b);
}

// Human friendly "today" marker for a day order number.
export function todayIsDayOrder(currentDayOrder: number | null, order: number): boolean {
  return currentDayOrder !== null && currentDayOrder === order;
}