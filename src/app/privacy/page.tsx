'use client';

import { Ban, Lock, ShieldCheck, UserRound } from 'lucide-react';
import LegalPage, { ADDRESS, GrievanceContact, useBusiness } from '@/components/LegalPage';
import { shop } from '@/lib/shop';

export default function PrivacyPage() {
  const b = useBusiness();
  return (
    <LegalPage path="/privacy/" eyebrow="YOUR DATA, RESPECTED" title="Privacy Policy" intro="This explains what personal data Mahima Sweets collects through this website, why we need it, and the choices and rights you have under India’s Digital Personal Data Protection Act, 2023 and its Rules.">
      <div className="legal-summary">
        <div><UserRound size={20} /><p><strong>Only what we need</strong><span>Your name, mobile number and order details – to make and hand over your order.</span></p></div>
        <div><Ban size={20} /><p><strong>Never sold</strong><span>No advertising or tracking cookies. We do not sell or rent your data.</span></p></div>
        <div><Lock size={20} /><p><strong>No bank details</strong><span>You pay in your own UPI app. We never see your bank account, card or UPI PIN.</span></p></div>
        <div><ShieldCheck size={20} /><p><strong>Your rights</strong><span>Ask to see, correct or delete your data anytime.</span></p></div>
      </div>

      <div className="legal-body">
        <section>
          <h2><span>1</span>Who we are</h2>
          <p>This website is run by <strong>{b.legalName || 'Mahima Sweets'}</strong>{b.ownerName ? ` (owner: ${b.ownerName})` : ''}, {ADDRESS}. Phone: {shop.phone}{b.email ? `, email: ${b.email}` : ''}. For your personal data, we are the “Data Fiduciary” under the DPDP Act.</p>
        </section>

        <section>
          <h2><span>2</span>What we collect</h2>
          <table>
            <thead><tr><th>When</th><th>What</th></tr></thead>
            <tbody>
              <tr><td>You place an order</td><td>Name, mobile number, pickup time, items ordered, gift message (if any), the UPI reference number you send us, and order status.</td></tr>
              <tr><td>You create an account (optional)</td><td>Mobile number and a 4-digit PIN. The PIN is stored only as a protected code (hash), never as plain text.</td></tr>
              <tr><td>You use the website</td><td>Your bag, light/dark choice and a list of your recent orders are saved <strong>only in your own browser</strong>. Our hosting provider processes your IP address and basic technical logs to deliver and protect the site.</td></tr>
            </tbody>
          </table>
          <p>We do not collect your address (delivery is not open yet), date of birth, bank account, card numbers or UPI PIN. We do not use advertising or analytics trackers. One essential cookie is used only if you sign in, to keep you signed in.</p>
        </section>

        <section>
          <h2><span>3</span>Why we use it</h2>
          <ul>
            <li>To take, prepare and hand over your order at the pickup time you chose.</li>
            <li>To match your UPI payment and confirm your order.</li>
            <li>To call or WhatsApp you about your order (for example, if an item runs out or a batch needs more time).</li>
            <li>To process cancellations, refunds and complaints.</li>
            <li>To keep the records that Indian law requires (for example, accounts and food-safety records).</li>
            <li>To protect the website from misuse, such as repeated wrong PINs or fake orders.</li>
          </ul>
          <p>We will not send you marketing messages unless you ask us to.</p>
        </section>

        <section>
          <h2><span>4</span>Your consent</h2>
          <p>When you place an order or create an account, you agree that we may use the details above for the purposes listed. You can withdraw your consent at any time by contacting our Grievance Officer (section 10). Withdrawing does not affect an order that is already placed or records we must keep by law. You can delete your account yourself from the Account menu.</p>
        </section>

        <section>
          <h2><span>5</span>Who we share it with</h2>
          <ul>
            <li><strong>Cloudflare</strong> – hosts this website and its database. Data may be processed on servers outside India, with security safeguards.</li>
            <li><strong>Google Maps</strong> – the map on our website loads from Google when you view it.</li>
            <li><strong>WhatsApp</strong> – only if you choose to message us there.</li>
            <li><strong>Your bank or UPI app</strong> – processes your payment under its own terms. We only receive the payment in our account and the reference number you send.</li>
            <li><strong>Government authorities</strong> – only when required by law.</li>
          </ul>
          <p>We do not sell, rent or trade your personal data.</p>
        </section>

        <section>
          <h2><span>6</span>How long we keep it</h2>
          <ul>
            <li><strong>Order records:</strong> as long as needed for our accounts and as required by law.</li>
            <li><strong>Account:</strong> until you delete it. Sign-in sessions end after 30 days.</li>
            <li><strong>Security logs:</strong> at least one year, as required by the DPDP Rules, 2025.</li>
            <li><strong>Data in your browser:</strong> stays on your device until you clear it. Recent-order links are kept for 14 days.</li>
          </ul>
          <p>After that, data is deleted or made anonymous.</p>
        </section>

        <section>
          <h2><span>7</span>Your rights</h2>
          <p>You can ask us to:</p>
          <ul>
            <li>tell you what personal data we hold about you and how we use it;</li>
            <li>correct, complete or update it;</li>
            <li>delete it (except what we must keep by law);</li>
            <li>let a person you nominate act for you if you are unable to.</li>
          </ul>
          <p>Contact our Grievance Officer. We may ask you to confirm it is you, for example by calling from the mobile number on the order.</p>
        </section>

        <section>
          <h2><span>8</span>How we protect it</h2>
          <p>The website uses HTTPS encryption. PINs are stored only as protected hashes. Shop controls are protected by an owner password, and repeated wrong attempts are blocked. If a data breach affects you, we will inform you and the Data Protection Board of India as the law requires.</p>
        </section>

        <section>
          <h2><span>9</span>Children</h2>
          <p>This website is meant for adults. If you are under 18, please ask a parent or guardian to place the order for you. We do not knowingly collect children’s personal data.</p>
        </section>

        <section id="grievance">
          <h2><span>10</span>Grievance Officer</h2>
          <p>For any question, complaint or request about your personal data or an order, contact:</p>
          <GrievanceContact b={b} />
          <p>We will acknowledge your complaint within 48 hours and try to resolve it within one month. If you are not satisfied after using this process, you may complain to the <strong>Data Protection Board of India</strong>.</p>
        </section>

        <section>
          <h2><span>11</span>Changes</h2>
          <p>We may update this policy, for example when home delivery or new payment options start. The latest version is always on this page, with the date at the top.</p>
        </section>
      </div>
    </LegalPage>
  );
}
