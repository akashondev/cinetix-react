import React, { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import MovieCard from "./MovieCard";
//import moviesData from "./movies.json";
import axios from "axios";

const HomePage = () => {
  const [nowShowingMovies, setNowShowingMovies] = useState([]);
  const [comingSoonMovies, setComingSoonMovies] = useState([]);
  const [scrollY, setScrollY] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Refs for scroll animations
  const heroRef = useRef(null);
  const promoRef = useRef(null);

  useEffect(() => {
    // Fetch movies from backend API
    const fetchMovies = async () => {
      try {
        setLoading(true);
        const response = await axios.get("http://localhost:3000/api/movies");

        // Assuming your backend returns all movies, we'll filter them
        const allMovies = response.data;

        // For demo, let's split into nowShowing and comingSoon based on release date
        const currentDate = new Date();

        const nowShowing = allMovies.filter((movie) => {
          const releaseDate = new Date(movie.releaseDate);
          return releaseDate <= currentDate;
        });

        const comingSoon = allMovies.filter((movie) => {
          const releaseDate = new Date(movie.releaseDate);
          return releaseDate > currentDate;
        });

        setNowShowingMovies(nowShowing);
        setComingSoonMovies(comingSoon);
        setError(null);
      } catch (err) {
        console.error("Error fetching movies:", err);
        setError("Failed to load movies. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchMovies();

    // Handle scroll events
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Check if element is in viewport
  const isInViewport = (element) => {
    if (!element) return false;
    const rect = element.getBoundingClientRect();
    return rect.top <= window.innerHeight - 100 && rect.bottom >= 0;
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      {/* Hero Section with Enhanced Animation */}
      <div ref={heroRef} className="relative h-96 bg-black overflow-hidden">
        {/* <img
          src="/api/placeholder/1200/500"
          alt="Featured movie"
          className="w-full h-full object-cover opacity-50 transition-transform duration-1000"
          style={{
            transform: `scale(${1 + scrollY * 0.0005}) translateY(${
              scrollY * 0.2
            }px)`,
          }}
        /> */}
        <div
          className="absolute inset-0 flex flex-col justify-center items-center text-white p-6 transition-all duration-700"
          style={{
            transform: `translateY(${scrollY * -0.15}px)`,
            opacity: 1 - scrollY * 0.002,
          }}
        >
          <h1
            className="text-4xl md:text-5xl font-bold mb-4 text-center transition-all duration-700"
            style={{
              transform: scrollY < 100 ? "translateY(0)" : "translateY(-20px)",
              opacity: scrollY < 100 ? 1 : 0.7,
              textShadow: `0 0 ${scrollY * 0.01}px rgba(92, 106, 196, 0.8)`,
            }}
          >
            Experience the Magic of Cinema
          </h1>
          <p
            className="text-xl md:text-2xl mb-8 text-center max-w-3xl transition-all duration-700"
            style={{
              transform: scrollY < 100 ? "translateY(0)" : "translateY(-10px)",
              opacity: scrollY < 100 ? 1 : 0.8,
              filter: `blur(${scrollY * 0.01}px)`,
            }}
          >
            Book your tickets now for the latest blockbusters
          </p>
          <Link
            to="/movies"
            className="inline-flex items-center justify-center rounded-full font-medium transition-all duration-300 text-sm px-6 py-3 bg-[#5c6ac4] text-white hover:bg-opacity-90 hover:scale-105"
            style={{
              transform: scrollY < 100 ? "scale(1)" : "scale(0.95)",
              boxShadow:
                scrollY < 100
                  ? "0 0 20px rgba(92, 106, 196, 0.3)"
                  : "0 0 10px rgba(92, 106, 196, 0.15)",
            }}
          >
            Browse Movies
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-grow bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          {/* Now Showing Section */}
          <section className="mb-12">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Now Showing</h2>
              <Link
                to="/movies"
                className="text-[#5c6ac4] flex items-center hover:underline"
              >
                View All
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 ml-1"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </Link>
            </div>

            {loading ? (
              <div className="flex justify-center items-center h-40">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#5c6ac4]"></div>
              </div>
            ) : error ? (
              <div className="text-center py-8 text-red-500">{error}</div>
            ) : nowShowingMovies.length > 0 ? (
              <div className="max-w-[200vh] mx-auto grid [grid-template-columns:repeat(auto-fit,minmax(250px,auto))] gap-8 mt-5 mb-4">
                {nowShowingMovies.map((movie) => (
                  <MovieCard key={movie._id} {...movie} category="now-showing"/>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No movies currently showing. Check back soon!
              </div>
            )}
          </section>


          {/* Coming Soon Section */}
          <section className="mb-12">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Coming Soon</h2>
              <Link
                to="/coming-soon"
                className="text-[#5c6ac4] flex items-center hover:underline"
              >
                View All
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 ml-1"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </Link>
            </div>

            {loading ? (
              <div className="flex justify-center items-center h-40">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#5c6ac4]"></div>
              </div>
            ) : error ? (
              <div className="text-center py-8 text-red-500">{error}</div>
            ) : comingSoonMovies.length > 0 ? (
              <div className="max-w-[200vh] mx-auto grid [grid-template-columns:repeat(auto-fit,minmax(250px,auto))] gap-8 mt-5 mb-4">
                {comingSoonMovies.map((movie) => (
                  <MovieCard key={movie._id} {...movie}  category="coming-soon" />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No upcoming movies announced yet. Stay tuned!
              </div>
            )}
          </section>

          {/* Promo Section with Enhanced Animation */}
          <section
            ref={promoRef}
            className="mb-12 bg-black text-white rounded-xl overflow-hidden relative"
          >
            <div
              className="absolute inset-0 bg-black opacity-50 transition-opacity duration-700"
              style={{
                opacity: isInViewport(promoRef.current) ? 0.5 : 0,
              }}
            ></div>

            <div className="grid md:grid-cols-2 relative z-10">
              <div
                className="p-8 flex flex-col justify-center transition-all duration-1000"
                style={{
                  transform: isInViewport(promoRef.current)
                    ? "translateX(0)"
                    : "translateX(-50px)",
                  opacity: isInViewport(promoRef.current) ? 1 : 0,
                }}
              >
                <h2
                  className="text-2xl font-bold mb-4 transition-all duration-700"
                  style={{
                    transform: isInViewport(promoRef.current)
                      ? "translateY(0)"
                      : "translateY(20px)",
                    opacity: isInViewport(promoRef.current) ? 1 : 0,
                    transitionDelay: "200ms",
                  }}
                >
                  Special Offer
                </h2>
                <p
                  className="text-gray-300 mb-6 transition-all duration-700"
                  style={{
                    transform: isInViewport(promoRef.current)
                      ? "translateY(0)"
                      : "translateY(20px)",
                    opacity: isInViewport(promoRef.current) ? 1 : 0,
                    transitionDelay: "400ms",
                  }}
                >
                  Get 20% off on all movie tickets every Tuesday! Use code{" "}
                  <span
                    className="font-bold text-[#5c6ac4] transition-all duration-500"
                    style={{
                      textShadow: isInViewport(promoRef.current)
                        ? "0 0 10px rgba(92, 106, 196, 0.8)"
                        : "none",
                    }}
                  >
                    CINETUESDAY
                  </span>{" "}
                  at checkout.
                </p>
                <button
                  className="self-start inline-flex items-center justify-center rounded-full font-medium transition-all duration-500 text-sm px-4 py-2 bg-[#5c6ac4] text-white hover:bg-opacity-90"
                  style={{
                    transform: isInViewport(promoRef.current)
                      ? "translateY(0) scale(1)"
                      : "translateY(20px) scale(0.95)",
                    opacity: isInViewport(promoRef.current) ? 1 : 0,
                    transitionDelay: "600ms",
                    boxShadow: isInViewport(promoRef.current)
                      ? "0 0 20px rgba(92, 106, 196, 0.5)"
                      : "none",
                  }}
                >
                  Get Offer
                </button>
              </div>
              <div className="h-64 md:h-auto overflow-hidden">
                {/* <img
                  src="../offer.svg"
                  className="w-full h-full object-cover transition-all duration-1000"
                  style={{
                    transform: isInViewport(promoRef.current)
                      ? "scale(1) translateX(0)"
                      : "scale(1.1) translateX(50px)",
                    opacity: isInViewport(promoRef.current) ? 1 : 0.5,
                  }}
                /> */}
              </div>
            </div>
          </section>

          {/* Features Section */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-8 text-center">
              Why Choose CineTix?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center p-6 bg-white rounded-lg shadow-md">
                <div className="w-16 h-16 mx-auto mb-4 bg-[#5c6ac4] rounded-full flex items-center justify-center text-white">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  Hassle-free Booking
                </h3>
                <p className="text-gray-600">
                  Book your tickets in seconds with our easy-to-use platform.
                </p>
              </div>

              <div className="text-center p-6 bg-white rounded-lg shadow-md">
                <div className="w-16 h-16 mx-auto mb-4 bg-[#5c6ac4] rounded-full flex items-center justify-center text-white">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Secure Payments</h3>
                <p className="text-gray-600">
                  Multiple secure payment options for a worry-free experience.
                </p>
              </div>

              <div className="text-center p-6 bg-white rounded-lg shadow-md">
                <div className="w-16 h-16 mx-auto mb-4 bg-[#5c6ac4] rounded-full flex items-center justify-center text-white">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Exclusive Offers</h3>
                <p className="text-gray-600">
                  Regular discounts and special promotions for our loyal
                  customers.
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default HomePage;
