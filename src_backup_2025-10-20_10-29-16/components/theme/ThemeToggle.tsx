import { Check, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useThemeMode } from "@/hooks/useTheme";

export const ThemeToggle = () => {
  const { theme, setTheme } = useThemeMode();

  const items: Array<{ key: "dark" | "light"; label: string; icon: JSX.Element }> = [
    { key: "dark", label: "Dark (default)", icon: <Moon className="w-4 h-4" /> },
    { key: "light", label: "Light Modern", icon: <Sun className="w-4 h-4" /> },
  ];

  const active = items.find(i => i.key === theme)!;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          {active.icon}
          <span className="text-sm">{active.label}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[12rem]">
        {items.map(i => (
          <DropdownMenuItem key={i.key} onClick={() => setTheme(i.key)} className="flex items-center gap-2">
            <span className="shrink-0">{i.icon}</span>
            <span className="flex-1">{i.label}</span>
            {theme === i.key && <Check className="w-4 h-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ThemeToggle;
