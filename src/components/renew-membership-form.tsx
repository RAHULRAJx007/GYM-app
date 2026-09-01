"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Plan = {
  id: string;
  name: string;
  price: number | string;
  duration_days: number | string;
};

type CurrentMembership = {
  id: string;
  start_date: string;
  end_date: string;
  price_paid: number | string | null;
  membership_plans?: {
    name?: string | null;
    price?: number | string | null;
    duration_days?: number | string | null;
  } | null;
};

export function RenewMembershipForm({
  memberId,
  plans,
  currentMembership,
  isEnded,
  submitLabel,
  action,
}: {
  memberId: string;
  plans: Plan[];
  currentMembership?: CurrentMembership | null;
  isEnded: boolean;
  submitLabel: string;
  action: (memberId: string, formData: FormData) => Promise<void>;
}) {
  const defaultPlan = plans[0];
  const [selectedPlanId, setSelectedPlanId] = useState(defaultPlan?.id ?? "");

  const selectedPlan = useMemo(
    () => plans.find((plan) => plan.id === selectedPlanId) ?? defaultPlan,
    [plans, selectedPlanId, defaultPlan],
  );

  const calculatedAmount = useMemo(() => {
    const selectedPrice = Number(selectedPlan?.price ?? 0);
    if (!currentMembership?.end_date || isEnded) return selectedPrice;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const currentEnd = new Date(currentMembership.end_date);
    currentEnd.setHours(0, 0, 0, 0);

    const remainingMs = Math.max(currentEnd.getTime() - today.getTime(), 0);
    const remainingDays = Math.max(1, Math.ceil(remainingMs / 86400000));
    const currentPlanPrice = Number(currentMembership.membership_plans?.price ?? currentMembership.price_paid ?? 0);
    const currentPlanDuration = Number(currentMembership.membership_plans?.duration_days ?? 30);
    const currentCredit = (remainingDays / currentPlanDuration) * currentPlanPrice;

    return Math.max(selectedPrice - currentCredit, 0) || selectedPrice;
  }, [currentMembership, isEnded, selectedPlan]);

  return (
    <form action={async (formData) => action(memberId, formData)} className="mt-4 space-y-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <select
          name="plan_id"
          required
          value={selectedPlanId}
          onChange={(e) => setSelectedPlanId(e.target.value)}
          className="border rounded-md px-3 py-2 text-sm h-11 bg-transparent"
        >
          <option value="">Select New Plan</option>
          {plans.map((plan) => (
            <option key={plan.id} value={plan.id}>
              {plan.name} — ₹{Number(plan.price).toLocaleString("en-IN")} / {plan.duration_days}d
            </option>
          ))}
        </select>

        <Input
          name="amount"
          type="number"
          step="0.01"
          value={Number(calculatedAmount).toFixed(2)}
          readOnly
          className="h-11"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <Input name="start_date" type="date" required lang="en-GB" defaultValue={new Date().toISOString().slice(0, 10)} className="h-11" />
        <select name="payment_method" className="border rounded-md px-3 text-sm h-11 bg-transparent">
          <option value="upi">UPI</option>
          <option value="cash">Cash</option>
          <option value="card">Card</option>
          <option value="bank_transfer">Bank Transfer</option>
          <option value="other">Other</option>
        </select>
      </div>

      <Button type="submit" className="w-full h-11">{submitLabel}</Button>
      <p className="text-xs text-muted-foreground">Amount is recalculated from the remaining days of the current plan and the new plan price.</p>
    </form>
  );
}
