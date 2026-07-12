import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { API_URL } from "../config/api";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Clock3, CreditCard, Sparkles } from "lucide-react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import MovieCard from "./MovieCard";

const FEATURES = [
  { icon: Clock3, title: "Hassle-free Booking", copy: "Book your tickets in seconds with our easy-to-use platform." },
  { icon: CreditCard, title: "Secure Payments", copy: "Multiple secure payment options for a worry-free experience." },
  { icon: Sparkles, title: "Exclusive Offers", copy: "Regular discounts and special promotions for our loyal customers." },
];

const HERO_IMAGES = [
  {
    src: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80",
    alt: "Cinema audience watching a movie on the big screen",
  },
  {
    src: "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=1200&q=80",
    alt: "Premium movie theater seats and screen lighting",
  },
];

function Reveal({ children, className = "", reduceMotion }) {
  return (
    <motion.div
      className={className}
      initial={reduceMotion ? false : { opacity: 0, y: 18 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

function MovieSection({ title, viewAllTo, movies, category, loading, error, emptyMessage, reduceMotion }) {
  return (
    <section aria-labelledby={`${category}-heading`} className="py-12 sm:py-16">
      <Reveal reduceMotion={reduceMotion}>
        <div className="mb-7 flex items-end justify-between gap-4 border-b border-gray-200 pb-4">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase text-[#5c6ac4]">CineTix selection</p>
            <h2 id={`${category}-heading`} className="text-2xl font-bold text-gray-950 sm:text-3xl">{title}</h2>
          </div>
          <Link to={viewAllTo} className="flex shrink-0 items-center gap-1 text-sm font-semibold text-[#5c6ac4] hover:text-[#4d5ab5]">
            View All <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </Reveal>

      {loading ? (
        <div className="flex h-48 items-center justify-center" role="status" aria-label={`Loading ${title}`}>
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-gray-200 border-t-[#5c6ac4]" />
        </div>
      ) : error ? (
        <div className="border border-red-200 bg-red-50 px-4 py-8 text-center text-red-700">{error}</div>
      ) : movies.length > 0 ? (
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 lg:grid-cols-3 xl:grid-cols-4">
          {movies.map((movie, index) => (
            <motion.div
              key={movie._id}
              initial={reduceMotion ? false : { opacity: 0, y: 14 }}
              whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.35, delay: reduceMotion ? 0 : Math.min(index * 0.04, 0.16) }}
              className="w-full"
            >
              <MovieCard {...movie} category={category} />
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="border border-gray-200 bg-white px-4 py-10 text-center text-gray-500">{emptyMessage}</div>
      )}
    </section>
  );
}

export default function HomePage() {
  const [nowShowingMovies, setNowShowingMovies] = useState([]);
  const [comingSoonMovies, setComingSoonMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/movies`);
        const currentDate = new Date();
        setNowShowingMovies(response.data.filter((movie) => new Date(movie.releaseDate) <= currentDate));
        setComingSoonMovies(response.data.filter((movie) => new Date(movie.releaseDate) > currentDate));
        setError(null);
      } catch (requestError) {
        console.error("Error fetching movies:", requestError);
        setError("Failed to load movies. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchMovies();
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Navbar />

      <section className="overflow-hidden bg-black text-white" aria-labelledby="home-hero-heading">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-[1.1fr_0.9fr] md:items-center lg:px-8 lg:py-16">
          <motion.div
            className="max-w-3xl"
            initial={reduceMotion ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <p className="mb-4 text-xs font-semibold uppercase text-white/70">Now playing at CineTix</p>
            <h1 id="home-hero-heading" className="max-w-2xl text-[2rem] font-bold leading-[1.15] sm:text-5xl md:text-6xl">Experience the Magic of Cinema</h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-gray-200 sm:text-lg">Book your tickets now for the latest blockbusters</p>
            <Link to="/movies" className="mt-8 inline-flex h-11 items-center gap-2 rounded-md bg-[#5c6ac4] px-5 text-sm font-semibold text-white shadow-lg shadow-black/20 transition-colors hover:bg-[#4d5ab5] focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black">
              Browse Movies <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </motion.div>

          <motion.div
            className="grid gap-3 sm:grid-cols-2"
            initial={reduceMotion ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: "easeOut", delay: 0.1 }}
          >
            {HERO_IMAGES.map((image, index) => (
              <div
                key={image.src}
                className={`overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-2xl shadow-black/30 ${
                  index === 0 ? "sm:aspect-[4/5]" : "sm:aspect-[4/5] md:translate-y-6"
                }`}
              >
                <img
                  src={image.src}
                  alt={image.alt}
                  className="h-full w-full object-contain p-2"
                  loading={index === 0 ? "eager" : "lazy"}
                />
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      <main className="flex-grow">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <MovieSection title="Now Showing" viewAllTo="/movies" movies={nowShowingMovies} category="now-showing" loading={loading} error={error} emptyMessage="No movies currently showing. Check back soon!" reduceMotion={reduceMotion} />
        </div>

        <div className="border-y border-gray-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <MovieSection title="Coming Soon" viewAllTo="/coming-soon" movies={comingSoonMovies} category="coming-soon" loading={loading} error={error} emptyMessage="No upcoming movies announced yet. Stay tuned!" reduceMotion={reduceMotion} />
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <Reveal reduceMotion={reduceMotion}>
            <section className="overflow-hidden rounded-lg bg-black text-white">
              <div className="grid min-h-64 items-center gap-6 px-6 py-10 sm:px-10 md:grid-cols-[1fr_auto]">
                <div className="max-w-2xl">
                  <p className="mb-2 text-xs font-semibold uppercase text-[#8f9af0]">Weekly promotion</p>
                  <h2 className="text-2xl font-bold sm:text-3xl">Special Offer</h2>
                  <p className="mt-4 leading-7 text-gray-300">Get 20% off on all movie tickets every Tuesday! Use code <span className="font-bold text-[#8f9af0]">CINETUESDAY</span> at checkout.</p>
                </div>
                <button type="button" className="h-11 self-end rounded-md bg-[#5c6ac4] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#4d5ab5] md:self-center">Get Offer</button>
              </div>
            </section>
          </Reveal>

          <section className="py-16" aria-labelledby="features-heading">
            <Reveal reduceMotion={reduceMotion}>
              <div className="mx-auto mb-9 max-w-2xl text-center">
                <p className="mb-2 text-xs font-semibold uppercase text-[#5c6ac4]">Made for moviegoers</p>
                <h2 id="features-heading" className="text-2xl font-bold text-gray-950 sm:text-3xl">Why Choose CineTix?</h2>
              </div>
            </Reveal>
            <div className="grid gap-5 md:grid-cols-3">
              {FEATURES.map(({ icon: Icon, title, copy }, index) => (
                <motion.article
                  key={title}
                  initial={reduceMotion ? false : { opacity: 0, y: 14 }}
                  whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.35, delay: reduceMotion ? 0 : index * 0.06 }}
                  className="border border-gray-200 bg-white p-6 shadow-sm"
                >
                  <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-md bg-[#5c6ac4] text-white"><Icon className="h-5 w-5" aria-hidden="true" /></div>
                  <h3 className="text-lg font-semibold text-gray-950">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-gray-600">{copy}</p>
                </motion.article>
              ))}
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
