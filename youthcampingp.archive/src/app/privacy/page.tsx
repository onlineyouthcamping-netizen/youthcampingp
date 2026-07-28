import { fetchPageBySlug } from "@/lib/api";
import PageRenderer from "@/components/PageRenderer";
import FloatingSocialBar from "@/components/FloatingSocialBar";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | YouthCamping",
  description: "Learn about how YouthCamping collects and uses your data. Your privacy is our priority.",
};

export const revalidate = 30;

export default async function PrivacyPage() {
  const page = await fetchPageBySlug('privacy');

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
            Privacy <br />
            <span className="italic font-serif font-normal text-zinc-400">Policy</span>
          </h1>
          <div className="h-1.5 w-24 bg-[#FF5722] mt-8 rounded-full"></div>
        </div>

        <div className="prose prose-stone prose-lg max-w-none 
                        prose-headings:text-zinc-900 prose-headings:font-black prose-headings:uppercase prose-headings:tracking-tight
                        prose-p:text-zinc-600 prose-p:leading-relaxed 
                        prose-strong:text-zinc-900 prose-strong:font-black
                        prose-li:text-zinc-600">
          <section className="mb-12">
            <h2 className="text-3xl mt-12 mb-6">Introduction</h2>
            <p>
              At YouthCamping, accessible from youthcamping.online, one of our main priorities is the privacy of our visitors. This Privacy Policy document contains types of information that is collected and recorded by YouthCamping and how we use it.
            </p>
            <p>
              If you have additional questions or require more information about our Privacy Policy, do not hesitate to contact us.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-3xl mt-12 mb-6">Log Files</h2>
            <p>
              YouthCamping follows a standard procedure of using log files. These files log visitors when they visit websites. All hosting companies do this and a part of hosting services' analytics. The information collected by log files include internet protocol (IP) addresses, browser type, Internet Service Provider (ISP), date and time stamp, referring/exit pages, and possibly the number of clicks. These are not linked to any information that is personally identifiable.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-3xl mt-12 mb-6">Cookies and Web Beacons</h2>
            <p>
              Like any other website, YouthCamping uses &apos;cookies&apos;. These cookies are used to store information including visitors&apos; preferences, and the pages on the website that the visitor accessed or visited. The information is used to optimize the users&apos; experience by customizing our web page content based on visitors&apos; browser type and/or other information.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-3xl mt-12 mb-6">Privacy Policies</h2>
            <p>
              You may consult this list to find the Privacy Policy for each of the advertising partners of YouthCamping.
            </p>
            <p>
              Third-party ad servers or ad networks uses technologies like cookies, JavaScript, or Web Beacons that are used in their respective advertisements and links that appear on YouthCamping, which are sent directly to users&apos; browser. They automatically receive your IP address when this occurs. These technologies are used to measure the effectiveness of their advertising campaigns and/or to personalize the advertising content that you see on websites that you visit.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-3xl mt-12 mb-6">Third Party Privacy Policies</h2>
            <p>
              YouthCamping&apos;s Privacy Policy does not apply to other advertisers or websites. Thus, we are advising you to consult the respective Privacy Policies of these third-party ad servers for more detailed information. It may include their practices and instructions about how to opt-out of certain options.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-3xl mt-12 mb-6">Consent</h2>
            <p>
              By using our website, you hereby consent to our Privacy Policy and agree to its Terms and Conditions.
            </p>
          </section>
        </div>
      </div>
      <FloatingSocialBar />
    </div>
  );
}
