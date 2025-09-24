import React from 'react';

const KraftedHavenPage = () => {
  return (
    <div className="container mx-auto p-8 text-white text-center">
      <header className="mb-12">
        <h1 className="text-4xl font-bold mb-4">The Krafted Haven</h1>
        <p className="text-lg max-w-3xl mx-auto">Creative Tools for the Modern Maker</p>
      </header>

      <section>
        <h2 className="text-2xl font-semibold mb-6">This is the home of our innovative software solutions.</h2>
        <p className="mb-4">
          Here we blend technology with artistry, creating tools designed to empower creators and entrepreneurs in the circular economy.
        </p>
        <p className="font-bold">
          Our flagship product, the Neural Listing Engine, is currently in development.
        </p>
        <p className="mt-8 text-gray-400">
          More information coming soon.
        </p>
      </section>
    </div>
  );
};

export default KraftedHavenPage;
