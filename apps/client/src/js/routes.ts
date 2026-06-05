import type { Router } from "framework7/types";
import { isAuthenticated } from "./api";

import Home from "../pages/Home.vue";
import Login from "../pages/Login.vue";
import AddTransaction from "../pages/AddTransaction.vue";
import Transactions from "../pages/Transactions.vue";
import Envelopes from "../pages/Envelopes.vue";
import Reconcile from "../pages/Reconcile.vue";
import Settings from "../pages/Settings.vue";
import PeriodSummary from "../pages/PeriodSummary.vue";

// Helper to format currency
export function formatRp(value: string | number): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "Rp0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

// Month names in Indonesian
export const MONTH_NAMES = [
  "",
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

export const routes: Router.RouteParameters[] = [
  {
    path: "/",
    async({ resolve }) {
      if (isAuthenticated()) {
        resolve({ component: Home });
      } else {
        resolve({ component: Login });
      }
    },
  },
  {
    path: "/login/",
    component: Login,
  },
  {
    path: "/add-transaction/",
    component: AddTransaction,
  },
  {
    path: "/transactions/",
    component: Transactions,
  },
  {
    path: "/envelopes/",
    component: Envelopes,
  },
  {
    path: "/reconcile/",
    component: Reconcile,
  },
  {
    path: "/settings/",
    component: Settings,
  },
  {
    path: "/period-summary/",
    component: PeriodSummary,
  },
  {
    path: "/download/",
    async() {
      window.location.href = "https://github.com/ihkaru/fintr/releases/latest";
    },
  },
];
