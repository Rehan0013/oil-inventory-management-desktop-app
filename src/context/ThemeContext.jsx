import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    // Initialize from localStorage or default to 'system'
    const [theme, setTheme] = useState(() => {
        if (typeof window !== 'undefined') {
            const savedTheme = localStorage.getItem('theme');
            return savedTheme || 'dark'; // Default to dark
        }
        return 'dark';
    });

    useEffect(() => {
        const root = window.document.documentElement;

        const removeOldTheme = () => {
            root.classList.remove('dark', 'light');
        };

        const applyTheme = (themeToApply) => {
            removeOldTheme();
            if (themeToApply === 'dark') {
                root.classList.add('dark');
            } else if (themeToApply === 'light') {
                root.classList.add('light'); // Optional, usually just removing dark is enough for light
            }
        };

        if (theme === 'system') {
            const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
            applyTheme(systemTheme);

            // Listener for system changes
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            const handleChange = (e) => {
                applyTheme(e.matches ? 'dark' : 'light');
            };
            mediaQuery.addEventListener('change', handleChange);
            return () => mediaQuery.removeEventListener('change', handleChange);
        } else {
            applyTheme(theme);
        }

        localStorage.setItem('theme', theme);
    }, [theme]);

    return (
        <ThemeContext.Provider value={{ theme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
