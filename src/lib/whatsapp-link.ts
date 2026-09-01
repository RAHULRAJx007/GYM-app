export function toWaNumber(phone: string): string | null {
  if (!phone) return null;
  let p = phone.replace(/[^\d]/g, "");
  if (p.length === 10) p = `91${p}`;
  if (p.startsWith("91") && p.length === 12) return p;
  if (p.length >= 11) return p;
  return null;
}

export type GymInfo = {
  name?: string;
  phone?: string;
  address?: string;
  email?: string;
};

export function dueMessage(
  memberName: string,
  planName: string,
  endDate: string,
  daysLeft?: number,
  gym?: GymInfo | null
) {
  const due = new Date(endDate).toLocaleDateString("en-GB");
  const gymName = gym?.name || "GymCore";
  const gymPhone = gym?.phone || "7034006336";
  const gymAddress = gym?.address || "our gym";

  if (daysLeft !== undefined && daysLeft <= 0) {
    return `Hi ${memberName}! This is a reminder that your ${planName} membership at ${gymName} ended on ${due}. Please visit ${gymName} at ${gymAddress} to renew your membership. For assistance, call ${gymPhone}. Thank you!`;
  }

  if (daysLeft !== undefined) {
    return `Hi ${memberName}! This is a reminder that your ${planName} membership at ${gymName} expires on ${due} (${daysLeft} days left). Please renew before it expires to avoid interruption. Visit ${gymName} at ${gymAddress} or contact ${gymPhone}. Thank you!`;
  }

  return `Hi ${memberName}! Your ${planName} membership at ${gymName} is due for renewal on ${due}. Please visit ${gymName} at ${gymAddress} or call ${gymPhone} to renew today. Thank you!`;
}

export function waLink(phone: string, message: string): string | null {
  const num = toWaNumber(phone);
  if (!num) return null;
  return `https://wa.me/${num}?text=${encodeURIComponent(message)}`;
}
