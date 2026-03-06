import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export const ThemeToggle = () => {
    const [dark, setDark] = useState(() => {
        if (typeof window !== "undefined") {
            return localStorage.getItem("cheffnex-theme") === "dark";
        }
        return false;
    });

    useEffect(() => {
        const root = document.documentElement;
        if (dark) {
            root.classList.add("dark");
            localStorage.setItem("cheffnex-theme", "dark");
        } else {
            root.classList.remove("dark");
            localStorage.setItem("cheffnex-theme", "light");
        }
    }, [dark]);

    // Apply saved theme on mount
    useEffect(() => {
        const saved = localStorage.getItem("cheffnex-theme");
        if (saved === "dark") {
            document.documentElement.classList.add("dark");
        }
    }, []);

    return (
        <button
            onClick={() => setDark((d) => !d)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent/50 w-full transition-colors"
            title={dark ? "Modo claro" : "Modo escuro"}
        >
            {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            {dark ? "Modo Claro" : "Modo Escuro"}
        </button>
    );
};
