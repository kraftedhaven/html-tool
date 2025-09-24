import React from 'react';

const AboutPage = () => {
  return (
    <div className="container mx-auto p-8 text-white">
      <header className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">About Hidden Haven Threads</h1>
        <p className="text-lg max-w-3xl mx-auto">A conscious fashion sanctuary where vintage stories are revived, and forgotten fabrics are reborn.</p>
      </header>

      <section className="mb-12">
        <h2 className="text-3xl font-semibold mb-6 border-b-2 border-gray-700 pb-2">Our Story</h2>
        <p className="mb-4">
          Hidden Haven Threads specializes in breathing new life into pre-loved pieces — from Y2K streetwear and timeless denim to reworked hoodies and hand-painted, one-of-one collectibles.
        </p>
        <p className="mb-4">
          What began as a small collection of curated vintage finds has evolved into a purpose-driven creative house. Our mission is to blend sustainability with soul — reimagining fashion as a portal of transformation, self-expression, and rebirth.
        </p>
        <p>
          We believe that clothes carry memory. Every stitch, every fade, every thread has energy. And in a world of mass production and fast fashion, we’re slowing down — honoring the past, reshaping the present, and designing a future where style doesn’t cost the planet.
        </p>
      </section>

      <section className="mb-12 bg-gray-900 p-8 rounded-lg">
        <h2 className="text-3xl font-semibold mb-8 text-center">Meet the Founders</h2>
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h3 className="text-2xl font-bold">Korinn Clark</h3>
            <p className="text-sm text-gray-400 mb-2">Founder | Creative Director</p>
            <p className="mb-4">
              A visionary artist, spiritual storyteller, and sustainable stylist, Korinn built Hidden Haven Threads to merge her love for metaphysical design, fashion history, and conscious living. She sees clothing as a medium of energy — a second skin that speaks. Her process blends intuitive curation with artistic customization, always led by the belief that every piece deserves a second life.
            </p>
            <p className="text-sm italic">
              She is also the founder of The Krafted Haven and Lumenae, exploring the intersections of creativity, consciousness, and technology — though this site stays grounded in threads, not tech.
            </p>
          </div>
          <div>
            <h3 className="text-2xl font-bold">Lucas McCammant</h3>
            <p className="text-sm text-gray-400 mb-2">Vintage Curator | Streetwear Lead</p>
            <p>
              With a sharp eye for quality, authenticity, and underground trends, Lucas brings the streetwear soul to Hidden Haven Threads. His background in sourcing rare finds and curating drops that bridge past and present makes him an essential part of the HHT rhythm. From eBay listings to on-the-ground sourcing, he helps bring vintage stories into the now.
            </p>
          </div>
        </div>
      </section>

      <section className="text-center italic text-gray-400">
        <p>We don’t believe in trends.</p>
        <p>We believe in timelines.</p>
        <p>And every timeline deserves to be stitched with care.</p>
        <p>This is fashion for the multidimensional —</p>
        <p>Rooted in Earth, revived by hand, and designed to resonate.</p>
      </section>
    </div>
  );
};

export default AboutPage;
