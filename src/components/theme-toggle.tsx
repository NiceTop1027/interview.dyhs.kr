'use client'

import * as React from 'react'
import { Moon, Sun, Monitor } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function ThemeToggle() {
    const { theme, setTheme } = useTheme()
    const [mounted, setMounted] = React.useState(false)

    // Hydration check
    React.useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return <Button variant="ghost" size="sm" className="w-9 h-9" disabled />
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="flex items-center gap-2 h-9 px-3 font-semibold text-xs border border-transparent hover:border-border transition-all">
                    {theme === 'light' ? (
                        <>
                            <Sun className="h-4 w-4 text-amber-500" />
                            <span className="hidden sm:inline">Light Mode</span>
                        </>
                    ) : theme === 'dark' ? (
                        <>
                            <Moon className="h-4 w-4 text-slate-400" />
                            <span className="hidden sm:inline">Dark Mode</span>
                        </>
                    ) : (
                        <>
                            <Monitor className="h-4 w-4 text-slate-500" />
                            <span className="hidden sm:inline">System</span>
                        </>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36 bg-card border-border shadow-xl">
                <DropdownMenuItem onClick={() => setTheme("light")} className="flex items-center gap-2 font-semibold text-xs cursor-pointer focus:bg-primary/10">
                    <Sun className="h-3.5 w-3.5 text-amber-500" />
                    Light Mode
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("dark")} className="flex items-center gap-2 font-semibold text-xs cursor-pointer focus:bg-primary/10">
                    <Moon className="h-3.5 w-3.5 text-slate-400" />
                    Dark Mode
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("system")} className="flex items-center gap-2 font-semibold text-xs cursor-pointer focus:bg-primary/10">
                    <Monitor className="h-3.5 w-3.5 text-slate-500" />
                    System Default
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
