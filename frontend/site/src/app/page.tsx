import Link from "next/link";

const NavLink = ({ href, children }: { href: string, children: React.ReactNode }) => (
  <Link href={href} className="hover:underline hover:underline-offset-4">
    {children}
  </Link>
);

export default function Home() {
  return (
    <div className="font-sans flex flex-col min-h-screen p-8 sm:p-20 bg-black text-white">
      <header className="w-full">
        <nav className="container mx-auto flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold">
            Hidden Haven Threads
          </Link>
          <div className="flex items-center gap-6 font-mono text-sm">
            <NavLink href="/">Home</NavLink>
            <NavLink href="/about">About</NavLink>
            <NavLink href="/sustainability">Sustainability</NavLink>
            <NavLink href="/krafted-haven">The Krafted Haven</NavLink>
            <a href="/.auth/login/github" className="bg-white text-black px-3 py-1 rounded-md">Login</a>
            <a href="/.auth/logout" className="hover:underline">Logout</a>
          </div>
        </nav>
      </header>

      <main className="flex-grow flex flex-col gap-8 items-center justify-center text-center">
        <h1 className="text-5xl font-bold">Fashion for the Multidimensional.</h1>
        <p className="text-lg max-w-2xl mx-auto text-gray-300">
          Rooted in Earth, revived by hand, and designed to resonate. We give vintage stories a new life.
        </p>
        <div className="flex gap-4 items-center flex-col sm:flex-row mt-8">
          <a
            className="rounded-full border border-solid border-white transition-colors flex items-center justify-center bg-white text-black gap-2 hover:bg-gray-300 font-medium text-sm sm:text-base h-12 px-6"
            href="#"
          >
            Explore Collections
          </a>
          <a
            className="rounded-full border border-solid border-gray-700 transition-colors flex items-center justify-center hover:bg-gray-900 font-medium text-sm sm:text-base h-12 px-6"
            href="/about"
          >
            Our Story
          </a>
        </div>
      </main>

      <footer className="flex-shrink-0 flex gap-6 flex-wrap items-center justify-center text-sm text-gray-500">
        <p>&copy; {new Date().getFullYear()} Hidden Haven Threads. All Rights Reserved.</p>
      </footer>
    </div>
  );
}
