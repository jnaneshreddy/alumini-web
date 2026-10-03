"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type Slide = {
  id: string;
  title: string;
  caption?: string | null;
  imagePath: string;
  altText: string;
  position?: number;
};

export function HomeCarousel({ slides }: { slides: Slide[] }) {
  const [slideIndex, setSlideIndex] = useState(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (slides.length <= 1) return;

    const interval = setInterval(() => {
      setSlideIndex((current) => (current + 1) % slides.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [slides.length]);

  if (!slides.length) {
    return null;
  }

  const currentSlide = slides[slideIndex] ?? slides[0];

  return (
    <section className="carousel" aria-label="School photo gallery">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide.id}
          className="slide"
          initial={reduceMotion ? false : { opacity: 0, scale: 1.025 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={reduceMotion ? undefined : { opacity: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.45, ease: "easeOut" }}
          style={{ backgroundImage: `url(${currentSlide.imagePath})`, backgroundSize: "cover", backgroundPosition: "center" }}
        >
        <div>
          <Badge>ALUMNI MOMENTS</Badge>
          <h2>{currentSlide.title}</h2>
          <p>{currentSlide.caption ?? "A shared place for learning, connection and lifelong memories."}</p>
        </div>
        </motion.div>
      </AnimatePresence>

      <Button
        className="prev"
        variant="secondary"
        size="icon"
        onClick={() => setSlideIndex((slideIndex - 1 + slides.length) % slides.length)}
        aria-label="Previous photo"
      >
        <ChevronLeft />
      </Button>

      <Button
        className="next"
        variant="secondary"
        size="icon"
        onClick={() => setSlideIndex((slideIndex + 1) % slides.length)}
        aria-label="Next photo"
      >
        <ChevronRight />
      </Button>

      <div className="dots">
        {slides.map((slide, index) => (
          <button
            key={slide.id}
            onClick={() => setSlideIndex(index)}
            className={index === slideIndex ? "active" : ""}
            aria-label={`Photo ${index + 1}`}
            title={slide.altText}
          />
        ))}
      </div>
    </section>
  );
}
