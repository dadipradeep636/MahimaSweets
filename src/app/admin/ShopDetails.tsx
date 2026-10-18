'use client';

import { useEffect, useRef, useState } from 'react';
import { BadgeCheck, Building2, Camera, Check, IndianRupee, QrCode, ShieldAlert, Trash2, UserRound } from 'lucide-react';
import { businessDefaults, money, type Business } from '@/lib/products';
import { preparePhoto, uploadPhoto } from '@/lib/photo';
import HeroPicker from './HeroPicker';
import type { HeroStyle } from '@/lib/products';

type Change = (body: object, done: string) => Promise<unknown>;

export default function ShopDetails({ business, hero, change, flash }: { business?: Business; hero?: HeroStyle; change: Change; flash: (t: string, bad?: boolean) => void }) {
  const saved = { ...businessDefaults, ...(business || {}) };
  const [f, setF] = useState<Business>(saved);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  useEffect(() => setF({ ...businessDefaults, ...(business || {}) }), [business]);
  const set = <K extends keyof Business>(k: K, v: Business[K]) => setF(x => ({ ...x, [k]: v }));
  const dirty = JSON.stringify(f) !== JSON.stringify(saved);
  const paymentReady = !!(saved.upiId || saved.qrImageId);
  const example = 1000;

  async function chooseQr(file?: File) {
    if (!file) return;
    setUploading(true);
    try {
      const { id, url } = await uploadPhoto(await preparePhoto(file, false));
      setF(x => ({ ...x, qrImageId: id, qrImage: url }));
    } catch (e) {
      flash(e instanceof Error && e.message !== 'photo' ? e.message : 'Could not read that photo. Please try another one.', true);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  async function save() {
    setSaving(true);
    const { qrImage: _ignored, ...business } = f; // eslint-disable-line @typescript-eslint/no-unused-vars
    await change({ action: 'setBusiness', business }, 'Shop details saved');
    setSaving(false);
  }

  return (
    <section className="adm-details">
      <div className={`adm-status-banner ${paymentReady ? 'ok' : 'warn'}`}>
        {paymentReady ? <BadgeCheck size={20} /> : <ShieldAlert size={20} />}
        <div>
          <b>{paymentReady ? 'Online orders are open' : 'Online orders are closed until you add a UPI ID or QR code'}</b>
          <span>{paymentReady ? 'Customers can place pickup orders and pay the advance by UPI.' : 'Customers see “Online payment is opening soon – please call or WhatsApp”.'}</span>
        </div>
      </div>

      <div className="adm-card adm-form-card">
        <h2><IndianRupee size={18} /> Payment</h2>
        <label className="adm-flabel" htmlFor="sd-upi">Shop UPI ID</label>
        <input id="sd-upi" className="adm-input" value={f.upiId} onChange={e => set('upiId', e.target.value.trim())} placeholder="e.g. mahimasweets@okaxis" autoCapitalize="none" autoCorrect="off" />
        <p className="adm-hint">On phones, customers get a “Pay with a UPI app” button with the exact amount filled in.</p>
        <label className="adm-flabel" htmlFor="sd-payee">Name shown in the UPI app</label>
        <input id="sd-payee" className="adm-input" value={f.payeeName} onChange={e => set('payeeName', e.target.value)} maxLength={60} />
        <span className="adm-flabel">Shop QR code</span>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={e => chooseQr(e.target.files?.[0])} />
        <div className="adm-qr-row">
          <button type="button" className={`adm-qr ${f.qrImage ? 'has' : ''}`} onClick={() => fileRef.current?.click()} disabled={uploading}>
            {f.qrImage ? <img src={f.qrImage} alt="Shop UPI QR code" /> : <span className="qr-blank big"><QrCode size={40} /><small>No QR yet</small></span>}
          </button>
          <div className="adm-qr-actions">
            <button type="button" className="button secondary" onClick={() => fileRef.current?.click()} disabled={uploading}>
              <Camera size={16} /> {uploading ? 'Preparing…' : f.qrImage ? 'Change QR photo' : 'Add QR photo'}
            </button>
            {f.qrImage && <button type="button" className="adm-textbtn" onClick={() => setF(x => ({ ...x, qrImageId: '', qrImage: '' }))}><Trash2 size={14} /> Remove</button>}
            <p className="adm-hint">Take a clear, straight photo of the shop’s UPI QR (from GPay / PhonePe / Paytm for Business or your bank), or a screenshot of it.</p>
          </div>
        </div>
        <label className="adm-flabel" htmlFor="sd-adv">Minimum advance: <b>{f.advancePercent}%</b></label>
        <input id="sd-adv" type="range" min={25} max={100} step={5} value={f.advancePercent} onChange={e => set('advancePercent', Number(e.target.value))} className="adm-range" />
        <p className="adm-hint">For a {money(example)} order, the customer pays {money(Math.ceil((example * f.advancePercent) / 100))} now and {money(example - Math.ceil((example * f.advancePercent) / 100))} at pickup. They can also pay the full amount.</p>
        <label className="adm-flabel" htmlFor="sd-prep">Time needed to get an order ready</label>
        <select id="sd-prep" className="adm-input" value={f.prepMinutes} onChange={e => set('prepMinutes', Number(e.target.value))}>
          {[30, 60, 90, 120, 180, 240, 360, 480].map(m => <option key={m} value={m}>{m < 60 ? `${m} minutes` : `${m / 60} hour${m > 60 ? 's' : ''}`}</option>)}
        </select>
        <p className="adm-hint">The earliest pickup time customers can choose.</p>
      </div>

      <div className="adm-card adm-form-card">
        <h2><Building2 size={18} /> Business details <span className="adm-opt">shown on bills and policy pages</span></h2>
        <label className="adm-flabel" htmlFor="sd-legal">Business name (as on FSSAI certificate)</label>
        <input id="sd-legal" className="adm-input" value={f.legalName} onChange={e => set('legalName', e.target.value)} maxLength={100} />
        <label className="adm-flabel" htmlFor="sd-owner">Owner name <em className="adm-opt">optional</em></label>
        <input id="sd-owner" className="adm-input" value={f.ownerName} onChange={e => set('ownerName', e.target.value)} maxLength={80} />
        <label className="adm-flabel" htmlFor="sd-fssai">FSSAI licence / registration number</label>
        <input id="sd-fssai" className="adm-input" inputMode="numeric" value={f.fssai} onChange={e => set('fssai', e.target.value.replace(/\D/g, '').slice(0, 14))} placeholder="14 digits – leave empty for now" />
        <p className="adm-hint">{f.fssai ? (f.fssai.length === 14 ? 'Shown in the website footer, on Terms and on every receipt.' : `${f.fssai.length}/14 digits`) : 'Required by law for food businesses. Once added it shows in the footer and on every receipt.'}</p>
        <label className="adm-flabel" htmlFor="sd-email">Customer care email <em className="adm-opt">optional</em></label>
        <input id="sd-email" className="adm-input" type="email" value={f.email} onChange={e => set('email', e.target.value.trim())} placeholder="e.g. mahimasweets@gmail.com" />
      </div>

      <div className="adm-card adm-form-card">
        <h2><UserRound size={18} /> Grievance officer <span className="adm-opt">required by consumer and privacy law</span></h2>
        <p className="adm-hint">The person customers can contact for complaints. Usually the owner. Shown on the Privacy, Terms and Refund pages.</p>
        <label className="adm-flabel" htmlFor="sd-gname">Name</label>
        <input id="sd-gname" className="adm-input" value={f.grievanceName} onChange={e => set('grievanceName', e.target.value)} maxLength={80} placeholder="e.g. Owner’s name" />
        <label className="adm-flabel" htmlFor="sd-gphone">Mobile number</label>
        <div className="phone-field"><span>+91</span><input id="sd-gphone" className="adm-input" inputMode="numeric" value={f.grievancePhone} onChange={e => set('grievancePhone', e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="If empty, the shop number is shown" /></div>
        <label className="adm-flabel" htmlFor="sd-gemail">Email</label>
        <input id="sd-gemail" className="adm-input" type="email" value={f.grievanceEmail} onChange={e => set('grievanceEmail', e.target.value.trim())} placeholder="e.g. owner@gmail.com" />
      </div>

      <div className="adm-sticky-save">
        <button className="button primary glow full" disabled={!dirty || saving || uploading} onClick={save}>
          {saving ? 'Saving…' : <><Check size={18} /> Save shop details</>}
        </button>
      </div>
      <HeroPicker hero={hero} change={change} />
    </section>
  );
}
