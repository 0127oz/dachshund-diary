import { Link } from "@tanstack/react-router";
import { Target, Users, User } from "lucide-react";

const tabs = [
  { to: "/", label: "내 목표", Icon: Target },
  { to: "/everyone", label: "모두의 목표", Icon: Users },
  { to: "/me", label: "마이페이지", Icon: User },
] as const;

export function TabBar() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-card/95 backdrop-blur">
      <div className="mx-auto flex max-w-md items-stretch justify-around px-2 py-2">
        {tabs.map(({ to, label, Icon }) => (
          <Link
            key={to}
            to={to}
            activeOptions={{ exact: to === "/" }}
            activeProps={{ className: "text-accent" }}
            inactiveProps={{ className: "text-muted-foreground" }}
            className="flex flex-1 flex-col items-center gap-1 rounded-[18px] py-2 text-xs font-bold"
          >
            <Icon size={22} />
            {label}
          </Link>
        ))}
      </div>
    </nav>
  );
}