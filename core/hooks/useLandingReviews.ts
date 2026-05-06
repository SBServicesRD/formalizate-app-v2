import { useState, useEffect } from 'react';

export interface GoogleReview {
    author_name: string;
    profile_photo_url: string | null;
    rating: number;
    text: string;
    relative_time_description: string;
}

export const useLandingReviews = () => {
    const [reviews, setReviews] = useState<GoogleReview[]>([]);
    const [isLoadingReviews, setIsLoadingReviews] = useState(true);

    useEffect(() => {
        const fetchReviews = async () => {
            try {
                const response = await fetch('/api/reviews');
                const data = await response.json();

                if (data.reviews && data.reviews.length > 0) {
                    setReviews(data.reviews);
                }
            } catch {
                // Silently fall back to static testimonials
            } finally {
                setIsLoadingReviews(false);
            }
        };

        fetchReviews();
    }, []);

    return { reviews, isLoadingReviews };
};
