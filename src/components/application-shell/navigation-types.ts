import type { LucideIcon } from "lucide-react";

export interface NavigationItem {
  id:
    | "assignment"
    | "assignment-dashboard"
    | "towers"
    | "cells"
    | "reports"
    | "reports-center"
    | "riggers"
    | "profile"
    | "settings"
    | "admin-users"
    | "admin-roles"
    | "admin-privileges"
    | "admin-audit"
    | "admin-system-health"
    | "admin-assignment-maintenance";
  label: string;
  href: `/home/${string}`;
  icon: LucideIcon;
  description: string;
  section: "Operations" | "Administration";
  administratorOnly?: boolean;
  assignmentOnly?: boolean;
}
