import FloatingSocialBar from "@/components/FloatingSocialBar";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms and Conditions | YouthCamping",
  description: "Terms and conditions for YouthCamping adventure and leisure trips.",
};

export const revalidate = 30;

export default function TermsAndConditionsPage() {
  return (
    <div className="bg-white min-h-screen pt-32 pb-24">
      <div className="max-w-4xl mx-auto px-6">
        <div className="mb-16">
          <span className="text-[#FF5722] font-bold tracking-widest uppercase text-xs mb-4 block">Legal Information</span>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tighter text-zinc-900 leading-tight">
            Terms and Conditions
          </h1>
          <div className="h-1.5 w-24 bg-[#FF5722] mt-6 rounded-full"></div>
        </div>

        <div className="prose prose-stone prose-lg max-w-none 
                        prose-headings:text-zinc-900 prose-headings:font-bold prose-headings:tracking-tight
                        prose-p:text-zinc-600 prose-p:leading-relaxed 
                        prose-strong:text-zinc-900 prose-strong:font-bold
                        prose-li:text-zinc-600">
          <section className="mb-10">
            <h3 className="text-2xl font-bold text-zinc-900 mt-8 mb-4">Declaration</h3>
            <p className="mb-4">
              I hereby agree that I am participating in this Adventure &amp; leisure trip with proper medical advice on my own will &amp; risk. I am solely responsible for any injury or accident (minor/fatal) takes place during the trip. Youthcamping is not responsible for any such cases/incidents/accidents take place in the above-mentioned subject. I also understand the risk from wild animals and the dangerous state of water bodies nearby the campsite. I have agreed to the Terms and Conditions attached with this form.
            </p>
            <p className="mb-4">
              YouthCamping is a modern adventure travel company, organizes and arranges the adventure trip to the mountains which has the risk of accidents, loss of life, bodily injury, financial repercussions, etc. Neither the YouthCamping nor its agents or affiliated entities shall be responsible or liable for any accident, bodily injury, illness or death, loss or damage to baggage or property, or for any damages or claims whatsoever arising from loss (including loss of possessions and loss of enjoyment), negligence or delay from the act, error, omission default or negligence of any person not its direct employee or under its exclusive control.
            </p>
            <p className="mb-4">
              No act of misconduct or indiscipline shall be tolerated on the tours. We are a cordial travel community and we aspire to bring to you a hassle-free and memorable experience.
            </p>
          </section>

          <section className="mb-10">
            <h3 className="text-2xl font-bold text-zinc-900 mt-8 mb-4">Booking &amp; Payments</h3>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li>Bookings are accepted through the online website.</li>
              <li>Currently, we do not accept payments on our website but current account details &amp; Barcode are mentioned on our website, we only accept payment in our current account &amp; cash at our office.</li>
              <li>The final receipt of the payment will be sent to you by email or WhatsApp number you mentioned while booking.</li>
              <li>if less then 10 persons in a batch then Driver will guide, no seperate guide for less the 10 persons in a group.</li>
              <li>Youthcamping does not accept any kind of payment through any 3rd party portals, agents, booking offices, mobile applications, etc</li>
              <li>In case of Advance Payment, if any modification in schedule or planning due to unavoidable circumstances is made, the participant will have to agree with it and bear the extra charges with the remaining payment.</li>
              <li>Full Payment of the trip cost must be made before the trip begins. Pending Payments may eventually lead to the Cancellation of the trip.</li>
            </ul>
          </section>

          <section className="mb-10">
            <h3 className="text-2xl font-bold text-zinc-900 mt-8 mb-4">Communication</h3>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li>The enquiry and registration helpings would be active between 10 AM to 7 PM for all days excluding the public holidays on +91 9924246267</li>
              <li>However, the information available on the website would be considered final in case of any miscommunication or misinterpretation over the helplines.</li>
              <li>In case of any disputes, you can raise a complaint by sending us mail at <a href="mailto:info@youthcamping.in" target="_blank" rel="noopener noreferrer" className="text-[#FF5722] underline">info@youthcamping.in</a>.</li>
            </ul>
          </section>

          <section className="mb-10">
            <h3 className="text-2xl font-bold text-zinc-900 mt-8 mb-4">Transportation</h3>
            <p className="mb-4">
              Train tickets are booked with subject to availability. YouthCamping does not possess a right to change the status for waiting or RAC tickets. However, pre-mention of the status will be conveyed to participants while booking tickets.
            </p>
            <p className="mb-4">
              In case of unforeseen circumstances such as getting stuck at a place due to natural calamity, being unable to board the transport vehicle on schedule, etc.; the expenditure of extra accommodation facilities, new transport arrangements, etc. will have to be borne by the participants themselves. No such responsibility would be on part of Youthcamping.
            </p>
            <p className="mb-4">
              Before boarding the vehicle, the traveler needs to check their vehicle seats/windows. In case of damage, he/she must inform the respective representative of youthcamping. If not informed and found damaged the traveler needs to pay the repairing cost for the same.
            </p>
            <p className="mb-4">
              We don’t Provide AC in Vehicles During Journey.<br />
              <br />
              <strong>Please Note if you book Package from Mumbai, Vadodara, Surat Inter Railway Station Transfers are not Provided by YouthCamping.</strong>
            </p>
          </section>

          <section className="mb-10">
            <h3 className="text-2xl font-bold text-zinc-900 mt-8 mb-4">Cancellation &amp; refund policy</h3>
            <p className="mb-4">
              Cancellation policy is mentioned on every trip page, if not mentioned specifically then this policy would be considered final.
            </p>
            <p className="mb-4">
              cancellation would be granted by the Higher Authorities on receiving cancellation request through registered mail ID only. The cancellation Amount below mentioned will be counted on total fees only.
            </p>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li>The refund amount will be paid in 7 to 12 working days through a bank transfer</li>
              <li>Advance Booking amount is non refundable</li>
              <li>Before 45 days: 80% refund of total package cost</li>
              <li>Before 30 days: 50% refund of total package cost</li>
              <li>Before 15 days: 25% refund of total package cost</li>
              <li>Rescheduling Dates: Extra 25% of total package cost(15-30 days prior)</li>
              <li>Within 15 days: No refund</li>
              <li>No Show: No refund</li>
              <li>above charges will be applied on the total package cost.</li>
              <li>Full payment has to be done before Trip departure. if not paid, participation will be cancelled.</li>
              <li>If Trip is called off by management due to a natural calamity/unforeseen circumstances, we will issue refund of fees after deducting train ticket cancellation charges.</li>
            </ul>
          </section>

          <section className="mb-10">
            <h3 className="text-2xl font-bold text-zinc-900 mt-8 mb-4">Content of trip</h3>
            <p className="mb-4">
              The photos/videos content created on YouthCamping’s trip (by YouthCamping’s content creators or clients) is the property of YouthCamping and can only be used by YouthCamping for advertising across media platforms. None of the digital content can be used by any one without obtaining the rightful permissions by YouthCamping.
            </p>
          </section>

          <section className="mb-10">
            <h3 className="text-2xl font-bold text-zinc-900 mt-8 mb-4">Jurisdiction</h3>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li>In any type of disputes would be addressed under Ahmedabad Jurisdiction only.</li>
              <li>All travelers have to follow the laws formed by Local Authorities/Governments. In case, if anyone is found a violation of law, the local administration/government may take legal action. YouthCamping will not be held responsible in such cases.</li>
            </ul>
          </section>
        </div>
      </div>
      <FloatingSocialBar />
    </div>
  );
}
