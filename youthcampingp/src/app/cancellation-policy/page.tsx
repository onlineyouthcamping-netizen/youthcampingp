import FloatingSocialBar from "@/components/FloatingSocialBar";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cancellation Policy | YouthCamping",
  description: "Cancellation policy and refund guidelines for YouthCamping trips.",
};

export const revalidate = 30;

export default function CancellationPolicyPage() {
  return (
    <div className="bg-white min-h-screen pt-32 pb-24">
      <div className="max-w-4xl mx-auto px-6">
        <div className="mb-16">
          <span className="text-[#FF5722] font-bold tracking-widest uppercase text-xs mb-4 block">Legal Information</span>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tighter text-zinc-900 leading-tight">
            Cancellation Policy
          </h1>
          <div className="h-1.5 w-24 bg-[#FF5722] mt-6 rounded-full"></div>
        </div>

        <div className="prose prose-stone prose-lg max-w-none 
                        prose-headings:text-zinc-900 prose-headings:font-bold prose-headings:tracking-tight
                        prose-p:text-zinc-600 prose-p:leading-relaxed 
                        prose-strong:text-zinc-900 prose-strong:font-bold
                        prose-li:text-zinc-600">
          <p className="mb-4">
            Cancellation policy is mentioned on every trip page, if not mentioned specifically then this policy would be considered final.
          </p>

          <p className="mb-4">
            cancellation would be granted by the Higher Authorities on receiving cancellation request through registered mail ID only. The cancellation Amount below mentioned will be counted on total fees only.
          </p>

          <p className="mb-4">
            The refund amount will be paid in 7 to 12 working days through a bank transfer
          </p>

          <ul className="list-disc pl-6 space-y-2 mb-4">
            <li>Advance Booking amount is non refundable</li>
            <li>Before 45 days: 80% refund of total package cost</li>
            <li>Before 30 days: 50% refund of total package cost</li>
            <li>Before 15 days: 25% refund of total package cost</li>
            <li>Rescheduling Dates: Extra 25% of total package cost(20-30 days prior)</li>
            <li>Within 15 days: No refund</li>
            <li>No Show: No refund</li>
            <li>above charges will be applied on the total package cost.</li>
          </ul>

          <p className="mb-4">
            Full payment has to be done before 15 Days of Trip departure. if not paid, participation will be cancelled.
          </p>

          <p className="mb-4">
            If Trip is called off by management due to a natural calamity/unforeseen circumstances, we will issue refund of fees after deducting train tickets cancellation charges.
          </p>
        </div>
      </div>
      <FloatingSocialBar />
    </div>
  );
}
