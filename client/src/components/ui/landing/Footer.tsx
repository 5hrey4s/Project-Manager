'use client';

export default function Footer() {
    return (
        <footer className="border-t">
            <div className="container flex flex-col items-center justify-between gap-4 py-10 md:h-24 md:flex-row md:py-0">
                <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
                    <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
                        Built with passion. © {new Date().getFullYear()} KanbanFlow. All Rights Reserved.
                    </p>
                </div>
                {/* We can add social media links or other footer links here later */}
            </div>
        </footer>
    );
}