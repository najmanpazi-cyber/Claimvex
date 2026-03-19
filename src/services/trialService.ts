// Trial management service — calculates trial status from user_profiles.

import { supabase } from "@/integrations/supabase/client";

export interface TrialStatus {
  plan: string;
  daysRemaining: number;
  isExpired: boolean;
  isPaid: boolean;
  showBanner: boolean;
  badgeLabel: string;
  badgeColor: "teal" | "gray" | "green";
}

const TRIAL_DAYS = 30;
const BANNER_THRESHOLD = 9; // Show banner when <= 9 days remaining (day 21+)
const PAID_PLANS = ["founding_partner", "starter", "professional", "business", "enterprise"];

export async function fetchTrialStatus(userId: string): Promise<TrialStatus> {
  const { data, error } = await supabase
    .from("user_profiles" as never)
    .select("trial_start, plan")
    .eq("id", userId)
    .single();

  if (error || !data) {
    // If profile doesn't exist yet, treat as new trial
    return {
      plan: "trial",
      daysRemaining: TRIAL_DAYS,
      isExpired: false,
      isPaid: false,
      showBanner: false,
      badgeLabel: `Trial: ${TRIAL_DAYS} days left`,
      badgeColor: "teal",
    };
  }

  const profile = data as unknown as { trial_start: string; plan: string };
  const plan = profile.plan || "trial";
  const isPaid = PAID_PLANS.includes(plan);

  if (isPaid) {
    const label = plan.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    return {
      plan,
      daysRemaining: TRIAL_DAYS,
      isExpired: false,
      isPaid: true,
      showBanner: false,
      badgeLabel: label,
      badgeColor: "green",
    };
  }

  // Calculate days remaining
  const trialStart = new Date(profile.trial_start);
  const now = new Date();
  const elapsed = Math.floor((now.getTime() - trialStart.getTime()) / (1000 * 60 * 60 * 24));
  const daysRemaining = Math.max(0, TRIAL_DAYS - elapsed);
  const isExpired = daysRemaining <= 0;
  const showBanner = !isExpired && daysRemaining <= BANNER_THRESHOLD;

  return {
    plan,
    daysRemaining,
    isExpired,
    isPaid: false,
    showBanner,
    badgeLabel: isExpired ? "Trial ended" : `Trial: ${daysRemaining} day${daysRemaining !== 1 ? "s" : ""} left`,
    badgeColor: isExpired ? "gray" : "teal",
  };
}
