"use client";
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import styles from './page.module.css'
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <>
      <div className={styles.container}>
        <div className={styles.content}>
          <h1 className={styles.title}>slideflow</h1>
          <p className={styles.subtitle}>
            perfect your presentations
          </p>
          <Link href="/practice">
            <Button size="lg" className="bg-white text-black hover:bg-gray-100 hover:text-black transition-all">
              Start Practicing
            </Button>
          </Link>
        </div>
      </div>
      <Footer />
    </>
  )
}
