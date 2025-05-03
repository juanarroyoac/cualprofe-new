'use client';
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface RatingData {
    id: number;
    imageUrl: string;
    alt: string;
}

const ratingData: RatingData[] = [
    { id: 1, imageUrl: "/images/ucab.png", alt: "UCAB Rating" },
    { id: 2, imageUrl: "/images/unimet.png", alt: "UNIMET Rating" },
    { id: 3, imageUrl: "/images/usb.png", alt: "USB Rating" },
    { id: 4, imageUrl: "/images/ucv.png", alt: "UCV Rating" },
    { id: 5, imageUrl: "/images/uc.png", alt: "UC Rating" },
    { id: 6, imageUrl: "/images/uma.png", alt: "UMA Rating" },
    { id: 7, imageUrl: "/images/usm.png", alt: "USM Rating" }
];

// --- Enlarged card size by ~15% ---
const CARD_WIDTH = 440; // Increased from 380
const CARD_HEIGHT = 255; // Increased from 220

const ROTATION_INTERVAL = 2000; // Keep speed at 2 seconds

const RatingCarousel = () => {
    const [currentIndex, setCurrentIndex] = useState(0);
    // Removed useRef as it's no longer needed after removing console logs

    useEffect(() => {
        // Removed console logs

        const timer = setInterval(() => {
            // Removed console logs
            setCurrentIndex((prevIndex) => (prevIndex + 1) % ratingData.length);
        }, ROTATION_INTERVAL);

        // Cleanup function
        return () => {
            // Removed console logs
            clearInterval(timer);
        };
    }, []); // Empty dependency array remains correct

    const nextIndex = (currentIndex + 1) % ratingData.length;
    const nextNextIndex = (currentIndex + 2) % ratingData.length;

    // Keeping positioning the same, adjust if needed after testing visually
    return (
        <div className="absolute top-1/2 right-0 transform -translate-y-1/2 translate-x-[-15%] md:translate-x-[-25%] lg:translate-x-[-30%] pointer-events-none">
            {/* --- Adjusted height for new CARD_HEIGHT --- */}
            <div className="relative" style={{ width: CARD_WIDTH, height: CARD_HEIGHT + 60 }}> {/* Increased spacing slightly */}
                {/* Back card */}
                <motion.div
                    key={`back-${ratingData[nextNextIndex].id}`}
                    className="absolute"
                    style={{ width: CARD_WIDTH, height: CARD_HEIGHT, zIndex: 1 }}
                    animate={{
                        // --- Adjusted animation values for larger size ---
                        y: 30, // Increased y offset
                        x: 6,  // Increased x offset slightly
                        opacity: 0.4,
                        scale: 0.80, // Decreased scale slightly for more perspective
                        rotateZ: 4.5 // Increased rotation slightly
                    }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                >
                    <img src={ratingData[nextNextIndex].imageUrl} alt={ratingData[nextNextIndex].alt} className="w-full h-full object-contain drop-shadow-md" />
                </motion.div>

                {/* Middle card */}
                <motion.div
                    key={`middle-${ratingData[nextIndex].id}`}
                    className="absolute"
                    style={{ width: CARD_WIDTH, height: CARD_HEIGHT, zIndex: 2 }}
                    animate={{
                        // --- Adjusted animation values ---
                        y: 15, // Increased y offset
                        x: 0,
                        opacity: 0.7,
                        scale: 0.90, // Adjusted scale slightly
                        rotateZ: 2.5 // Increased rotation slightly
                    }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                >
                    <img src={ratingData[nextIndex].imageUrl} alt={ratingData[nextIndex].alt} className="w-full h-full object-contain drop-shadow-lg" />
                </motion.div>

                {/* Front card */}
                <motion.div
                    key={`front-${ratingData[currentIndex].id}`}
                    className="absolute"
                    style={{ width: CARD_WIDTH, height: CARD_HEIGHT, zIndex: 3 }}
                    // --- Adjust initial to match new middle card animation ---
                    initial={{ y: 15, opacity: 0.8, scale: 0.90 }}
                    animate={{ y: 0, opacity: 1, scale: 1, rotateZ: 0 }}
                    // --- Slightly adjust exit for larger size ---
                    exit={{ y: -25, opacity: 0, rotateZ: -5, scale: 0.85 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                >
                    <img src={ratingData[currentIndex].imageUrl} alt={ratingData[currentIndex].alt} className="w-full h-full object-contain drop-shadow-xl" />
                </motion.div>
            </div>
        </div>
    );
};

export default RatingCarousel;