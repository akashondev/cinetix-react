import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const AdminPage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [movies, setMovies] = useState([]);
  const [editingMovie, setEditingMovie] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard"); // New state for active tab
  const [formData, setFormData] = useState({
    id: "",
    title: "",
    image:"",
    banner: "",
    rating: "",
    duration: "",
    genres: "",
    certificate: "",
    releaseDate: "",
    director: "",
    cast: "",
    description: "",
    trailerUrl: "",
    category: "nowShowing",
  });

  const handleLogout = () => {
    setIsLoading(true);

    setTimeout(() => {
      localStorage.removeItem("adminToken");
      navigate("/AdminLogin");
      window.location.reload();
    }, 1000);
  };

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      console.log("No token found, would redirect to login");
      return;
    }

    fetchMovies();
  }, []);

  const fetchMovies = async () => {
    try {
      const response = await fetch("http://localhost:3000/api/movies", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch movies");
      const data = await response.json();
      setMovies(data);
    } catch (err) {
      console.error(err);
      localStorage.removeItem("adminToken");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const movieData = {
      ...formData,
      id: parseInt(formData.id),
      rating: parseFloat(formData.rating),
      genres: formData.genres.split(",").map((g) => g.trim()),
      cast: formData.cast.split(",").map((c) => c.trim()),
    };

    try {
      const url = editingMovie
        ? `http://localhost:3000/api/movies/${editingMovie._id}`
        : "http://localhost:3000/api/movies";
      const method = editingMovie ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
        body: JSON.stringify(movieData),
      });

      if (!response.ok) throw new Error("Operation failed");

      fetchMovies();
      setFormData({
        id: "",
        title: "",
        image: "",
        banner: "",
        rating: "",
        duration: "",
        genres: "",
        certificate: "",
        releaseDate: "",
        director: "",
        cast: "",
        description: "",
        trailerUrl: "",
        category: "nowShowing",
      });
      setEditingMovie(null);
      setShowForm(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleEdit = (movie) => {
    setEditingMovie(movie);
    setFormData({
      id: movie.id,
      title: movie.title,
      image: movie.image,
      banner: movie.banner,
      rating: movie.rating,
      duration: movie.duration,
      genres: movie.genres.join(", "),
      certificate: movie.certificate,
      releaseDate: movie.releaseDate,
      director: movie.director,
      cast: movie.cast.join(", "),
      description: movie.description,
      trailerUrl: movie.trailerUrl,
      category: movie.category,
    });
    setShowForm(true);
    setActiveTab("movies");
  };

  const handleDelete = async (id) => {
    try {
      const response = await fetch(`http://localhost:3000/api/movies/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
      });

      if (!response.ok) throw new Error("Delete failed");
      fetchMovies();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-md">
        <div className="p-4 border-b">
          <h1 className="text-xl font-bold text-indigo-600">CineTix</h1>
          <p className="text-sm text-gray-500">admin</p>
        </div>
        <nav className="p-4">
          <ul className="space-y-2">
            <li>
              <button
                onClick={() => {
                  setActiveTab("dashboard");
                  setShowForm(false);
                }}
                className={`flex items-center w-full p-2 rounded ${
                  activeTab === "dashboard"
                    ? "text-indigo-600 bg-indigo-50"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-3"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                </svg>
                Dashboard
              </button>
            </li>
            <li>
              <button
                onClick={() => {
                  setActiveTab("movies");
                  setShowForm(false);
                }}
                className={`flex items-center w-full p-2 rounded ${
                  activeTab === "movies"
                    ? "text-indigo-600 bg-indigo-50"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-3"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm3 2h6v4H7V5zm8 8v2h1v-2h-1zm-2-2H7v4h6v-4zm2 0h1V9h-1v2zm1-4V5h-1v2h1zM5 5v2H4V5h1zm0 4H4v2h1V9zm-1 4h1v2H4v-2z"
                    clipRule="evenodd"
                  />
                </svg>
                Movies
              </button>
            </li>
            <li>
              <button className="flex items-center w-full p-2 text-gray-700 hover:bg-gray-100 rounded">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-3"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
                    clipRule="evenodd"
                  />
                </svg>
                Settings
              </button>
            </li>
            <li>
              <button className="flex items-center w-full p-2 text-gray-700 hover:bg-gray-100 rounded">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-3"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
                    clipRule="evenodd"
                  />
                </svg>
                Help
              </button>
            </li>
          </ul>
        </nav>

        <div className="absolute bottom-0 w-64 p-4 border-t">
          <button
            onClick={handleLogout}
            disabled={isLoading}
            className={`flex items-center justify-center w-full p-2 rounded transition-all ${
              isLoading
                ? "text-gray-500 bg-gray-50"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            {isLoading ? (
              <svg
                className="animate-spin h-5 w-5 mr-3 text-gray-400"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-3"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V4a1 1 0 00-1-1H3zm5 4a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1zm0 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1zm0 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            )}
            {isLoading ? "Logging out..." : "Logout"}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <header className="bg-white shadow">
          <div className="p-4 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-semibold">
                {activeTab === "dashboard" ? "Dashboard" : "Movie Management"}
              </h1>
              <p className="text-sm text-gray-500">
                {activeTab === "dashboard"
                  ? "Overview of your cinema"
                  : "Manage your movie catalog"}
              </p>
            </div>
          </div>
        </header>

        <main className="p-6">
          {activeTab === "dashboard" ? (
            <>
              {/* Dashboard Content */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-blue-100 text-blue-500 mr-4">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-8 w-8"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                        <path d="M14 6a2 2 0 012-2h2a2 2 0 012 2v8a2 2 0 01-2 2h-2a2 2 0 01-2-2V6z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-3xl font-bold">{movies.length}</p>
                      <p className="text-gray-600">Total Movies</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-green-100 text-green-500 mr-4">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-8 w-8"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-3xl font-bold">
                        {
                          movies.filter((m) => m.category === "nowShowing")
                            .length
                        }
                      </p>
                      <p className="text-gray-600">Now Showing</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-yellow-100 text-yellow-500 mr-4">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-8 w-8"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-3xl font-bold">
                        {movies.length > 0
                          ? (
                              movies.reduce(
                                (acc, curr) => acc + curr.rating,
                                0
                              ) / movies.length
                            ).toFixed(1)
                          : "0.0"}
                      </p>
                      <p className="text-gray-600">Average Rating</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Movies */}
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b">
                  <h2 className="text-lg font-semibold">Recent Movies</h2>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    {[...movies]
                      .reverse()
                      .slice(0, 3)
                      .map((movie) => (
                        <div
                          key={movie._id}
                          className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                        >
                          <div className="p-4">
                            <div className="flex justify-between items-start mb-2">
                              <h3 className="font-medium text-lg truncate">
                                {movie.title}
                              </h3>
                              <div className="flex items-center text-yellow-500">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-4 w-4"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                                <span className="ml-1 text-sm">
                                  {movie.rating}
                                </span>
                              </div>
                            </div>
                            <div className="text-sm text-gray-500 mb-2">
                              {movie.duration} • {movie.certificate}
                            </div>
                            <div className="text-xs mb-2 capitalize text-gray-600">
                              {movie.category === "nowShowing"
                                ? "Now Showing"
                                : "Coming Soon"}
                            </div>
                            <button
                              onClick={() => {
                                handleEdit(movie);
                                setActiveTab("movies");
                              }}
                              className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                            >
                              View Details
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>

                  {/* Movie Table */}
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-sm text-gray-600 border-b">
                        <th className="pb-2">Title</th>
                        <th className="pb-2">Category</th>
                        <th className="pb-2">Rating</th>
                        <th className="pb-2">Release Date</th>
                        <th className="pb-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {movies.slice(0, 6).map((movie) => (
                        <tr key={movie._id} className="text-sm border-b">
                          <td className="py-2">{movie.title}</td>
                          <td className="py-2 capitalize">{movie.category}</td>
                          <td className="py-2">{movie.rating}</td>
                          <td className="py-2">{movie.releaseDate}</td>
                          <td className="py-2">
                            <button
                              onClick={() => {
                                handleEdit(movie);
                                setActiveTab("movies");
                              }}
                              className="text-indigo-600 hover:text-indigo-800"
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {movies.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No movies found. Add your first movie using the Movies
                      tab.
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Movies Tab Content */}
              {showForm ? (
                <div className="bg-white rounded-lg shadow mb-6">
                  <div className="px-6 py-4 border-b">
                    <h2 className="text-lg font-semibold">
                      {editingMovie ? "Edit Movie" : "Add New Movie"}
                    </h2>
                  </div>
                  <div className="p-6">
                    <form
                      onSubmit={handleSubmit}
                      className="grid grid-cols-1 md:grid-cols-3 gap-4"
                    >
                      {/* Form fields */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Title
                        </label>
                        <input
                          type="text"
                          name="title"
                          value={formData.title}
                          onChange={handleInputChange}
                          className="w-full p-2 border rounded focus:ring-indigo-500 focus:border-indigo-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          image Url
                        </label>
                        <input
                          type="text"
                          name="image"
                          value={formData.image}
                          onChange={handleInputChange}
                          className="w-full p-2 border rounded focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Poster Url
                        </label>
                        <input
                          type="text"
                          name="banner"
                          value={formData.banner}
                          onChange={handleInputChange}
                          className="w-full p-2 border rounded focus:ring-indigo-500 focus:border-indigo-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Rating
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          name="rating"
                          value={formData.rating}
                          onChange={handleInputChange}
                          className="w-full p-2 border rounded focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Duration
                        </label>
                        <input
                          type="text"
                          name="duration"
                          value={formData.duration}
                          onChange={handleInputChange}
                          className="w-full p-2 border rounded focus:ring-indigo-500 focus:border-indigo-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Genres (comma separated)
                        </label>
                        <input
                          type="text"
                          name="genres"
                          value={formData.genres}
                          onChange={handleInputChange}
                          className="w-full p-2 border rounded focus:ring-indigo-500 focus:border-indigo-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Certificate
                        </label>
                        <input
                          type="text"
                          name="certificate"
                          value={formData.certificate}
                          onChange={handleInputChange}
                          className="w-full p-2 border rounded focus:ring-indigo-500 focus:border-indigo-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Release Date
                        </label>
                        <input
                          type="text"
                          name="releaseDate"
                          value={formData.releaseDate}
                          onChange={handleInputChange}
                          className="w-full p-2 border rounded focus:ring-indigo-500 focus:border-indigo-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Director
                        </label>
                        <input
                          type="text"
                          name="director"
                          value={formData.director}
                          onChange={handleInputChange}
                          className="w-full p-2 border rounded focus:ring-indigo-500 focus:border-indigo-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Cast (comma separated)
                        </label>
                        <input
                          type="text"
                          name="cast"
                          value={formData.cast}
                          onChange={handleInputChange}
                          className="w-full p-2 border rounded focus:ring-indigo-500 focus:border-indigo-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Category
                        </label>
                        <select
                          name="category"
                          value={formData.category}
                          onChange={handleInputChange}
                          className="w-full p-2 border rounded focus:ring-indigo-500 focus:border-indigo-500"
                          required
                        >
                          <option value="nowShowing">Now Showing</option>
                          <option value="comingSoon">Coming Soon</option>
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Description
                        </label>
                        <textarea
                          name="description"
                          value={formData.description}
                          onChange={handleInputChange}
                          className="w-full p-2 border rounded focus:ring-indigo-500 focus:border-indigo-500 h-24"
                          required
                        />
                      </div>
                      <div className="md:col-span-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Trailer URL
                        </label>
                        <input
                          type="text"
                          name="trailerUrl"
                          value={formData.trailerUrl}
                          onChange={handleInputChange}
                          className="w-[1040px] p-2 border rounded focus:ring-indigo-500 focus:border-indigo-500"
                          required
                        />
                      </div>
                      <div className="md:col-span-3">
                        <div className="flex items-center space-x-2">
                          <button
                            type="submit"
                            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          >
                            {editingMovie ? "Update Movie" : "Add Movie"}
                          </button>
                          {editingMovie && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingMovie(null);
                                setShowForm(false);
                              }}
                              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </div>
                    </form>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow">
                  <div className="px-6 py-4 border-b flex justify-between items-center">
                    <h2 className="text-lg font-semibold">Movies List</h2>
                    <button
                      onClick={() => setShowForm(true)}
                      className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
                    >
                      Add Movie
                    </button>
                  </div>
                  <div className="p-6">
                    <table className="w-full">
                      <thead>
                        <tr className="text-left text-sm text-gray-600 border-b">
                          <th className="pb-2">Title</th>
                          <th className="pb-2">Category</th>
                          <th className="pb-2">Rating</th>
                          <th className="pb-2">Release Date</th>
                          <th className="pb-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {movies.map((movie) => (
                          <tr key={movie._id} className="border-b">
                            <td className="py-3">{movie.title}</td>
                            <td className="py-3">
                              {movie.category === "nowShowing"
                                ? "Now Showing"
                                : "Coming Soon"}
                            </td>
                            <td className="py-3">{movie.rating}</td>
                            <td className="py-3">{movie.releaseDate}</td>
                            <td className="py-3">
                              <button
                                onClick={() => handleEdit(movie)}
                                className="text-indigo-600 hover:text-indigo-800 mr-2"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(movie._id)}
                                className="text-red-600 hover:text-red-800"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {movies.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        No movies found. Add your first movie.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminPage;
