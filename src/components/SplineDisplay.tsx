'use client';
import dynamic from 'next/dynamic';
const Spline = dynamic(() => import('@splinetool/react-spline'), { ssr: false });
export default function SplineDisplay({ scene }: { scene: string }) {
  return <div className="scene-shell"><Spline scene={scene} /></div>;
}
