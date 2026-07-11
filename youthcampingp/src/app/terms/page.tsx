import { fetchPageBySlug } from "@/lib/api";
import PageRenderer from "@/components/PageRenderer";
import FloatingSocialBar from "@/components/FloatingSocialBar";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms & Conditions | YouthCamping",
  description: "Read the terms and conditions for using the YouthCamping platform and booking services.",
};

export const revalidate = 30;

export default async function TermsPage() {
  const page = await fetchPageBySlug('terms');

  if (page && page.sections && page.sections.length > 0) {
    return (
      <div className="flex flex-col min-h-screen bg-white pt-20">
        <PageRenderer sections={page.sections} />
        <FloatingSocialBar />
      </div>
    );
  }

  // Fallback if no CMS content exists
  return (
    <div className="bg-white min-h-screen pt-32 pb-24">
      <div className="max-w-4xl mx-auto px-6">
        <div className="mb-16">
          <span className="text-[#FF5722] font-bold tracking-widest capitalize text-xs mb-4 block">Legal Information</span>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-zinc-900 leading-tight">
            Terms <br />
            <span className="italic font-serif font-normal text-zinc-400">& Conditions</span>
          </h1>
          <div className="h-1.5 w-24 bg-[#FF5722] mt-8 rounded-full"></div>
        </div>

        <div className="prose prose-stone prose-lg max-w-none 
                        prose-headings:text-zinc-900 prose-headings:font-black prose-headings:uppercase prose-headings:tracking-tight
                        prose-p:text-zinc-600 prose-p:leading-relaxed 
                        prose-strong:text-zinc-900 prose-strong:font-black
                        prose-li:text-zinc-600">
          <section className="mb-12">
            <h2 className="text-3xl mt-12 mb-6">1. Acceptance of Terms</h2>
            <p>
              By accessing and using youthcamping.online, you accept and agree to be bound by the terms and provision of this agreement. In addition, when using these particular services, you shall be subject to any posted guidelines or rules applicable to such services.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-3xl mt-12 mb-6">2. Description of Service</h2>
            <p>
              YouthCamping provides users with access to a rich collection of resources, including various travel packages, booking systems, and information regarding destinations. You understand and agree that the Service may include advertisements and that these advertisements are necessary for YouthCamping to provide the Service.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-3xl mt-12 mb-6">3. Booking Policy</h2>
            <p>
              When you make a booking through our website, you are entering into a direct contract with YouthCamping. All bookings are subject to availability and confirmation. We reserve the right to cancel any booking if the information provided is incorrect or if the payment is not received within the specified timeframe.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-3xl mt-12 mb-6">4. Cancellation and Refunds</h2>
            <p>
              Our cancellation and refund policies vary depending on the trip and time of cancellation. Detailed information regarding cancellation charges will be provided at the time of booking. Generally, cancellations made closer to the departure date will incur higher charges.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-3xl mt-12 mb-6">5. User Conduct</h2>
            <p>
              You agree to use the website only for lawful purposes. You are prohibited from posting or transmitting through the website any material that is unlawful, harmful, threatening, abusive, harassing, defamatory, vulgar, obscene, sexually explicit, profane, hateful, or otherwise objectionable.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-3xl mt-12 mb-6">6. Intellectual Property</h2>
            <p>
              All content included on this site, such as text, graphics, logos, images, and software, is the property of YouthCamping or its content suppliers and protected by international copyright laws.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-3xl mt-12 mb-6">7. Limitation of Liability</h2>
            <p>
              YouthCamping shall not be liable for any direct, indirect, incidental, special or consequential damages resulting from the use or the inability to use the service or for cost of procurement of substitute goods and services.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-3xl mt-12 mb-6">8. Changes to Terms</h2>
            <p>
              YouthCamping reserves the right to change these conditions from time to time as it sees fit and your continued use of the site will signify your acceptance of any adjustment to these terms.
            </p>
          </section>
        </div>
      </div>
      <FloatingSocialBar />
    </div>
  );
}
