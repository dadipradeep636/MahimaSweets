'use client';

import { Clock3, IndianRupee, Store, Truck } from 'lucide-react';
import LegalPage, { ADDRESS, GrievanceContact, useBusiness } from '@/components/LegalPage';
import { shop } from '@/lib/shop';

export default function TermsPage() {
  const b = useBusiness();
  return (
    <LegalPage path="/terms/" eyebrow="SIMPLE AND FAIR" title="Terms" intro="These terms apply when you order from Mahima Sweets on this website. Please read them along with our Refund & Cancellation Policy and Privacy Policy.">
      <div className="legal-summary">
        <div><Store size={20} /><p><strong>Store pickup</strong><span>Collect your order at the shop at the time you choose.</span></p></div>
        <div><IndianRupee size={20} /><p><strong>{b.advancePercent}% advance</strong><span>Pay at least {b.advancePercent}% by UPI to confirm; the rest at pickup.</span></p></div>
        <div><Clock3 size={20} /><p><strong>30-minute cancel</strong><span>Cancel within 30 minutes for a full refund.</span></p></div>
        <div><Truck size={20} /><p><strong>Delivery</strong><span>Home delivery in Gangavathi is coming soon.</span></p></div>
      </div>

      <div className="legal-body">
        <section>
          <h2><span>1</span>About us</h2>
          <p>This website is run by <strong>{b.legalName || 'Mahima Sweets'}</strong>{b.ownerName ? ` (owner: ${b.ownerName})` : ''}, {ADDRESS}. Phone: {shop.phone}. Shop hours: 8:00 AM – 9:30 PM, every day.</p>
          {b.fssai ? <p>FSSAI Licence / Registration No.: <strong>{b.fssai}</strong></p> : null}
        </section>

        <section>
          <h2><span>2</span>Placing an order</h2>
          <ul>
            <li>Online orders are for <strong>store pickup only</strong>. Home delivery is coming soon.</li>
            <li>Choose your items, pack sizes and a pickup time. We need at least {b.prepMinutes >= 60 ? `${Math.round(b.prepMinutes / 6) / 10} hour${b.prepMinutes > 60 ? 's' : ''}` : `${b.prepMinutes} minutes`} to prepare, and you can order up to 7 days ahead.</li>
            <li>Your order is <strong>confirmed only after we receive your advance payment</strong>. The order page shows each step: payment sent, payment confirmed, ready for pickup, picked up.</li>
            <li>We may decline or cancel an order (for example, if an item runs out or a price was shown wrongly). If we do, you get a full refund of anything you paid.</li>
          </ul>
        </section>

        <section>
          <h2><span>3</span>Prices</h2>
          <p>All prices are in Indian Rupees (₹) for the pack size shown, and are the final prices you pay. Store pickup is free. Prices may change on the website, but the price of an order already placed will not change.</p>
        </section>

        <section>
          <h2><span>4</span>Payment</h2>
          <ul>
            <li>Pay at least <strong>{b.advancePercent}% of the order value</strong> as advance by UPI (GPay, PhonePe, Paytm or any UPI app) to the shop’s own UPI account shown on your order page. You may also pay the full amount.</li>
            <li>After paying, enter the 12-digit UPI reference number on your order page so we can match your payment.</li>
            <li>Pay the balance at the shop when you collect, by cash or UPI.</li>
            <li>Orders not paid within 2 hours are cancelled automatically, with nothing charged.</li>
            <li><strong>We will never ask for your card number, OTP or UPI PIN.</strong> Ignore anyone who does – it is not us.</li>
          </ul>
        </section>

        <section>
          <h2><span>5</span>Pickup</h2>
          <ul>
            <li>Collect your order at the time you chose. Show your order number at the counter.</li>
            <li>Please check your items at the counter before leaving.</li>
            <li>We keep your order until closing time (9:30 PM) on the pickup day. Sweets and snacks are fresh food and cannot be kept longer. If you cannot come, call us before the pickup time and we will try to help.</li>
            <li>Orders not collected on the pickup day are handled as explained in our <a href="/refund-policy/">Refund &amp; Cancellation Policy</a>.</li>
          </ul>
        </section>

        <section>
          <h2><span>6</span>Product information</h2>
          <ul>
            <li>Photos are for illustration. Our sweets are handmade, so size, colour and shape can vary a little.</li>
            <li>Ingredients, allergens and storage notes are shown on each product. Our kitchen handles milk, nuts, wheat, sesame and other allergens, so cross-contact is possible. If you have an allergy, please ask us before ordering.</li>
            <li>Follow the storage advice and enjoy fresh sweets and snacks within the suggested time.</li>
          </ul>
        </section>

        <section>
          <h2><span>7</span>Cancellations and refunds</h2>
          <p>You can cancel within 30 minutes of placing your order for a full refund. Please see our <a href="/refund-policy/">Refund &amp; Cancellation Policy</a> for all the details, including damaged or wrong items.</p>
        </section>

        <section>
          <h2><span>8</span>Accounts</h2>
          <p>Creating an account is optional. Keep your PIN private. You are responsible for orders placed using your details. You can delete your account at any time from the Account menu.</p>
        </section>

        <section>
          <h2><span>9</span>Fair use</h2>
          <p>Please do not place fake orders, send false payment references or misuse the website. We may cancel such orders and block misuse.</p>
        </section>

        <section>
          <h2><span>10</span>Responsibility</h2>
          <p>We take care to make good food and keep this website accurate. As far as the law allows, our responsibility for any order is limited to the amount paid for that order. Nothing in these terms limits your rights under the Consumer Protection Act, 2019.</p>
        </section>

        <section>
          <h2><span>11</span>Complaints and disputes</h2>
          <p>Please contact our Grievance Officer first – most issues are solved with a quick call:</p>
          <GrievanceContact b={b} />
          <p>We acknowledge complaints within 48 hours and aim to resolve them within one month. You may also contact the National Consumer Helpline (dial 1915). These terms are governed by the laws of India, and courts in Koppal District, Karnataka have jurisdiction, without affecting your right to approach a consumer commission.</p>
        </section>
      </div>
    </LegalPage>
  );
}
