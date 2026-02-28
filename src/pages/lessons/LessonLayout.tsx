import { ReactNode } from 'react';

interface LessonLayoutProps {
  title: string;
  children: ReactNode;
}

export function LessonLayout({ title, children }: LessonLayoutProps) {
  return (
    <div className="lesson-page">
      <div className="lesson-content">
        <h1>{title}</h1>
        {children}
      </div>
    </div>
  );
}
