'use client';

// A simple component for displaying a brand logo
const BrandLogo = ({ children }: { children: React.ReactNode }) => (
    <div className="flex items-center justify-center text-gray-500 dark:text-gray-400">
        {children}
    </div>
);

export default function SocialProof() {
    return (
        <section className="py-12 bg-background">
            <div className="container mx-auto px-4">
                <p className="text-center text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-8">
                    Trusted by high-performing teams worldwide
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 items-center">
                    {/* Placeholder logos */}
                    <BrandLogo>
                        <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="h-8 w-auto fill-current">
                            <title>Vercel</title>
                            <path d="M24 22.525H0l12-21.05 12 21.05z" />
                        </svg>
                    </BrandLogo>
                    <BrandLogo>
                        <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="h-8 w-auto fill-current">
                            <title>Stripe</title>
                            <path d="M22.508 14.542c-1.375 1.43-3.033 2.31-4.825 2.658v-4.132a.533.533 0 00-.533-.534h-2.583c-.295 0-.534.239-.534.534v7.925c0 .295.24.533.534.533h2.642c3.425 0 6.275-2.2 6.275-6.025a5.91 5.91 0 00-1.025-3.375zm-15.683 4.25h2.583c.295 0 .534-.24.534-.534V.534a.533.533 0 00-.534-.534H6.783a.533.533 0 00-.533.534v17.725c0 .295.239.533.533.533zm6.266-7.925h2.642c.294 0 .533-.24.533-.533V2.642a.533.533 0 00-.533-.534h-2.642a.533.533 0 00-.533.534v7.725c0 .295.239.533.533.533z" />
                        </svg>
                    </BrandLogo>
                    <BrandLogo>
                        <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="h-8 w-auto fill-current">
                            <title>Notion</title>
                            <path d="M22.55 12.016V1.73S23.235 0 21.1 0H3.14S.86 0 .86 2.375v19.25S.86 24 3.14 24h10.152l.216-9.601-6.191.033.06-2.42h6.129v-2.88l-4.043.02.06-2.422h4.015V1.73h4.82v5.337l.156 5.95h6.182zm-8.035 9.601h-2.01l-.125 2.383h2.25c1.48 0 2.21-1.037 2.21-2.043v-.03s-.002-1.92-2.325-1.92zm2.325-4.322c-2.07 0-3.83 1.54-3.83 3.613s1.76 3.612 3.83 3.612c2.07 0 3.83-1.54 3.83-3.612s-1.76-3.613-3.83-3.613z"/>
                        </svg>
                    </BrandLogo>
                    <BrandLogo>
                         <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="h-8 w-auto fill-current">
                            <title>Framer</title>
                            <path d="M4 0h16v8h-8zM4 8h8l8 8H4zM4 16h8v8z" />
                        </svg>
                    </BrandLogo>
                     <BrandLogo>
                        <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="h-8 w-auto fill-current">
                            <title>Linear</title>
                            <path d="M11.99 24a12 12 0 1112-12 12 12 0 01-12 12zm0-22.17a10.17 10.17 0 1010.17 10.17A10.18 10.18 0 0011.99 1.83zM12 20.3a8.3 8.3 0 118.3-8.3 8.31 8.31 0 01-8.3 8.3zm0-14.77a6.47 6.47 0 106.47 6.47 6.47 6.47 0 00-6.47-6.47z"/>
                        </svg>
                    </BrandLogo>
                    <BrandLogo>
                        <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="h-8 w-auto fill-current">
                            <title>Slack</title>
                            <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.522h5.042a2.527 2.527 0 0 1 2.521 2.522v5.042a2.527 2.527 0 0 1-2.521 2.521H8.834a2.527 2.527 0 0 1-2.521-2.521v-5.042zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521v5.042a2.528 2.528 0 0 1-2.521 2.521H3.792a2.528 2.528 0 0 1-2.521-2.521V8.834a2.528 2.528 0 0 1 2.521-2.521h5.042zM18.956 8.834a2.528 2.528 0 0 1 2.521-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.523 2.521h-2.521V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523-2.521V3.792a2.528 2.528 0 0 1 2.523-2.521h5.041a2.528 2.528 0 0 1 2.523 2.521v2.523a2.528 2.528 0 0 1-2.523 2.521h-5.041zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.523A2.528 2.528 0 0 1 15.165 24a2.528 2.528 0 0 1-2.52-2.521v-2.523h2.52zM15.165 17.688a2.528 2.528 0 0 1-2.52-2.523h-5.042a2.528 2.528 0 0 1-2.521-2.523V7.599a2.528 2.528 0 0 1 2.521-2.523h2.521a2.528 2.528 0 0 1 2.521 2.523v5.041a2.528 2.528 0 0 1 2.52 2.523v2.523z"/>
                        </svg>
                    </BrandLogo>
                </div>
            </div>
        </section>
    );
}