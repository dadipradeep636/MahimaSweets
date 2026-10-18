'use client';

import { Camera, Clock3, IndianRupee, PackageX } from 'lucide-react';
import LegalPage, { GrievanceContact, useBusiness } from '@/components/LegalPage';
import { shop, whatsappLink } from '@/lib/shop';

export default function RefundPolicyPage() {
  const b = useBusiness();
  return (
    <LegalPage path="/refund-policy/" eyebrow="NO SURPRISES" title="Refund & Cancellation Policy" intro="Our sweets and snacks are fresh food made for your order, so this is how cancellations, refunds and problems are handled.">
      <div className="legal-summary">
        <div><Clock3 size={20} /><p><strong>Within 30 minutes</strong><span>Cancel from your order page for a full refund.</span></p></div>
        <div><Camera size={20} /><p><strong>Damaged or wrong item</strong><span>Tell us within 2 hours of pickup with a photo – we replace or refund.</span></p></div>
        <div><IndianRupee size={20} /><p><strong>Refunds in 5–7 days</strong><span>Back to the same UPI account you paid from.</span></p></div>
        <div><PackageX size={20} /><p><strong>Not collected</strong><span>Fresh food cannot be resold, so the advance is kept.</span></p></div>
      </div>

      <div className="legal-body">
        <section>
          <h2><span>1</span>Cancelling your order</h2>
          <ul>
            <li><strong>Within 30 minutes of placing the order:</strong> tap “Cancel order” on your order page. Anything you paid is refunded in full.</li>
            <li><strong>After 30 minutes:</strong> we may already have started preparing your order, so it cannot be cancelled online. Please call us on <a href={`tel:${shop.telephone}`}>{shop.phone}</a>. If preparation has not started, we will cancel it and refund you in full. If it has started, the advance may not be refundable, but we can often move your pickup to another time instead.</li>
            <li><strong>Unpaid orders</strong> are cancelled automatically after 2 hours. Nothing is charged.</li>
          </ul>
        </section>

        <section>
          <h2><span>2</span>If we cancel</h2>
          <p>If an item runs out, a price was shown wrongly, or we cannot have your order ready on time, we will contact you. You can choose a replacement or a different pickup time, or cancel. If the order is cancelled, you get a <strong>full refund</strong> of anything you paid.</p>
        </section>

        <section>
          <h2><span>3</span>Damaged, wrong or missing items</h2>
          <ul>
            <li>Please check your order at the counter – we will fix any problem on the spot.</li>
            <li>If you find a problem after leaving, tell us <strong>within 2 hours of pickup</strong> by <a href={whatsappLink('Hi Mahima Sweets! I have a problem with my order. Order number: ')} target="_blank" rel="noopener noreferrer">WhatsApp</a> or phone, with your order number and a photo.</li>
            <li>After checking, we will <strong>replace</strong> the affected items or <strong>refund</strong> their value – your choice.</li>
          </ul>
        </section>

        <section>
          <h2><span>4</span>What we cannot refund</h2>
          <p>Because our products are fresh, perishable food, we cannot accept returns or give refunds for:</p>
          <ul>
            <li>a change of mind or taste preference after pickup;</li>
            <li>items that were not stored as advised, or were eaten past the suggested time;</li>
            <li>problems reported more than 2 hours after pickup (except food safety issues – please always tell us).</li>
          </ul>
          <p>If you have a food safety concern, please contact us right away. You can also report it to FSSAI through the Food Safety Connect app.</p>
        </section>

        <section>
          <h2><span>5</span>Orders not collected</h2>
          <p>We keep your order until closing time (9:30 PM) on the pickup day. If it is not collected and you did not tell us beforehand, the sweets cannot be sold again, so the <strong>advance paid is not refunded</strong> and no balance is charged. If something comes up, call us before your pickup time – we will try to move your pickup to the next day where the product allows.</p>
        </section>

        <section>
          <h2><span>6</span>How refunds are paid</h2>
          <ul>
            <li>Refunds go back to <strong>the same UPI account</strong> you paid from, within <strong>5–7 working days</strong> after approval.</li>
            <li>Your order page shows when a refund is due and when it has been sent.</li>
            <li>If you have not received it after 7 working days, contact us with your order number and UPI reference number.</li>
          </ul>
        </section>

        <section>
          <h2><span>7</span>Delivery</h2>
          <p>Home delivery in Gangavathi is coming soon. When it starts, delivery charges, areas and timings will be added to this policy. For now, all online orders are store pickup.</p>
        </section>

        <section>
          <h2><span>8</span>Contact</h2>
          <GrievanceContact b={b} />
          <p>We acknowledge complaints within 48 hours and aim to resolve them within one month.</p>
        </section>
      </div>
    </LegalPage>
  );
}
