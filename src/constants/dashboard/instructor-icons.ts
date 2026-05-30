import {
  ClipboardList,
  GraduationCap,
  MessageSquare,
  Sparkles,
  UserCheck,
  Users,
} from "lucide-react";

export const INSTRUCTOR_MENU_ICONS = {
  group: GraduationCap,
  roster: Users,
  approvals: ClipboardList,
  profiles: UserCheck,
  expertise: Sparkles,
  tickets: MessageSquare,
} as const;
