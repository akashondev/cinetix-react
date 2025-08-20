import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { QRCodeSVG } from "qrcode.react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const TicketPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const ticketRefs = useRef({});

  const [tickets, setTickets] = useState([]);
  const [groupedTickets, setGroupedTickets] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showQR, setShowQR] = useState({});
  const backendUrl = process.env.BACKEND_URL;

  // Toggle QR code display for specific ticket
  const toggleQR = (ticketId) => {
    setShowQR((prev) => ({
      ...prev,
      [ticketId]: !prev[ticketId],
    }));
  };

  // Fetch user tickets from API
  useEffect(() => {
    const fetchTickets = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        if (!token) {
          setError("Please login to view your tickets");
          navigate("/login");
          return;
        }

        const response = await fetch(`${backendUrl}/api/tickets`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            localStorage.removeItem("token");
            localStorage.removeItem("currentUser");
            navigate("/login");
            return;
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.success) {
          setTickets(data.data);
          groupTickets(data.data);
        } else {
          setError(data.message);
        }
      } catch (err) {
        console.error("Error fetching tickets:", err);
        setError(err.message || "Failed to load tickets");
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, [navigate]);

  // Group tickets by movie and showtime
  const groupTickets = (tickets) => {
    const grouped = {};

    tickets.forEach((ticket) => {
      const key = `${ticket.movie_id}-${ticket.date}-${ticket.time}`;
      if (!grouped[key]) {
        grouped[key] = {
          ...ticket,
          seats: [],
          qrData: JSON.stringify({
            movie: ticket.movie_title,
            seats: [],
          }),
        };
      }
      ticket.seats.forEach((seat) => {
        grouped[key].seats.push(seat);
        // Update QR data with all seats
        const qrObj = JSON.parse(grouped[key].qrData);
        qrObj.seats = grouped[key].seats;
        grouped[key].qrData = JSON.stringify(qrObj);
      });
    });

    setGroupedTickets(grouped);
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Format time for display
  const formatTime = (timeString) => {
    return timeString || "N/A";
  };

  // Print tickets
  const handlePrint = () => {
    window.print();
  };

  // Download PDF
  const handleDownloadPDF = async () => {
    try {
      const pdf = new jsPDF("p", "mm", "a4");
      const ticketKeys = Object.keys(groupedTickets);

      for (let i = 0; i < ticketKeys.length; i++) {
        const key = ticketKeys[i];
        const ticketEl = ticketRefs.current[key];

        if (ticketEl) {
          const canvas = await html2canvas(ticketEl, { scale: 2 });
          const imgData = canvas.toDataURL("image/png");

          if (i > 0) pdf.addPage();

          const imgProps = pdf.getImageProperties(imgData);
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

          pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
        }
      }

      pdf.save("cinetix-tickets.pdf");
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    }
  };

  // Share tickets
  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: "My CineTix Tickets",
          text: "Check out my movie tickets!",
          url: window.location.href,
        });
      } else {
        // Fallback for browsers without Share API
        await navigator.clipboard.writeText(window.location.href);
        alert("Link copied to clipboard. You can share it manually.");
      }
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[#5c6ac4]"></div>
      </div>
    );
  }

  if (error || Object.keys(groupedTickets).length === 0) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow bg-gray-50 py-8">
          <div className="container mx-auto px-6 text-center">
            <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-8">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 text-yellow-500"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-9a1 1 0 012 0v4a1 1 0 11-2 0V9zm1-3a1 1 0 100-2 1 1 0 000 2z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold mb-2">No Tickets Found</h2>
              <p className="text-gray-600 mb-6">
                {error || "You haven't booked any tickets yet."}
              </p>
              <button
                onClick={() => navigate("/movies")}
                className="px-6 py-2 bg-[#5c6ac4] text-white rounded-md hover:bg-opacity-90"
              >
                Book Tickets Now
              </button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      {/* Main Content */}
      <main className="flex-grow bg-gray-50 py-8">
        <div className="container mx-auto px-6">
          {/* Ticket header */}
          <section className="mb-8 text-center">
            <h1 className="text-2xl md:text-3xl font-bold mb-2">
              Your Tickets
            </h1>
            <p className="text-gray-600">
              {Object.keys(groupedTickets).length} booking
              {Object.keys(groupedTickets).length !== 1 ? "s" : ""} found
            </p>
          </section>

          {/* Action buttons */}
          <div className="flex flex-wrap justify-center gap-3 mb-8 no-print">
            <button
              onClick={handlePrint}
              className="flex items-center px-4 py-2 bg-[#5c6ac4] text-white rounded-md hover:bg-opacity-90"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                />
              </svg>
              Print Tickets
            </button>
            <button
              onClick={handleDownloadPDF}
              className="flex items-center px-4 py-2 bg-[#5c6ac4] text-white rounded-md hover:bg-opacity-90"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              Download PDF
            </button>
            <button
              onClick={handleShare}
              className="flex items-center px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                />
              </svg>
              Share
            </button>
          </div>

          {/* Tickets */}
          <div className="max-w-3xl mx-auto mb-8">
            {Object.keys(groupedTickets).map((key, index) => {
              const ticket = groupedTickets[key];
              return (
                <div
                  key={key}
                  className="mb-6"
                  ref={(el) => (ticketRefs.current[key] = el)}
                >
                  <div className="bg-white rounded-lg overflow-hidden shadow-md border border-gray-200">
                    {/* Ticket header bar */}
                    <div className="bg-black text-white p-4 flex justify-between items-center">
                      <div className="font-bold text-lg">CineTix</div>
                      <div className="text-sm">
                        Booking #{ticket.session_id || ticket._id}
                      </div>
                    </div>

                    {/* Ticket content */}
                    <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Left column */}
                      <div className="md:col-span-2">
                        <h2 className="text-xl font-bold mb-4">
                          {ticket.movie_title || "Movie Title"}
                        </h2>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                          <div>
                            <p className="text-sm text-gray-500">Date</p>
                            <p className="font-medium">
                              {formatDate(ticket.date)}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Time</p>
                            <p className="font-medium">
                              {formatTime(ticket.time)}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Theater</p>
                            <p className="font-medium">
                              {ticket.cinema || "Theater Name"}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Location</p>
                            <p className="font-medium">
                              {ticket.location || "Location"}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Seats</p>
                            <div className="flex flex-wrap gap-2">
                              {ticket.seats.map((seat, idx) => (
                                <span
                                  key={idx}
                                  className="font-bold text-lg text-[#5c6ac4]"
                                >
                                  {seat}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Day</p>
                            <p className="font-medium">{ticket.day || "Day"}</p>
                          </div>
                        </div>

                        <div className="mb-4">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-500">
                              Total Price
                            </span>
                            <span className="font-bold text-lg">
                              ₹{ticket.price * ticket.seats.length || 0}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-sm text-gray-500">
                            <span>
                              {ticket.seats.length} ticket
                              {ticket.seats.length !== 1 ? "s" : ""} × ₹
                              {ticket.price}
                            </span>
                            <span></span>
                          </div>
                        </div>

                        <div className="text-sm text-gray-500">
                          <p>
                            Purchased on{" "}
                            {new Date(
                              ticket.createdAt || ticket.date
                            ).toLocaleDateString()}{" "}
                            at{" "}
                            {new Date(
                              ticket.createdAt || ticket.date
                            ).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>

                      {/* Right column with QR code */}
                      <div
                        className="w-32 h-32 bg-gray-100 rounded flex items-center justify-center cursor-pointer"
                        onClick={() => toggleQR(key)}
                      >
                        {showQR[key] ? (
                          <QRCodeSVG // Changed component name
                            value={ticket.qrData}
                            size={120}
                            level="H"
                            includeMargin={true}
                            bgColor="#FFFFFF"
                            fgColor="#000000"
                          />
                        ) : (
                          <div className="text-center">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-10 w-10 mx-auto mb-2 text-gray-400"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                              />
                            </svg>
                            <p className="text-sm text-gray-500">
                              Click to view QR
                            </p>
                          </div>
                        )}
                      </div>
                      <p className="mt-2 text-xs text-center text-gray-500">
                        Scan at theater entrance
                      </p>
                      {showQR[key] && (
                        <button
                          className="mt-2 text-xs text-blue-500 hover:underline"
                          onClick={() => toggleQR(key)}
                        >
                          Hide QR Code
                        </button>
                      )}
                    </div>

                    {/* Ticket footer with perforated edge effect */}
                    <div className="border-t border-dashed border-gray-300 relative">
                      <div className="absolute left-0 -top-3 w-6 h-6 rounded-full bg-gray-50"></div>
                      <div className="absolute right-0 -top-3 w-6 h-6 rounded-full bg-gray-50"></div>

                      <div className="p-4 flex justify-between items-center">
                        <div>
                          <p className="text-sm text-gray-500">
                            Booking ID: {ticket.session_id || ticket._id}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">
                            www.cinetix.com
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Additional information */}
          <section className="max-w-3xl mx-auto no-print">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-4">
                Important Information
              </h3>

              <div className="space-y-3 text-sm text-gray-600">
                <p>
                  <span className="font-medium">Ticket Validation:</span> Please
                  arrive at the theater at least 15 minutes before showtime.
                  Show these tickets on your mobile device or as a printout.
                </p>
                <p>
                  <span className="font-medium">Cancellation Policy:</span>{" "}
                  Tickets can be canceled up to 2 hours before showtime for a
                  full refund.
                </p>
                <p>
                  <span className="font-medium">Food & Beverages:</span> Outside
                  food and beverages are not permitted. Concessions are
                  available at the theater.
                </p>
                <p>
                  <span className="font-medium">Need Help?</span> Contact our
                  customer service at support@cinetix.com or call (555)
                  123-4567.
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

export default TicketPage;
