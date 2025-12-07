import React from 'react';
import CardGlass from './CardGlass';

export default function ValueProps() {
  const props = [
    {
      title: 'Ownership Engine',
      description: 'Keep 100% of your earnings. No platform fees, no middlemen.',
    },
    {
      title: 'Underground Safehouse',
      description: 'Encryption, controls, consent first. Your content, your rules.',
    },
    {
      title: 'Creator OS',
      description: 'Distribution, payouts, analytics—all in one place.',
    },
  ];

  return (
    <section className="relative bg-ink-800 py-20">
      <div className="max-w-7xl mx-auto px-6">
        <h2 className="font-display text-3xl md:text-5xl text-white text-center mb-12">
          Built Different
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {props.map((prop, index) => (
            <CardGlass
              key={index}
              title={prop.title}
              description={prop.description}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
