export type PlanKey = "starter" | "growth" | "control_tower" | "enterprise";
export type BillingCycle = "monthly" | "yearly";

export type PlanPlaceholder = {
  planKey: PlanKey;
  billingCycle: BillingCycle;
};

export type PlanLimits = {
  seats: number;
  sites: number;
  domains: number;
  aiTier: "none" | "basic" | "advanced";
};

export function getPlanPlaceholder(): PlanPlaceholder {
  return {
    planKey: "starter",
    billingCycle: "yearly"
  };
}

export function getLimitsPlaceholder(planKey: PlanKey): PlanLimits {
  switch (planKey) {
    case "growth":
      return { seats: 10, sites: 8, domains: 12, aiTier: "basic" };
    case "control_tower":
      return { seats: 20, sites: 20, domains: 30, aiTier: "advanced" };
    case "enterprise":
      return { seats: 50, sites: 100, domains: 200, aiTier: "advanced" };
    case "starter":
    default:
      return { seats: 5, sites: 3, domains: 5, aiTier: "none" };
  }
}
