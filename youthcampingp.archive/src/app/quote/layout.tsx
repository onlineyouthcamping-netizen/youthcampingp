import React from "react";

export default function QuotationLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="quotation-layout min-h-screen">
            {/* The global Navbar and Footer from RootLayout are now visible */}
            {children}
            
            <style dangerouslySetInnerHTML={{ __html: `
                .quotation-layout {
                    position: relative;
                    z-index: 10;
                    background: white;
                }
            ` }} />
        </div>
    );
}
