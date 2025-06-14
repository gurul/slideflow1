/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
  	container: {
  		center: true,
  		padding: "2rem",
  		screens: {
  			"2xl": "1400px",
  		},
  	},
  	extend: {
  		colors: {
  			border: "hsl(var(--border))",
  			input: "hsl(var(--input))",
  			ring: "hsl(var(--ring))",
  			background: "hsl(var(--background))",
  			foreground: "hsl(var(--foreground))",
  			primary: {
  				DEFAULT: "hsl(var(--primary))",
  				foreground: "hsl(var(--primary-foreground))",
  			},
  			secondary: {
  				DEFAULT: "hsl(var(--secondary))",
  				foreground: "hsl(var(--secondary-foreground))",
  			},
  			destructive: {
  				DEFAULT: "hsl(var(--destructive))",
  				foreground: "hsl(var(--destructive-foreground))",
  			},
  			muted: {
  				DEFAULT: "hsl(var(--muted))",
  				foreground: "hsl(var(--muted-foreground))",
  			},
  			accent: {
  				DEFAULT: "hsl(var(--accent))",
  				foreground: "hsl(var(--accent-foreground))",
  			},
  			popover: {
  				DEFAULT: "hsl(var(--popover))",
  				foreground: "hsl(var(--popover-foreground))",
  			},
  			card: {
  				DEFAULT: "hsl(var(--card))",
  				foreground: "hsl(var(--card-foreground))",
  			},
  		},
  		borderRadius: {
  			lg: "var(--radius)",
  			md: "calc(var(--radius) - 2px)",
  			sm: "calc(var(--radius) - 4px)",
  		},
  		keyframes: {
  			"accordion-down": {
  				from: { height: 0 },
  				to: { height: "var(--radix-accordion-content-height)" },
  			},
  			"accordion-up": {
  				from: { height: "var(--radix-accordion-content-height)" },
  				to: { height: 0 },
  			},
        "smoothLiquidWave": {
          "0%": {
            transform: "translateY(0) scaleY(1)",
            opacity: 1
          },
          "15%": {
            transform: "translateY(-15px) scaleY(0.7)",
            opacity: 1
          },
          "30%": {
            transform: "translateY(-30px) scaleY(0.4)",
            opacity: 1
          },
          "45%": {
            transform: "translateY(-50px) scaleY(0.2)",
            opacity: 1
          },
          "60%": {
            transform: "translateY(-70px) scaleY(0.1)",
            opacity: 1
          },
          "75%": {
            transform: "translateY(-50px) scaleY(0.2)",
            opacity: 1
          },
          "85%": {
            transform: "translateY(-30px) scaleY(0.4)",
            opacity: 1
          },
          "100%": {
            transform: "translateY(0) scaleY(1)",
            opacity: 1
          }
        },
        "neonGlow": {
          "0%, 100%": {
            transform: "scaleY(0.6)",
            boxShadow: "0 0 15px rgba(255, 255, 255, 0.4)",
            backgroundPosition: "0% 50%"
          },
          "50%": {
            transform: "scaleY(2)",
            boxShadow: "0 0 50px rgba(255, 255, 255, 1)",
            backgroundPosition: "100% 50%"
          }
        }
  		},
  		animation: {
  			"accordion-down": "accordion-down 0.2s ease-out",
  			"accordion-up": "accordion-up 0.2s ease-out",
        "smoothLiquidWave": "smoothLiquidWave 3s cubic-bezier(0.25, 0.1, 0.25, 1) infinite",
        "neonGlow": "neonGlow 3s ease-in-out infinite"
  		},
  	}
  },
  plugins: [require("tailwindcss-animate")],
};
