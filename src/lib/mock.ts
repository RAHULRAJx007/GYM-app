export const TEST_CREDENTIALS = {
  email: "admin@gym.local",
  password: "admin123",
};

export const MOCK_COOKIE = "gym_mock_session";

// Simple in-memory mock data for local testing (no Supabase needed)
export const mockData = {
  gym: { name: "Test Gym (Local)", phone: "9876543210", email: "admin@gym.local", address: "Local Test Address", currency: "INR" as const },
  plans: [
    { id: "plan1", name: "Monthly", description: "1 month", price: 1500, duration_days: 30, is_active: true },
    { id: "plan2", name: "Quarterly", description: "3 months", price: 4000, duration_days: 90, is_active: true },
    { id: "plan3", name: "Yearly", description: "12 months", price: 14000, duration_days: 365, is_active: true },
  ],
  members: [
    { id: "m1", first_name: "Rahul", last_name: "Sharma", phone: "9876543210", email: "rahul@test.com", status: "active", joined_at: new Date().toISOString(), gender: "male" as const },
    { id: "m2", first_name: "Priya", last_name: "Patel", phone: "9876543211", email: "priya@test.com", status: "active", joined_at: new Date(Date.now() - 86400000 * 2).toISOString(), gender: "female" as const },
    { id: "m3", first_name: "Aman", last_name: "Singh", phone: "9876543212", email: "", status: "frozen", joined_at: new Date(Date.now() - 86400000 * 5).toISOString(), gender: "male" as const },
  ],
  memberships: [
    { id: "mm1", member_id: "m1", plan_id: "plan1", start_date: new Date().toISOString().slice(0,10), end_date: new Date(Date.now() + 86400000*20).toISOString().slice(0,10), status: "active", price_paid: 1500 },
    { id: "mm2", member_id: "m2", plan_id: "plan2", start_date: new Date(Date.now() - 86400000*10).toISOString().slice(0,10), end_date: new Date(Date.now() + 86400000*80).toISOString().slice(0,10), status: "active", price_paid: 4000 },
  ],
  payments: [
    { id: "p1", member_id: "m1", amount: 1500, payment_method: "cash", payment_date: new Date().toISOString().slice(0,10), receipt_number: "REC-MOCK01", membership_id: "mm1" },
    { id: "p2", member_id: "m2", amount: 4000, payment_method: "upi", payment_date: new Date(Date.now() - 86400000*10).toISOString().slice(0,10), receipt_number: "REC-MOCK02", membership_id: "mm2" },
  ],
  attendances: [
    { id: "a1", member_id: "m1", check_in_at: new Date().toISOString(), method: "manual" },
    { id: "a2", member_id: "m2", check_in_at: new Date(Date.now() - 86400000).toISOString(), method: "manual" },
  ],
};

export function isMockEnabled() {
  return process.env.NEXT_PUBLIC_USE_MOCK === "true";
}
