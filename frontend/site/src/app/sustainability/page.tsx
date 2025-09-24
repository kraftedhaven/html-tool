import React from 'react';

const SustainabilityPage = () => {
  return (
    <div className="container mx-auto p-8 text-white">
      <header className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Our Commitment to Sustainability</h1>
        <p className="text-lg max-w-3xl mx-auto">Fashion that honors the planet. We believe style and sustainability are woven from the same thread.</p>
      </header>

      <section className="mb-12 bg-gray-900 p-8 rounded-lg">
        <h2 className="text-3xl font-semibold mb-6">The True Cost of Fashion</h2>
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-2">Textile & Solid Waste</h3>
            <p>The fashion industry is one of the largest polluters globally. Every year, millions of tons of clothing end up in landfills — many of them synthetic and unable to decompose. This mountain of waste leaches toxic chemicals into our soil and water. Fast fashion has created a culture of disposability, where clothes are worn a few times and then thrown away.</p>
          </div>
          <div>
            <h3 className="text-xl font-bold mb-2">Carbon Footprint</h3>
            <p>From growing cotton to manufacturing, shipping, and washing clothes, the industry has a massive carbon footprint, contributing significantly to greenhouse gas emissions. The energy-intensive processes and global supply chains create a cycle of environmental damage that is unsustainable for our planet.</p>
          </div>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-3xl font-semibold mb-6 border-b-2 border-gray-700 pb-2">How We Make a Difference</h2>
        <p className="mb-6 max-w-4xl mx-auto text-center">
          At Hidden Haven Threads (HHT) and our creative partner, The Krafted Haven (TKH), our entire business model is a response to this crisis. We don't just sell clothes; we practice a philosophy of radical reuse and conscious creation.
        </p>
        <div className="grid md:grid-cols-3 gap-8 text-center">
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-xl font-bold mb-2">1. We Revive & Rework</h3>
            <p>Every piece in our collection is vintage or pre-loved. By giving existing garments a new life, we directly divert clothing from landfills and reduce the demand for new production. Our custom, reworked pieces turn forgotten fabrics into unique works of art.</p>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-xl font-bold mb-2">2. We Choose Conscious Materials</h3>
            <p>When we add to our pieces, we prioritize sustainable and natural materials. We avoid virgin plastics and synthetics, opting for biodegradable threads, eco-friendly paints, and natural dyes where possible. This minimizes our chemical footprint.</p>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-xl font-bold mb-2">3. We Empower with Tools</h3>
            <p>Through The Krafted Haven, we develop tools that empower other sellers to participate in the circular economy. By making it easier to list and sell pre-owned goods, we help grow the sustainable fashion ecosystem from the ground up.</p>
          </div>
        </div>
      </section>

      <section className="text-center mt-12">
        <h2 className="text-2xl font-bold mb-4">Join the Movement</h2>
        <p className="max-w-2xl mx-auto">Choosing vintage is more than a style choice; it's a vote for a healthier planet. Thank you for being part of a community that values artistry, history, and the future of our Earth.</p>
      </section>
    </div>
  );
};

export default SustainabilityPage;
