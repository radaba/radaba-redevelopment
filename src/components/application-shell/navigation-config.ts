import {
  ChartNoAxesCombined,
  ClipboardList,
  FileClock,
  FileText,
  HeartPulse,
  Files,
  HardHat,
  KeyRound,
  Radio,
  RadioTower,
  Settings,
  ShieldCheck,
  UserRound,
  UsersRound,
  Wrench,
} from "lucide-react";
import type { NavigationItem } from "./navigation-types";
export { getActiveNavigationItem } from "./navigation-active.mjs";

export const applicationNavigation: readonly NavigationItem[] = [
  {
    id: "assignment",
    label: "Assignment",
    href: "/home/assignment",
    icon: ClipboardList,
    description: "Assignment operations",
    section: "Operations",
    assignmentOnly: true,
  },
  {
    id: "assignment-dashboard",
    label: "Dashboard",
    href: "/home/assignment/dashboard",
    icon: ChartNoAxesCombined,
    description: "Read-only Assignment analytics",
    section: "Operations",
    assignmentOnly: true,
  },
  {
    id: "towers",
    label: "Towers",
    href: "/home/towers",
    icon: RadioTower,
    description: "Read-only Tower directory",
    section: "Operations",
    assignmentOnly: true,
  },
  {
    id: "cells",
    label: "Cells",
    href: "/home/cells",
    icon: Radio,
    description: "Read-only sector-band operations",
    section: "Operations",
    assignmentOnly: true,
  },
  {
    id: "reports",
    label: "AOR Reports",
    href: "/home/reports",
    icon: FileText,
    description: "Completed AOR report center",
    section: "Operations",
    assignmentOnly: true,
  },
  {
    id: "reports-center",
    label: "Reports Center",
    href: "/home/reports-center",
    icon: Files,
    description: "Cross-module previews and bounded CSV exports",
    section: "Operations",
    assignmentOnly: true,
  },  {
    id: "riggers",
    label: "Riggers",
    href: "/home/riggers",
    icon: HardHat,
    description: "Read-only Rigger directory",
    section: "Operations",
    assignmentOnly: true,
  },
  {
    id: "profile",
    label: "Profile",
    href: "/home/profile",
    icon: UserRound,
    description: "Read-only account profile",
    section: "Operations",
  },
  {
    id: "settings",
    label: "Settings",
    href: "/home/settings",
    icon: Settings,
    description: "Global configuration and operational status",
    section: "Operations",
    administratorOnly: true,
  },
  {
    id: "admin-users",
    label: "Users",
    href: "/home/admin/users",
    icon: UsersRound,
    description: "Manage existing user roles and status",
    section: "Administration",
    administratorOnly: true,
  },
  {
    id: "admin-roles",
    label: "Roles",
    href: "/home/admin/roles",
    icon: ShieldCheck,
    description: "Review existing role usage",
    section: "Administration",
    administratorOnly: true,
  },
  {
    id: "admin-privileges",
    label: "Privileges",
    href: "/home/admin/privileges",
    icon: KeyRound,
    description: "Manage strict page privilege booleans",
    section: "Administration",
    administratorOnly: true,
  },
  {
    id: "admin-audit",
    label: "Audit Center",
    href: "/home/admin/audit",
    icon: FileClock,
    description: "Review administrator audit records",
    section: "Administration",
    administratorOnly: true,
  },
  {
    id: "admin-system-health",
    label: "System Health",
    href: "/home/admin/system-health",
    icon: HeartPulse,
    description: "Monitor services and bounded operational health",
    section: "Administration",
    administratorOnly: true,
  },
  {
    id: "admin-assignment-maintenance",
    label: "Assignment Maintenance",
    href: "/home/admin/assignment-maintenance",
    icon: Wrench,
    description: "Preview and repair missing Assignment Tower snapshots",
    section: "Administration",
    administratorOnly: true,
  },
] as const;

export function getVisibleNavigation(
  isAdministrator = false,
  canAccessAssignments = false,
): readonly NavigationItem[] {
  return applicationNavigation.filter(
    (item) =>
      (!item.administratorOnly || isAdministrator) &&
      (!item.assignmentOnly || canAccessAssignments),
  );
}

export function getNavigationItem(pathname: string) {
  return applicationNavigation.find((item) => item.href === pathname);
}
