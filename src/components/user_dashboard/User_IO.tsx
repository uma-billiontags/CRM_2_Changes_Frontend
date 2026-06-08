import React, { useEffect, useRef, useState } from "react";
import { Button, Modal, Spin, Tag, Input, Empty } from "antd";
import {
    EyeOutlined,
    DownloadOutlined,
    SearchOutlined,
    FileTextOutlined,
    ReloadOutlined,
    CheckCircleOutlined,
} from "@ant-design/icons";
import Sidebar from "../shared/Sidebar";

const BASE_URL = import.meta.env.VITE_BASE_URL;

// ── Types ─────────────────────────────────────────────────────────────────────

interface GeoLocation {
    country?: string;
    state?: string;
    city?: string;
    zipcode?: string;
    range?: string;
}

interface LineItem {
    line_item_id: string;
    line_item_name?: string;
    start_date?: string;
    end_date?: string;
    ad_format?: string;
    impressions?: string;
    units?: string;
    unit_cost?: string;
    unit_value?: string;
    ethnicity?: string[];
    ctr?: string;
    viewability?: string;
    vcr?: string;
}

interface Campaign {
    id: number;
    campaign_id: string;
    approval_status: string;
    campaign_name: string;
    client_name: string;
    client?: string | number;
    advertiser?: string;
    website_url?: string;
    campaign_type?: string;
    buying_type?: string;
    objective?: string;
    notes?: string;
    start_date?: string;
    end_date?: string;
    created_at: string;
    age?: string;
    gender?: string;
    platforms?: string;
    frequency_cap?: string;
    brand_safety?: string;
    viewability_goal?: string;
    geo_targeting?: GeoLocation[] | string;
    line_items?: LineItem[];
    client_campaign_ID?: string;
    purchase_order_ID?: string;
    new_cpm?: string | number;
    new_price?: string | number;
}

interface ClientDetail {
    name?: string;
    email?: string;
    phone?: string;
    address_line1?: string;
    address_line2?: string;
    city?: string;
    state?: string;
    country?: string;
    zipcode?: string;
    billing?: {
        payment_terms?: string;
        billing_contact?: string;
    };
    ownership?: {
        account_manager?: string;
    };
    contacts?: Array<{
        name?: string;
        email?: string;
        phone?: string;
        designation?: string;
    }>;
}

