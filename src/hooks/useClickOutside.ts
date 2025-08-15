import { useEffect, type RefObject } from 'react';

type Event = MouseEvent | TouchEvent;

/**
 * Custom hook untuk mendeteksi klik di luar elemen yang direferensikan.
 * @param ref - Ref ke elemen DOM.
 * @param handler - Fungsi yang akan dipanggil saat klik di luar terdeteksi.
 */
export const useClickOutside = (
    ref: RefObject<HTMLElement | null>,
    handler: (event: Event) => void
) => {
    useEffect(() => {
        const listener = (event: Event) => {
            const el = ref?.current;
            // Jangan lakukan apa-apa jika elemen tidak ada atau klik terjadi di dalam elemen
            if (!el || el.contains(event.target as Node)) {
                return;
            }
            handler(event);
        };

        document.addEventListener('mousedown', listener);
        document.addEventListener('touchstart', listener);

        return () => {
            document.removeEventListener('mousedown', listener);
            document.removeEventListener('touchstart', listener);
        };
    }, [ref, handler]);
};
