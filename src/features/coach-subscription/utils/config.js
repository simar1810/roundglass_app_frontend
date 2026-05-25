import { Sparkles, User } from "lucide-react";

export const planDetails = [
  { id: "basic", label: "Basic", desc: "For small teams", icon: User },
  { id: "pro", label: "Pro", desc: "Best for professionals", icon: Sparkles, popular: true },
];

export const planWeights = {
  basic1: 10,
  basic12: 20,
  pro1: 30,
  pro12: 40,
  advance1: 50,
  advance12: 60
}

export const plansRegistry = {
  1: "basic",
  "basic": "basic",
  2: "pro",
  "pro": "pro",
};

export const SALES_CONTACT_NUMBER = "919876543210"