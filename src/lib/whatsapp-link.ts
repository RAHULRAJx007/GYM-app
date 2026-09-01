export function toWaNumber(phone: string): string | null {
  if (!phone) return null;
  let p = phone.replace(/[^\d]/g, "");
  if (p.length === 10) p = `91${p}`;
  if (p.startsWith("91") && p.length === 12) return p;
  if (p.length >= 11) return p;
  return null;
}

export function dueMessage(memberName: string, planName: string, endDate: string, daysLeft?: number) {
  const due = new Date(endDate).toLocaleDateString("en-GB");
  if (daysLeft !== undefined && daysLeft <= 0) {
    return `Hi ${memberName} 👋, your *${planName}* membership at GymCore ended on ${due}. Please visit the gym to renew. Thanks! 💪 - GymCore (7034006336)`;
  }
  if (daysLeft !== undefined) {
    return `Hi ${memberName} 👋, reminder: your *${planName}* membership at GymCore expires on ${due} (${daysLeft} days left). Please renew to avoid interruption. 💪 - GymCore (7034006336)`;
  }
  return `Hi ${memberName} 👋, your *${planName}* membership at GymCore is due (ends ${due}). Please renew at the gym. Thanks! 💪 - GymCore`;
}

export function waLink(phone: string, message: string): string | null {
  const num = toWaNumber(phone);
  if (!num) return null;
  return `https://wa.me/${num}?text=${encodeURIComponent(message)}`;
}