// ── Colors ────────────────────────────────────────────────────────────────────
const C = {
    bg: "#F8FAFC",
    white: "#FFFFFF",
    slate: "#0F172A",
    slate700: "#334155",
    slate500: "#64748B",
    slate300: "#CBD5E1",
    slate100: "#F1F5F9",
    border: "#E2E8F0",
    blue: "#2563EB",
    blueLight: "#EFF6FF",
    blueMid: "#BFDBFE",
    green: "#16A34A",
    greenLight: "#F0FDF4",
    amber: "#D97706",
    amberLight: "#FFFBEB",
    purple: "#7C3AED",
    purpleLight: "#F5F3FF",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(v?: string) {
    if (!v) return "—";
    return new Date(v).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

function fmtDateShort(v?: string) {
    if (!v) return "—";
    const d = new Date(v);
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
}

function parseGeo(geo: GeoLocation[] | string | undefined): string {
    if (!geo) return "—";
    if (typeof geo === "string") {
        try {
            const parsed = JSON.parse(geo);
            if (Array.isArray(parsed)) {
                return parsed
                    .map((g: GeoLocation) => [g.country, g.state, g.city].filter(Boolean).join(", "))
                    .filter(Boolean)
                    .join("; ") || "—";
            }
            return geo;
        } catch {
            return geo;
        }
    }
    if (Array.isArray(geo)) {
        return (
            geo
                .map((g) => [g.country, g.state, g.city].filter(Boolean).join(", "))
                .filter(Boolean)
                .join("; ") || "—"
        );
    }
    return "—";
}

// ── IO HTML Generator ─────────────────────────────────────────────────────────

function generateIOHtml(campaign: Campaign, client: ClientDetail | null): string {
    const lineItems = campaign.line_items || [];
    const bookingIOId = `BI${campaign.id.toString().padStart(5, "0")}`;
    const today = new Date().toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "long",
        year: "numeric",
    });

    const contact = client?.contacts?.[0];
    const accountManager = "Praveen Kumar"
    const paymentTerms = client?.billing?.payment_terms || campaign.notes?.includes("Net") ? campaign.notes || "—" : "—";

    const lineItemsRows = lineItems
        .map(
            (li, i) => `
    <tr style="${i % 2 === 0 ? "background:#fff;" : "background:#f9fafb;"}">
      <td style="padding:8px 10px;border:1px solid #e5e7eb;font-size:12px;font-family:monospace;color:#4f46e5;white-space:nowrap;">
        ${bookingIOId}/<br/>${li.line_item_id || "—"}
      </td>
      <td style="padding:8px 10px;border:1px solid #e5e7eb;font-size:12px;">
        <div style="font-weight:600;color:#111827;">${campaign.campaign_name}</div>
        <div style="color:#6b7280;margin-top:2px;">${li.line_item_name || "—"}</div>
      </td>
      <td style="padding:8px 10px;border:1px solid #e5e7eb;font-size:12px;text-align:center;">
        ${li.ad_format || "—"}
      </td>
      <td style="padding:8px 10px;border:1px solid #e5e7eb;font-size:12px;text-align:center;">
        ${Array.isArray(li.ethnicity) ? li.ethnicity.join(", ") : (li.ethnicity || "—")}
      </td>
      <td style="padding:8px 10px;border:1px solid #e5e7eb;font-size:12px;text-align:center;white-space:nowrap;">
        ${fmtDateShort(li.start_date)}
      </td>
      <td style="padding:8px 10px;border:1px solid #e5e7eb;font-size:12px;text-align:center;white-space:nowrap;">
        ${fmtDateShort(li.end_date)}
      </td>
      <td style="padding:8px 10px;border:1px solid #e5e7eb;font-size:12px;text-align:right;">
        ${li.impressions ? Number(li.impressions).toLocaleString("en-IN") : "—"}
      </td>
      <td style="padding:8px 10px;border:1px solid #e5e7eb;font-size:12px;text-align:center;">
        ${li.units || "—"}
      </td>
      <td style="padding:8px 10px;border:1px solid #e5e7eb;font-size:12px;text-align:right;">
        ${li.unit_value ? `$${parseFloat(li.unit_value).toFixed(2)}` : (li.unit_cost || "—")}
      </td>
      <td style="padding:8px 10px;border:1px solid #e5e7eb;font-size:12px;text-align:right;font-weight:600;">
        ${li.unit_cost || "—"}
      </td>
    </tr>`
        )
        .join("");

    const totalImpressions = lineItems.reduce((s, li) => s + (parseInt(li.impressions || "0") || 0), 0);

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #111827; background: #fff; }
    .page { width: 900px; margin: 0 auto; padding: 32px 36px; }
    .header-bar { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; border-bottom: 3px solid #111827; padding-bottom: 16px; }
    .logo-area { display: flex; align-items: center; gap: 10px; }
    .logo-circle { width: 44px; height: 44px; border-radius: 10px; background: linear-gradient(135deg,#f59e0b,#ef4444,#8b5cf6); display: flex; align-items: center; justify-content: center; color: white; font-weight: 900; font-size: 20px; }
    .logo-text { font-size: 22px; font-weight: 900; color: #111827; letter-spacing: -0.5px; }
    .logo-text span { color: #f59e0b; }
    .io-ids { text-align: right; }
    .io-id-label { font-size: 11px; color: #6b7280; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; }
    .io-id-val { font-size: 15px; font-weight: 800; color: #111827; font-family: monospace; }
    .section-title { font-size: 11px; font-weight: 800; color: #374151; text-transform: uppercase; letter-spacing: 0.08em; border-bottom: 2px solid #111827; padding-bottom: 4px; margin: 20px 0 12px; }
    .info-table { width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 6px; }
    .info-table td { padding: 5px 8px; border: 1px solid #e5e7eb; vertical-align: top; }
    .info-table td:first-child { font-weight: 600; color: #374151; background: #f9fafb; width: 170px; white-space: nowrap; }
    .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .booking-table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 8px; }
    .booking-table th { padding: 8px 10px; background: #111827; color: #fff; font-weight: 700; font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; border: 1px solid #374151; text-align: left; }
    .booking-table th.right { text-align: right; }
    .booking-table th.center { text-align: center; }
    .total-row td { font-weight: 800; font-size: 13px; background: #f9fafb !important; border-top: 2px solid #111827 !important; }
    .sig-section { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 32px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
    .sig-box { border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; }
    .sig-box-title { font-size: 11px; font-weight: 700; color: #374151; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 12px; }
    .sig-line { border-bottom: 1px solid #9ca3af; margin: 28px 0 6px; }
    .sig-meta { font-size: 11px; color: #6b7280; }
    .highlight-badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 700; }

    /* PAGE 2 — T&C */
    .tc-page { width: 900px; margin: 0 auto; padding: 12px 36px 40px; }
    .tc-title { font-size: 15px; font-weight: 900; color: #111827; margin-bottom: 6px; letter-spacing: -0.3px; }
    .tc-subtitle { font-size: 12px; color: #374151; margin-bottom: 18px; font-style: italic; }
    .tc-section-title { font-size: 12px; font-weight: 800; color: #111827; margin: 18px 0 8px; text-decoration: underline; }
    .tc-body { font-size: 12px; color: #374151; line-height: 1.75; }
    .tc-body ol { padding-left: 20px; margin: 8px 0; }
    .tc-body ol li { margin-bottom: 8px; }
    .tc-body p { margin-bottom: 10px; }

   /* REPLACE WITH */
    @media print {
    @page {
        margin: 0;
        size: A4;
    }
    body { margin: 20px; }
    .page, .tc-page { width: 100%; padding: 20px 24px; }
    .page-break { page-break-before: always; }
    }
  </style>
</head>
<body>
<div class="page">

  <!-- HEADER -->
  <div class="header-bar">
    <div class="logo-area">
      <div>
        <div style="font-size:22px;font-weight:900;color:#111827;letter-spacing:-0.5px;">Billion<span style="color:#f59e0b;">tags</span></div>
        <div style="font-size:10px;color:#6b7280;letter-spacing:0.08em;text-transform:uppercase;">Creations Pvt. Ltd.</div>
      </div>
    </div>
    <div class="io-ids">
      <div style="margin-bottom:6px;">
        <div class="io-id-label">Booking IO ID</div>
        <div class="io-id-val">${bookingIOId}</div>
      </div>
      <div>
        <div class="io-id-label">Campaign ID</div>
        <div class="io-id-val">${campaign.campaign_id}</div>
      </div>
    </div>
  </div>

  <!-- NETWORK/PUBLISHER INFO -->
  <div class="section-title">Publisher Details</div>
  <table class="info-table">
    <tr><td>Network / Publisher</td><td>Billiontags Creations Pvt. Ltd.</td></tr>
    <tr><td>Date of IO</td><td>${today}</td></tr>
    <tr><td>Order Taken By</td><td>${accountManager}</td></tr>
    <tr><td>Email</td><td>praveenkumar@billiontags.com</td></tr>
    <tr><td>Address</td><td>Sankaran Avenue, Shree Vatsa Towers, No:1/93, Janakpuri 2nd Street, 2nd Floor, Above Cars 24 Velachery, Velachery, Chennai, Tamil Nadu 600042.</td></tr>
  </table>

  <!-- CUSTOMER DETAILS -->
  <div class="section-title">Customer Details</div>
  <div class="two-col">
    <div>
      <div style="font-size:12px;font-weight:700;color:#374151;margin-bottom:8px;">Customer Contact Details</div>
      <table class="info-table">
        <tr><td>Agency / Advertiser</td><td>${campaign.advertiser || client?.name || "—"}</td></tr>
        <tr><td>Phone</td><td>${contact?.phone || client?.phone || "—"}</td></tr>
        <tr><td>E-Mail</td><td>${contact?.email || client?.email || "—"}</td></tr>
        <tr><td>Address Line – 1</td><td>${client?.address_line1 || "—"}</td></tr>
        <tr><td>Address Line – 2</td><td>${client?.address_line2 || "—"}</td></tr>
      </table>
    </div>
    <div>
      <div style="font-size:12px;font-weight:700;color:#374151;margin-bottom:8px;">Customer Billing Details</div>
      <table class="info-table">
        <tr><td>Agency / Advertiser</td><td>${campaign.advertiser || client?.name || "—"}</td></tr>
        <tr><td>Phone</td><td>${contact?.phone || client?.phone || "—"}</td></tr>
        <tr><td>E-Mail</td><td>${contact?.email || client?.email || "—"}</td></tr>
        <tr><td>Address Line – 1</td><td>${client?.address_line1 || "—"}</td></tr>
        <tr><td>Address Line – 2</td><td>${client?.address_line2 || "—"}</td></tr>
      </table>
    </div>
  </div>

  <!-- ORDER DETAILS -->
  <div class="section-title">Order Details</div>
  <div class="two-col">
    <div>
      <div style="font-size:12px;font-weight:700;color:#374151;margin-bottom:8px;">Booking Information</div>
      <table class="info-table">
        <tr><td>Advertising Client Name</td><td>${client?.name || campaign.client_name || "—"}</td></tr>
        <tr><td>Campaign Name</td><td><strong>${campaign.campaign_name}</strong></td></tr>
        <tr><td>GEO</td><td>${parseGeo(campaign.geo_targeting)}</td></tr>
        <tr><td>Client Campaign ID</td><td>${campaign.client_campaign_ID || "—"}</td></tr>
      </table>
    </div>
    <div>
      <div style="font-size:12px;font-weight:700;color:#374151;margin-bottom:8px;">Notes &amp; Special Instructions</div>
      <table class="info-table">
        <tr><td>Payment Terms</td><td>${client?.billing?.payment_terms || "Post Payment – Net 30"}</td></tr>
        <tr><td>Out Clause</td><td>48 Hours</td></tr>
        <tr><td>Billing On</td><td>Billiontags Numbers</td></tr>
        <tr><td>Campaign Dates</td><td>${fmtDateShort(campaign.start_date)} to ${fmtDateShort(campaign.end_date)}</td></tr>
        ${campaign.new_cpm ? `<tr><td>CPM</td><td>$${campaign.new_cpm}</td></tr>` : ""}
        ${campaign.new_price ? `<tr><td>Price</td><td>$${campaign.new_price}</td></tr>` : ""}
        ${campaign.notes ? `<tr><td>Notes</td><td>${campaign.notes}</td></tr>` : ""}
      </table>
    </div>
  </div>

  <!-- BOOKING DETAILS TABLE -->
  <div class="section-title">Booking Details</div>
  <table class="booking-table">
    <thead>
      <tr>
        <th style="width:110px;">IO ID &amp; Line Item ID</th>
        <th>IO Name &amp; Line Item Name</th>
        <th class="center">Ad Type</th>
        <th class="center">Ethnicity</th>
        <th class="center">Start Date</th>
        <th class="center">End Date</th>
        <th class="right">Volume</th>
        <th class="center">Unit</th>
        <th class="right">Unit Cost</th>
        <th class="right">Net Cost</th>
      </tr>
    </thead>
    <tbody>
      ${lineItemsRows || `<tr><td colspan="10" style="padding:16px;text-align:center;color:#9ca3af;font-style:italic;">No line items found</td></tr>`}
      <tr class="total-row">
        <td colspan="6" style="padding:8px 10px;border:1px solid #e5e7eb;text-align:right;font-weight:800;font-size:13px;">Total</td>
        <td style="padding:8px 10px;border:1px solid #e5e7eb;text-align:right;font-weight:800;">
          ${totalImpressions.toLocaleString("en-IN")}
        </td>
        <td colspan="3" style="padding:8px 10px;border:1px solid #e5e7eb;"></td>
      </tr>
    </tbody>
  </table>

  <!-- SIGNATURES -->
  <div class="section-title">Signature</div>
  <div class="sig-section">
  
    <div class="sig-box">
    
      <div class="sig-box-title">Duly Authorized on behalf of Billiontags</div>
      <table style="width:100%;font-size:12px;">
        <tr><td style="color:#6b7280;width:80px;">Name:</td><td style="font-weight:600;">${accountManager}</td></tr>
        <tr><td style="color:#6b7280;">Date:</td><td>${today}</td></tr>
      </table>
      <div class="sig-line"></div>
      <div class="sig-meta">Signature</div>
    </div>
    <div class="sig-box">
      <div class="sig-box-title">Duly Authorized on behalf of the Advertiser Agency</div>
      <table style="width:100%;font-size:12px;">
        <tr><td style="color:#6b7280;width:80px;">Name:</td><td style="font-weight:600;">${contact?.name || "—"}</td></tr>
        <tr><td style="color:#6b7280;">Date:</td><td>${today}</td></tr>
      </table>
      <div class="sig-line"></div>
      <div class="sig-meta">Signature</div>
    </div>
  </div>

<!-- ═══════════════════════════════════════════════════════ PAGE 2 ═══ -->
<div style="page-break-before:always;"></div>
<div class="tc-page" style="padding-top:8px;">
  <div class="tc-body">

    <div class="tc-title">BILLIONTAGS Terms and Conditions for Internet Advertising</div>
    <p class="tc-subtitle">
      These BILLIONTAGS, Inc. Terms and Conditions for Internet Advertising ("Standard Terms") are affiliating ("BILLIONTAGS") the Advertiser / Agency identified below ("Advertiser" or "Agency"). The parties acknowledge and agree the Standard Terms shall be effective as of the date set forth below, and shall govern one or more separate insertion orders (each an "IO") executed by the parties.
    </p>

    <div class="tc-section-title">Cancellation and Termination:</div>
    <ol>
      <li>
        At any time prior to the serving of the first impression of the IO, Agency may cancel the IO with reports must be updated / sent / given access on a daily basis. Cancellation 48 Hours prior written notice, without penalty.
      </li>
      <li>
        Upon the serving of the first impression of the IO, Agency may cancel the IO for any reason, without penalty, by providing BILLIONTAGS written notice of cancellation which will be effective after the later of: (i) 30 days after serving the first impression of the IO; or (ii) 14 days after providing BILLIONTAGS with such written notice.
      </li>
      <li>
        Either party may terminate an IO at any time if the other party is in material breach of its obligations here it is not cured within 10 days after written notice therefore from the Non-breaching party, except as otherwise stated in this Agreement with regard to specific breaches.
      </li>
      <li>
        Additionally, if Agency or Advertiser commit a violation of the same Policy (as defined below), where such Policy had been provided by BILLIONTAGS to Agency, on three separate occasions after having received timely notice of each such breach, even if such breach has been cured by Agency or Advertiser, then BILLIONTAGS may terminate the IO associated with such breach upon written notice. If Agency or Advertiser do not cure a violation of a Policy within the applicable ten-day cure period after written notice, where such Policy had been provided by BILLIONTAGS to Agency, then BILLIONTAGS may terminate the IO associated with such breach upon written notice.
      </li>
      <li>
        Short rates will apply to cancel buys to the degree stated on the IO.
      </li>
      <li>
        For Any Creative or tags that is not in accordance with IAB Standard or a non performing creative or tags were given to BILLIONTAGS then BILLIONTAGS cannot be accounted for non-performance however BILLIONTAGS can be given another creative tags as an alternative. There will be a minimum deployment charge for all campaigns irrespective of the completion or not and that will not be borne by BILLIONTAGS for any failure from the Advertiser side. Deployment cost will be prorated according to the delivery report and is a sole discretion of BILLIONTAGS. However we will ensure that the campaigns is delivered in accordance to the IO.
      </li>
    </ol>

    <div class="tc-section-title">Refund Policy:</div>
    <p>
      BILLIONTAGS do not allow Redirects, Malware, Adult Ads and Pop ups. An Advertiser can only have one offer per campaign. If an Advertiser wish to display two different Landing Pages for the same offer, then Billiontags requires two tracking URL within the same campaign.
    </p>
    <p>
      You are entitled to request for a refund in the following cases:
    </p>
    <p>
      <strong>First,</strong> if there has been an incorrect payment transaction.
    </p>
    <p>
      <strong>Second,</strong> if you have made a prepayment and you prove that the actions forming the basis of the pricing model of your Campaign are based on a Publisher's fraudulent activities (i.e. the artificial increase of actions). In order to detect and prove Publishers' fraudulent activities you undertake to send to Billiontags a weekly detailed report of sources/websites you consider to be fraudulent. In case the Publisher's fraudulent activities cannot be clearly identified based on your report, Billiontags is entitled to request additional proof from you. If you fail to submit a weekly report or additional proof regarding the Publishers' fraudulent activities, Billiontags may refuse to give a refund and adjust your balance accordingly. In case you are using post-payment method and you are able to prove Publishers' fraudulent activities pursuant to this clause, Billiontags will not invoice you for the agreed actions based on Publisher's fraudulent activities.
    </p>
    <p>
      <strong>Third,</strong> if at the end of the validity of the Contract it appears that you have spent for Billiontags services less than you have prepaid. In such a case you are entitled to ask for a refund within 30 days after the termination of the Contract, provided that the amount of your unused balance is at least 50 EUR. Before refunding, Billiontags will have to finalize all not invoiced spending and make necessary adjustments where needed. After finalizing all current statistics, your unused balance will be refunded to you at your request, minus an administrative fee of 25% to cover Billiontags costs and fees related with the management of giving a refund, within 30 working days.
    </p>
    <p style="font-weight:600;">
      YOUR REFUND WILL BE CREDITED BACK TO THE SAME PAYMENT METHOD AND SAME PAYMENT ACCOUNT THAT YOU USED TO MAKE YOUR LAST PAYMENT. You may be required to provide additional information or documentation in order for Billiontags to confirm your identity, before any refund request is processed.
    </p>
    <p style="font-weight:600;">
      PLEASE BE AWARE THAT IF YOUR CONTRACT WITH Billiontags IS TERMINATED DUE TO THE VIOLATION OF CONTRACT BY YOU (E.G. DUE TO YOUR FRAUDULENT ACTIVITY), Billiontags IS ENTITLED TO A CONTRACTUAL PENALTY IN THE AMOUNT OF YOUR UNUSED BALANCE AND THEREFORE, Billiontags MAY REFUSE TO GIVE YOU A REFUND BY WAY OF SET-OFF OF THE CLAIMS.
    </p>

  </div><!-- end tc-body -->

</div><!-- end page 2 -->

</body>
</html>`;
}

// ── IO Preview Modal ──────────────────────────────────────────────────────────

function IOPreviewModal({
    open,
    campaign,
    client,
    onClose,
    onDownload,
    downloading,
}: {
    open: boolean;
    campaign: Campaign | null;
    client: ClientDetail | null;
    onClose: () => void;
    onDownload: () => void;
    downloading: boolean;
}) {
    const iframeRef = useRef<HTMLIFrameElement>(null);

    useEffect(() => {
        if (open && campaign && iframeRef.current) {
            const html = generateIOHtml(campaign, client);
            const doc = iframeRef.current.contentDocument;
            if (doc) {
                doc.open();
                doc.write(html);
                doc.close();
            }
        }
    }, [open, campaign, client]);

    if (!campaign) return null;

    return (
        <Modal
            open={open}
            onCancel={onClose}
            footer={null}
            width={980}
            centered
            destroyOnClose
            styles={{ body: { padding: 0 } }}
            style={{ borderRadius: 16, overflow: "hidden" }}
        >
            {/* Header */}
            <div
                style={{
                    background: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)",
                    padding: "18px 24px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div
                        style={{
                            width: 40,
                            height: 40,
                            borderRadius: 10,
                            background: "rgba(245,158,11,0.2)",
                            border: "1.5px solid rgba(245,158,11,0.4)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 18,
                        }}
                    >
                        📄
                    </div>
                    <div>
                        <div style={{ fontSize: 15, fontWeight: 800, color: "#fff" }}>
                            Insertion Order Preview
                        </div>
                        <div
                            style={{
                                fontSize: 12,
                                color: "rgba(255,255,255,0.5)",
                                marginTop: 2,
                            }}
                        >
                            {campaign.campaign_name} —{" "}
                            <span style={{ fontFamily: "monospace", color: "#93C5FD" }}>
                                {campaign.campaign_id}
                            </span>
                        </div>
                    </div>
                </div>
                <Button
                    type="primary"
                    icon={<DownloadOutlined />}
                    loading={downloading}
                    onClick={onDownload}
                    style={{
                        background: C.green,
                        borderColor: C.green,
                        fontWeight: 700,
                        fontSize: 13,
                        height: 38,
                        borderRadius: 8,
                    }}
                >
                    {downloading ? "Generating PDF…" : "Download PDF"}
                </Button>
            </div>

            {/* iframe */}
            <div
                style={{
                    height: "72vh",
                    overflow: "hidden",
                    background: "#f1f5f9",
                    padding: "16px",
                }}
            >
                <iframe
                    ref={iframeRef}
                    style={{
                        width: "100%",
                        height: "100%",
                        border: "none",
                        borderRadius: 8,
                        boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
                        background: "#fff",
                    }}
                    title="IO Preview"
                />
            </div>
        </Modal>
    );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function User_IO() {
    const [collapsed, setCollapsed] = useState(false);
    const sideWidth = collapsed ? 64 : 240;

    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    const [previewCampaign, setPreviewCampaign] = useState<Campaign | null>(null);
    const [previewClient, setPreviewClient] = useState<ClientDetail | null>(null);
    const [loadingClient, setLoadingClient] = useState(false);
    const [downloading, setDownloading] = useState(false);

    const clientId = localStorage.getItem("client_id");
    const clientName = localStorage.getItem("client_name") ?? "";

    // Fetch approved campaigns for this client
    const fetchCampaigns = () => {
        setLoading(true);
        fetch(`${BASE_URL}/get_campaigns_by_client/${clientId}/`, {
            headers: { "ngrok-skip-browser-warning": "1" },
        })
            .then((r) => {
                if (!r.ok) throw new Error();
                return r.json();
            })
            .then((data) => {
                const list: Campaign[] = Array.isArray(data) ? data : [];
                // Only approved campaigns have IOs
                setCampaigns(list.filter((c) => c.approval_status === "approved" && c.campaign_id));
            })
            .catch(() => setCampaigns([]))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchCampaigns();
    }, [clientId]);

    // Fetch client details when previewing
    const handlePreview = async (campaign: Campaign) => {
        setPreviewCampaign(campaign);
        setPreviewClient(null);
        setLoadingClient(true);

        try {
            const res = await fetch(`${BASE_URL}/get_client/${clientId}/`, {
                headers: { "ngrok-skip-browser-warning": "1" },
            });
            if (res.ok) {
                const data = await res.json();
                setPreviewClient(data);
            }
        } catch {
            // proceed with null client
        } finally {
            setLoadingClient(false);
        }
    };

    // Download as PDF using print API (most reliable cross-browser)
    // Download as PDF using print API (most reliable cross-browser)
    const handleDownload = async () => {
        if (!previewCampaign) return;
        setDownloading(true);

        try {
            const html = generateIOHtml(previewCampaign, previewClient);
            const printWindow = window.open("", "_blank", "width=1000,height=800");
            if (!printWindow) {
                alert("Please allow popups to download the PDF.");
                setDownloading(false);
                return;
            }

            printWindow.document.write(html);
            printWindow.document.close();

            // Give it time to render then trigger print
            setTimeout(() => {
                printWindow.focus();
                printWindow.print();
                // Close after a delay to allow save dialog
                setTimeout(() => {
                    printWindow.close();
                    setDownloading(false);
                }, 2000);
            }, 800);
        } catch {
            setDownloading(false);
        }
    };

    const filtered = campaigns.filter((c) => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return [c.campaign_id, c.campaign_name, c.advertiser, c.client_campaign_ID]
            .some((f) => f?.toLowerCase().includes(q));
    });

    return (
        <div
            style={{
                display: "flex",
                minHeight: "100vh",
                background: C.bg,
                fontFamily: "'Segoe UI', system-ui, sans-serif",
            }}
        >
            <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />

            <div
                style={{
                    marginLeft: sideWidth,
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    transition: "margin-left 0.25s cubic-bezier(.4,0,.2,1)",
                    minWidth: 0,
                }}
            >
                {/* Topbar */}
                <header
                    style={{
                        background: C.white,
                        borderBottom: `1px solid ${C.slate300}`,
                        padding: "0 28px",
                        height: 64,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        position: "sticky",
                        top: 0,
                        zIndex: 50,
                    }}
                >
                    <div>
                        <h1
                            style={{
                                fontSize: 18,
                                fontWeight: 700,
                                color: C.slate,
                                letterSpacing: "-0.4px",
                            }}
                        >
                            Insertion Orders
                        </h1>
                        <p
                            style={{
                                fontSize: 11,
                                color: C.slate500,
                                marginTop: 1,
                                letterSpacing: "0.04em",
                                fontWeight: 500,
                            }}
                        >
                            VIEW & DOWNLOAD IO DOCUMENTS FOR YOUR CAMPAIGNS
                        </p>
                    </div>
                    <div
                        style={{
                            width: 36,
                            height: 36,
                            borderRadius: "50%",
                            background: C.blue,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: C.white,
                            fontSize: 12,
                            fontWeight: 800,
                        }}
                    >
                        {clientName ? clientName.charAt(0).toUpperCase() : "U"}
                    </div>
                </header>

                <main style={{ flex: 1, padding: 24, overflowY: "auto" }}>
                    {/* Info Banner */}
                    <div
                        style={{
                            background: C.blueLight,
                            border: `1px solid ${C.blueMid}`,
                            borderRadius: 12,
                            padding: "12px 18px",
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            marginBottom: 20,
                            fontSize: 13,
                            color: C.blue,
                        }}
                    >
                        <FileTextOutlined style={{ fontSize: 16, flexShrink: 0 }} />
                        <span>
                            Insertion Orders are available only for{" "}
                            <strong>approved campaigns</strong>. Each IO is auto-generated
                            from your campaign and client details.
                        </span>
                    </div>

                    {/* Stats Row */}
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(3, 1fr)",
                            gap: 14,
                            marginBottom: 20,
                        }}
                    >
                        {[
                            {
                                label: "Total",
                                value: campaigns.length,
                                icon: "📄",
                                color: C.blue,
                                bg: C.blueLight,
                            },
                            {
                                label: "This Month",
                                value: campaigns.filter((c) => {
                                    const d = new Date(c.created_at);
                                    const now = new Date();
                                    return (
                                        d.getMonth() === now.getMonth() &&
                                        d.getFullYear() === now.getFullYear()
                                    );
                                }).length,
                                icon: "📅",
                                color: C.green,
                                bg: C.greenLight,
                            },
                            {
                                label: "Active Campaigns",
                                value: campaigns.filter((c) => {
                                    if (!c.start_date || !c.end_date) return false;
                                    const today = new Date();
                                    return (
                                        today >= new Date(c.start_date) &&
                                        today <= new Date(c.end_date)
                                    );
                                }).length,
                                icon: "🟢",
                                color: C.amber,
                                bg: C.amberLight,
                            },
                        ].map((stat) => (
                            <div
                                key={stat.label}
                                style={{
                                    background: C.white,
                                    borderRadius: 12,
                                    padding: "18px 20px",
                                    border: `1px solid ${C.border}`,
                                    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 14,
                                }}
                            >
                                <div
                                    style={{
                                        width: 44,
                                        height: 44,
                                        borderRadius: 10,
                                        background: stat.bg,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontSize: 20,
                                        flexShrink: 0,
                                    }}
                                >
                                    {stat.icon}
                                </div>
                                <div>
                                    <div
                                        style={{
                                            fontSize: 28,
                                            fontWeight: 800,
                                            color: stat.color,
                                            lineHeight: 1,
                                            letterSpacing: "-1px",
                                        }}
                                    >
                                        {stat.value}
                                    </div>
                                    <div
                                        style={{
                                            fontSize: 11,
                                            color: C.slate500,
                                            fontWeight: 600,
                                            marginTop: 3,
                                            textTransform: "uppercase",
                                            letterSpacing: "0.05em",
                                        }}
                                    >
                                        {stat.label}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Search + Refresh */}
                    <div
                        style={{
                            background: C.white,
                            borderRadius: 12,
                            padding: "12px 16px",
                            border: `1px solid ${C.border}`,
                            marginBottom: 16,
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                        }}
                    >
                        <Input
                            placeholder="Search by Campaign ID, Name, Advertiser…"
                            prefix={<SearchOutlined style={{ color: C.slate500 }} />}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            allowClear
                            style={{ flex: 1, height: 36 }}
                        />
                        <Button
                            icon={<ReloadOutlined />}
                            onClick={fetchCampaigns}
                            style={{
                                height: 36,
                                borderRadius: 8,
                                border: `1px solid ${C.border}`,
                                color: C.slate500,
                                fontSize: 12,
                                fontWeight: 600,
                            }}
                        >
                            Refresh
                        </Button>
                        <span
                            style={{ fontSize: 12, color: C.slate500, whiteSpace: "nowrap" }}
                        >
                            {filtered.length} of {campaigns.length} IOs
                        </span>
                    </div>

                    {/* Table */}
                    <div
                        style={{
                            background: C.white,
                            borderRadius: 14,
                            border: `1px solid ${C.border}`,
                            overflow: "hidden",
                            boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                        }}
                    >
                        {/* Table Header */}
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns:
                                    "160px 80px 1fr 150px 120px 120px 180px",
                                padding: "10px 20px",
                                background: C.slate100,
                                borderBottom: `1px solid ${C.border}`,
                                fontSize: 11,
                                fontWeight: 700,
                                color: C.slate500,
                                textTransform: "uppercase",
                                letterSpacing: "0.04em",
                                gap: 12,
                            }}
                        >
                            <div>Campaign ID</div>
                            <div>IO #</div>
                            <div>Campaign Name</div>
                            <div>Advertiser</div>
                            <div>Start Date</div>
                            <div>End Date</div>
                            <div>Actions</div>
                        </div>

                        {/* Rows */}
                        {loading ? (
                            <div
                                style={{
                                    padding: "48px",
                                    textAlign: "center",
                                    color: C.slate500,
                                }}
                            >
                                <Spin size="large" />
                                <div style={{ marginTop: 12, fontSize: 13 }}>
                                    Loading Insertion Orders…
                                </div>
                            </div>
                        ) : filtered.length === 0 ? (
                            <div style={{ padding: "48px 24px", textAlign: "center" }}>
                                <Empty
                                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                                    description={
                                        <div>
                                            <div
                                                style={{
                                                    fontSize: 14,
                                                    fontWeight: 600,
                                                    color: C.slate,
                                                    marginBottom: 4,
                                                }}
                                            >
                                                {campaigns.length === 0
                                                    ? "No approved campaigns yet"
                                                    : "No results found"}
                                            </div>
                                            <div style={{ fontSize: 12, color: C.slate500 }}>
                                                {campaigns.length === 0
                                                    ? "Insertion Orders will appear here once your campaigns are approved by the admin."
                                                    : "Try adjusting your search query."}
                                            </div>
                                        </div>
                                    }
                                />
                            </div>
                        ) : (
                            filtered.map((campaign, idx) => {
                                const bookingIOId = `BI${campaign.id
                                    .toString()
                                    .padStart(5, "0")}`;
                                const lineItemCount = campaign.line_items?.length ?? 0;

                                return (
                                    <div
                                        key={campaign.id}
                                        style={{
                                            display: "grid",
                                            gridTemplateColumns:
                                                "160px 80px 1fr 150px 120px 120px 180px",
                                            padding: "14px 20px",
                                            borderBottom:
                                                idx < filtered.length - 1
                                                    ? `1px solid ${C.border}`
                                                    : "none",
                                            alignItems: "center",
                                            gap: 12,
                                            background: idx % 2 === 0 ? C.white : "#FAFBFC",
                                            transition: "background 0.12s",
                                        }}
                                        onMouseEnter={(e) =>
                                        ((e.currentTarget as HTMLDivElement).style.background =
                                            C.slate100)
                                        }
                                        onMouseLeave={(e) =>
                                        ((e.currentTarget as HTMLDivElement).style.background =
                                            idx % 2 === 0 ? C.white : "#FAFBFC")
                                        }
                                    >
                                        {/* Campaign ID */}
                                        <div>
                                            <span
                                                style={{
                                                    fontSize: 12,
                                                    fontWeight: 700,
                                                    color: C.blue,
                                                    background: C.blueLight,
                                                    padding: "3px 8px",
                                                    borderRadius: 6,
                                                    fontFamily: "monospace",
                                                }}
                                            >
                                                {campaign.campaign_id}
                                            </span>
                                        </div>

                                        {/* IO # */}
                                        <div>
                                            <span
                                                style={{
                                                    fontSize: 11,
                                                    fontWeight: 700,
                                                    color: C.amber,
                                                    background: C.amberLight,
                                                    padding: "3px 7px",
                                                    borderRadius: 5,
                                                    fontFamily: "monospace",
                                                    border: `1px solid #FDE68A`,
                                                }}
                                            >
                                                {bookingIOId}
                                            </span>
                                        </div>

                                        {/* Campaign Name */}
                                        <div>
                                            <div
                                                style={{
                                                    fontSize: 13,
                                                    fontWeight: 600,
                                                    color: C.slate,
                                                    marginBottom: 3,
                                                }}
                                            >
                                                {campaign.campaign_name}
                                            </div>
                                            <div
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: 6,
                                                    flexWrap: "wrap",
                                                }}
                                            >
                                                {campaign.campaign_type && (
                                                    <Tag
                                                        color="blue"
                                                        style={{ fontSize: 10, margin: 0, lineHeight: "18px" }}
                                                    >
                                                        {campaign.campaign_type}
                                                    </Tag>
                                                )}
                                                <Tag
                                                    color="purple"
                                                    style={{ fontSize: 10, margin: 0, lineHeight: "18px" }}
                                                >
                                                    {lineItemCount} line item{lineItemCount !== 1 ? "s" : ""}
                                                </Tag>
                                                <span
                                                    style={{
                                                        display: "inline-flex",
                                                        alignItems: "center",
                                                        gap: 3,
                                                        fontSize: 10,
                                                        fontWeight: 700,
                                                        color: C.green,
                                                        background: C.greenLight,
                                                        padding: "1px 6px",
                                                        borderRadius: 4,
                                                        border: "1px solid #BBF7D0",
                                                    }}
                                                >
                                                    <CheckCircleOutlined style={{ fontSize: 9 }} />
                                                    Approved
                                                </span>
                                            </div>
                                        </div>

                                        {/* Advertiser */}
                                        <div
                                            style={{
                                                fontSize: 12,
                                                color: C.slate700,
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                whiteSpace: "nowrap",
                                            }}
                                        >
                                            {campaign.advertiser || "—"}
                                        </div>

                                        {/* Start Date */}
                                        <div style={{ fontSize: 12, color: C.slate }}>
                                            {fmtDate(campaign.start_date)}
                                        </div>

                                        {/* End Date */}
                                        <div style={{ fontSize: 12, color: C.slate }}>
                                            {fmtDate(campaign.end_date)}
                                        </div>

                                        {/* Actions */}
                                        <div style={{ display: "flex", gap: 8 }}>
                                            <Button
                                                size="small"
                                                icon={<EyeOutlined />}
                                                onClick={() => handlePreview(campaign)}
                                                style={{
                                                    fontSize: 11,
                                                    fontWeight: 600,
                                                    color: C.blue,
                                                    background: C.blueLight,
                                                    border: `1px solid ${C.blueMid}`,
                                                    borderRadius: 6,
                                                    height: 30,
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: 4,
                                                }}
                                            >
                                                Preview
                                            </Button>
                                            <Button
                                                size="small"
                                                icon={<DownloadOutlined />}
                                                onClick={async () => {
                                                    setPreviewCampaign(campaign);
                                                    // Fetch client then trigger download
                                                    setDownloading(true);
                                                    let clientData: ClientDetail | null = null;
                                                    try {
                                                        const res = await fetch(
                                                            `${BASE_URL}/get_client/${clientId}/`,
                                                            { headers: { "ngrok-skip-browser-warning": "1" } }
                                                        );
                                                        if (res.ok) clientData = await res.json();
                                                    } catch {
                                                        // ignore
                                                    }
                                                    const html = generateIOHtml(campaign, clientData);
                                                    const printWindow = window.open(
                                                        "",
                                                        "_blank",
                                                        "width=1000,height=800"
                                                    );
                                                    if (!printWindow) {
                                                        alert("Please allow popups to download the PDF.");
                                                        setDownloading(false);
                                                        return;
                                                    }
                                                    printWindow.document.write(html);
                                                    printWindow.document.close();
                                                    setTimeout(() => {
                                                        printWindow.focus();
                                                        printWindow.print();
                                                        setTimeout(() => {
                                                            printWindow.close();
                                                            setDownloading(false);
                                                        }, 2000);
                                                    }, 800);
                                                }}
                                                style={{
                                                    fontSize: 11,
                                                    fontWeight: 600,
                                                    color: C.green,
                                                    background: C.greenLight,
                                                    border: "1px solid #BBF7D0",
                                                    borderRadius: 6,
                                                    height: 30,
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: 4,
                                                }}
                                            >
                                                Download
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Loading client hint inside preview */}
                    {loadingClient && previewCampaign && (
                        <div
                            style={{
                                position: "fixed",
                                bottom: 24,
                                left: "50%",
                                transform: "translateX(-50%)",
                                background: C.white,
                                border: `1px solid ${C.border}`,
                                borderRadius: 10,
                                padding: "10px 18px",
                                fontSize: 13,
                                color: C.slate500,
                                boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                zIndex: 2000,
                            }}
                        >
                            <Spin size="small" />
                            Loading client details for IO…
                        </div>
                    )}
                </main>
            </div>

            {/* IO Preview Modal */}
            <IOPreviewModal
                open={!!previewCampaign}
                campaign={previewCampaign}
                client={previewClient}
                onClose={() => {
                    setPreviewCampaign(null);
                    setPreviewClient(null);
                }}
                onDownload={handleDownload}
                downloading={downloading}
            />

            <style>{`
        .ant-table-thead > tr > th {
          background: #F1F5F9 !important;
        }
      `}</style>
        </div>
    );
}