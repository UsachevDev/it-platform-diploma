import type { UserRole } from "@/lib/auth/auth-types";

export function getRoleLabel(role?: UserRole | null) {
  switch (role) {
    case "CUSTOMER":
      return "Заказчик";
    case "CONTRACTOR":
      return "Исполнитель";
    case "ADMIN":
      return "Администратор";
    default:
      return "Неизвестно";
  }
}
