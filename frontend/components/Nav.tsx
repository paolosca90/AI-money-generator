import { NavLink } from "react-router-dom";
import { Home, CandlestickChart, History, Settings, CreditCard } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const Nav = () => {
  const navItems = [
    { to: "/", icon: Home, label: "Dashboard" },
    { to: "/trade", icon: CandlestickChart, label: "Trading" },
    { to: "/history", icon: History, label: "Storico" },
    { to: "/settings", icon: Settings, label: "Impostazioni" },
    { to: "/billing", icon: CreditCard, label: "Abbonamento" },
  ];

  return (
    <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary ${
              isActive ? "bg-muted text-primary" : "text-muted-foreground"
            }`
          }
        >
          <item.icon className="h-4 w-4" />
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
};

export default Nav;
