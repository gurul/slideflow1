"use client";
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import styles from './page.module.css'
import { useState, useEffect } from 'react';
import Footer from '@/components/Footer';
import Chatbot from '@/components/Chatbot';

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
    <>
      <div className={styles.container}>
        <div className={styles.content}>
          <div className="practice-counter" style={{ marginBottom: '0.5rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="live-indicator" style={{ display: 'inline-block', width: '0.5em', height: '0.5em', backgroundColor: '#22c55e', borderRadius: '50%', verticalAlign: 'middle', marginRight: '0.4em' }}></span>
              <span className="count" style={{ color: '#fff' }}>{displayedClicks}</span>
              <span style={{ marginLeft: '0em' }}>Run-throughs</span>
            </span>
          </div>
          <h1 className={styles.title}>slideflow</h1>
          <p className={styles.subtitle}>
            perfect your presentations
          </p>
          <Link href="/practice">
            <Button size="lg" className="bg-white text-black hover:bg-gray-100 hover:text-black transition-all" onClick={handleClick}>
              Start Practicing
            </Button>
          </Link>
        </div>
      </div>
      <Footer />
      <Chatbot 
        isVisible={false}
        currentSlide={1}
        totalSlides={1}
        slideTimings={[]}
      />
    </>
  )
} 