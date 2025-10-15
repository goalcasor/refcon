"use client"

import { Button } from "@/components/ui/button"
import { useTheme } from "next-themes"
import { Moon, Sun } from "lucide-react"

export function ThemeSwitcher() {
  const { setTheme, theme } = useTheme()

  const toggleDarkMode = () => {
    if (theme?.startsWith('dark-')) {
      setTheme(theme.substring(5)); // From dark-theme-green to theme-green
    } else {
      setTheme(`dark-${theme}`); // From theme-green to dark-theme-green
    }
  }

  return (
    <Button variant="ghost" size="icon" onClick={toggleDarkMode}>
      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}