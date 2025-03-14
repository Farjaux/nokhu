import { useRef, useState, useCallback, useEffect } from 'react';

/**
 * A hook that manages horizontal scrolling in a container,
 * providing arrow visibility and scroll actions.
 */
export function useHorizontalScroll({
  threshold = 5,
  scrollAmount = 200,
} = {}) {
  const containerRef = useRef(null);
  const [showArrows, setShowArrows] = useState({ left: false, right: false });

  // Updates arrow visibility based on container's scroll position
  const updateArrows = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    const atLeft = scrollLeft <= threshold;
    const atRight = scrollLeft + clientWidth >= scrollWidth - threshold;
    setShowArrows({ left: !atLeft, right: !atRight });
  }, [threshold]);

  // Attaches listeners for scrolling + window resize
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Initial check
    updateArrows();
    container.addEventListener('scroll', updateArrows);
    window.addEventListener('resize', updateArrows);

    return () => {
      container.removeEventListener('scroll', updateArrows);
      window.removeEventListener('resize', updateArrows);
    };
  }, [updateArrows]);

  // 🚀 NEW: Auto-update when child elements change
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new MutationObserver(() => {
      setTimeout(updateArrows, 100); // Minor delay to let DOM update first
    });

    observer.observe(container, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, [updateArrows]);

  // Scroll left or right by a fixed amount
  const scrollContainer = useCallback(
    direction => {
      const container = containerRef.current;
      if (!container) return;

      container.scrollBy({
        left: direction === 'right' ? scrollAmount : -scrollAmount,
        behavior: 'smooth',
      });

      setTimeout(updateArrows, 300); // Update after scroll animation
    },
    [scrollAmount, updateArrows]
  );

  return {
    containerRef,
    showArrows,
    scrollContainer,
    updateArrows,
  };
}
