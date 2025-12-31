import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  UserCheck,
  Users,
  DollarSign,
  BarChart3,
  Calendar,
  MessageSquare,
  Settings,
  Flame,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const navItems = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/coaches", icon: UserCheck, label: "Coaches" },
  { to: "/members", icon: Users, label: "Members" },
  { to: "/financials", icon: DollarSign, label: "Financials" },
  { to: "/analytics", icon: BarChart3, label: "Analytics" },
  { to: "/calendar", icon: Calendar, label: "Calendar" },
  { to: "/inbox", icon: MessageSquare, label: "Inbox" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

const Sidebar = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <TooltipProvider>
      <aside
        className={`fixed left-0 top-0 h-full z-50 hidden md:flex flex-col transition-all duration-300 ease-in-out glass ${
          isExpanded ? "w-64" : "w-16"
        }`}
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
      >
        {/* Logo */}
        <div className="h-20 flex items-center justify-center">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-orange-600 flex items-center justify-center flex-shrink-0 shadow-lg">
            <Flame className="h-6 w-6 text-white" />
          </div>
          {isExpanded && (
            <span className="ml-3 font-bold text-lg text-foreground whitespace-nowrap font-display">
              Prometheus
            </span>
          )}
        </div>

        {/* Navigation - vertikal verteilt */}
        <nav className="flex-1 py-6 flex flex-col">
          <ul className={`flex-1 flex flex-col ${isExpanded ? "space-y-1 px-3" : "space-y-3 px-2 justify-start pt-2"}`}>
            {navItems.map((item) => (
              <li key={item.to}>
                {isExpanded ? (
                  <NavLink
                    to={item.to}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                        isActive
                          ? "bg-primary text-primary-foreground shadow-lg"
                          : "text-foreground/60 hover:bg-white/10 hover:text-foreground"
                      }`
                    }
                  >
                    <item.icon className="h-5 w-5 flex-shrink-0" />
                    <span className="whitespace-nowrap font-medium">{item.label}</span>
                  </NavLink>
                ) : (
                  <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                      <NavLink
                        to={item.to}
                        className={({ isActive }) =>
                          `flex items-center justify-center h-11 w-11 mx-auto rounded-xl transition-all duration-200 ${
                            isActive
                              ? "bg-primary text-primary-foreground shadow-lg"
                              : "text-foreground/60 hover:bg-white/10 hover:text-foreground"
                          }`
                        }
                      >
                        <item.icon className="h-5 w-5" />
                      </NavLink>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="font-medium">
                      {item.label}
                    </TooltipContent>
                  </Tooltip>
                )}
              </li>
            ))}
          </ul>
        </nav>

        {/* User Avatar unten */}
        <div className="h-20 flex items-center justify-center">
          {isExpanded ? (
            <div className="flex items-center gap-3 px-3">
              <Avatar className="h-10 w-10 border-2 border-primary/30">
                <AvatarFallback className="bg-primary/20 text-primary font-semibold">
                  DP
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-foreground">Daniel P.</span>
                <span className="text-xs text-muted-foreground">Admin</span>
              </div>
            </div>
          ) : (
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Avatar className="h-10 w-10 border-2 border-primary/30 cursor-pointer hover:border-primary transition-colors">
                  <AvatarFallback className="bg-primary/20 text-primary font-semibold">
                    DP
                  </AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent side="right" className="font-medium">
                Daniel P.
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </aside>
    </TooltipProvider>
  );
};

export default Sidebar;
