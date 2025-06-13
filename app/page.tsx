"use client";
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import styles from './page.module.css'
import { useState, useEffect } from 'react';
// import GeminiChat from '@/components/GeminiChat'

export default function Home() {
  const [clicks, setClicks] = useState(0);
  const [displayedClicks, setDisplayedClicks] = useState(0);

  // Fetch count from Supabase on mount
  useEffect(() => {
    fetch('/api/practice-clicks')
      .then(res => res.json())
      .then(data => {
        setClicks(data.count || 0);
      });
  }, []);

  // Animate the number
  useEffect(() => {
    if (displayedClicks === clicks) return;
    const diff = Math.abs(clicks - displayedClicks);
    if (diff === 0) return;
    const totalDuration = 500; // ms
    const stepDuration = totalDuration / diff;
    const step = clicks > displayedClicks ? 1 : -1;
    const timeout = setTimeout(() => setDisplayedClicks(displayedClicks + step), stepDuration);
    return () => clearTimeout(timeout);
  }, [displayedClicks, clicks]);

  const handleClick = async () => {
    const res = await fetch('/api/practice-clicks', { method: 'POST' });
    const data = await res.json();
    setClicks(data.count || 0);
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h1 className={styles.title}>Welcome to SlideFlow</h1>
        <p className={styles.subtitle}>
          Practice your presentations with real-time timing feedback
        </p>
        <Link href="/practice">
          <Button size="lg" className={styles.button} onClick={handleClick}>
            Start Practicing
          </Button>
        </Link>
        <div className="mt-4 text-center text-lg font-semibold">
          {displayedClicks > 0 && (
            <span>
              <span className="text-blue-600">{displayedClicks}</span> Presentations Practiced
            </span>
          )}
        </div>
        {/*
        <div className="mt-8">
          <GeminiChat />
        </div>
        */}
      </div>
    </div>
  )
} 