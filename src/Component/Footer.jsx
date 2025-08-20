import React from "react";
import { Mail, Phone, Instagram, Twitter, Facebook } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-black text-white py-8">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <h3 className="text-xl font-bold mb-4">CineTix</h3>
            <p className="text-gray-300 text-sm">
              The ultimate destination for booking movie tickets online.
              Experience the magic of cinema with just a few clicks.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-gray-300 text-sm">
              <li>
                <a href="/" className="hover:text-white">
                  Home
                </a>
              </li>
              <li>
                <a href="/movies" className="hover:text-white">
                  Movies
                </a>
              </li>
              <li>
                <a href="/theaters" className="hover:text-white">
                  Theaters
                </a>
              </li>
              <li>
                <a href="/offers" className="hover:text-white">
                  Offers & Discounts
                </a>
              </li>
              <li>
                <a href="/about" className="hover:text-white">
                  About Us
                </a>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Support</h3>
            <ul className="space-y-2 text-gray-300 text-sm">
              <li>
                <a href="/faq" className="hover:text-white">
                  FAQs
                </a>
              </li>
              <li>
                <a href="/terms" className="hover:text-white">
                  Terms & Conditions
                </a>
              </li>
              <li>
                <a href="/privacy" className="hover:text-white">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="/refund" className="hover:text-white">
                  Refund Policy
                </a>
              </li>
              <li>
                <a href="/contact" className="hover:text-white">
                  Contact Us
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact Us</h3>
            <div className="space-y-2 text-gray-300 text-sm">
              <p className="flex items-center">
                <Phone size={16} className="mr-2" />
                +1 (555) 123-4567
              </p>
              <p className="flex items-center">
                <Mail size={16} className="mr-2" />
                support@cinetix.com
              </p>
              <div className="flex space-x-4 mt-4">
                <a href="#" className="hover:text-[#5c6ac4]">
                  <Facebook size={20} />
                </a>
                <a href="#" className="hover:text-[#5c6ac4]">
                  <Twitter size={20} />
                </a>
                <a href="#" className="hover:text-[#5c6ac4]">
                  <Instagram size={20} />
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-6 text-center text-gray-400 text-sm">
          <p>&copy; {new Date().getFullYear()} CineTix. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
